const db = require('../models');
const { ValidationError } = require('sequelize');

// Validation function
const validateVHISubmission = (data) => {
  const errors = [];
  
  if (!data.userId) errors.push('userId is required');
  if (!data.sessionId) errors.push('sessionId is required');
  if (!data.functionalScores) errors.push('functionalScores is required');
  if (!data.physicalScores) errors.push('physicalScores is required');
  if (!data.emotionalScores) errors.push('emotionalScores is required');
  
  // Validate scores structure
  if (data.functionalScores && Object.keys(data.functionalScores).length !== 10) {
    errors.push('functionalScores must contain exactly 10 questions');
  }
  if (data.physicalScores && Object.keys(data.physicalScores).length !== 10) {
    errors.push('physicalScores must contain exactly 10 questions');
  }
  if (data.emotionalScores && Object.keys(data.emotionalScores).length !== 10) {
    errors.push('emotionalScores must contain exactly 10 questions');
  }
  
  // Validate score values
  const validateScoreValues = (scores, prefix) => {
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value !== 'number' || value < 0 || value > 4) {
        errors.push(`${prefix}.${key} must be a number between 0 and 4`);
      }
    }
  };
  
  if (data.functionalScores) validateScoreValues(data.functionalScores, 'functionalScores');
  if (data.physicalScores) validateScoreValues(data.physicalScores, 'physicalScores');
  if (data.emotionalScores) validateScoreValues(data.emotionalScores, 'emotionalScores');
  
  return errors;
};

exports.submitVHI = async (req, res, next) => {
  try {
    console.log('📥 Received VHI submission:', JSON.stringify(req.body, null, 2));
    
    const { userId, sessionId, functionalScores, physicalScores, emotionalScores, language, durationMinutes } = req.body;

    // Validate required fields
    const validationErrors = validateVHISubmission(req.body);
    if (validationErrors.length > 0) {
      console.log('❌ VHI validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: "Invalid submission data",
        errors: validationErrors
      });
    }

    // Validate language
    const validLanguages = ['english', 'malayalam'];
    const assessmentLanguage = language && validLanguages.includes(language) ? language : 'english';

    // Calculate subscores and total score
    const functionalSubscore = Object.values(functionalScores).reduce((a, b) => a + b, 0);
    const physicalSubscore = Object.values(physicalScores).reduce((a, b) => a + b, 0);
    const emotionalSubscore = Object.values(emotionalScores).reduce((a, b) => a + b, 0);
    const totalScore = functionalSubscore + physicalSubscore + emotionalSubscore;

    console.log('📊 Calculated scores:', {
      functionalSubscore,
      physicalSubscore,
      emotionalSubscore,
      totalScore
    });

    // Check if VHI model exists
    if (!db.VHI) {
      console.error('❌ VHI model not found in database models');
      return res.status(500).json({
        success: false,
        message: "Database configuration error: VHI model not found"
      });
    }

    // Create record
    const record = await db.VHI.create({
      userId: parseInt(userId),
      sessionId,
      functionalScores,
      physicalScores,
      emotionalScores,
      totalScore,
      functionalSubscore,
      physicalSubscore,
      emotionalSubscore,
      language: assessmentLanguage,
      durationMinutes: durationMinutes || 0,
      dateCompleted: new Date()
    });

    console.log('✅ VHI record created successfully:', record.id);

    return res.status(201).json({
      success: true,
      message: "VHI assessment saved successfully",
      data: {
        id: record.id,
        totalScore,
        functionalSubscore,
        physicalSubscore,
        emotionalSubscore,
        language: record.language
      }
    });

  } catch (error) {
    console.error("❌ Error saving VHI assessment:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }
    
    // Handle Sequelize database errors
    if (error.name === 'SequelizeDatabaseError') {
      console.error("❌ Database error details:", error.original);
      return res.status(500).json({
        success: false,
        message: "Database error occurred",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Referenced user does not exist",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "Server error while saving VHI assessment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getVHIHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { language } = req.query;

    console.log(`📥 Fetching VHI history for user ${userId}, language: ${language}`);

    let whereClause = { userId: parseInt(userId) };
    if (language) {
      whereClause.language = language;
    }

    const assessments = await db.VHI.findAll({
      where: whereClause,
      order: [['dateCompleted', 'DESC']],
      attributes: [
        'id', 
        'totalScore', 
        'functionalSubscore', 
        'physicalSubscore', 
        'emotionalSubscore', 
        'dateCompleted',
        'language',
        'durationMinutes'
      ]
    });

    console.log(`✅ Found ${assessments.length} VHI assessments`);

    return res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error("❌ Error fetching VHI history:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching VHI history",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getVHIQuestions = async (req, res) => {
  try {
    const { language } = req.params;
    
    console.log(`📥 Fetching VHI questions for language: ${language}`);
    
    const validLanguages = ['english', 'malayalam'];
    const questionLanguage = validLanguages.includes(language) ? language : 'english';
    
    let questions;
    
    if (questionLanguage === 'malayalam') {
      questions = {
        functional: [
          { number: 1, text: "എന്റെ ശബ്ദം മൂലം ആളുകൾക്ക് എന്നെ കേൾക്കാൻ ബുദ്ധിമുട്ട് ഉണ്ടാകുന്നു." },
          { number: 2, text: "ഒച്ചപ്പാട് ഉള്ള മുറിയിൽ ആളുകൾക്ക് എന്നെ മനസ്സിലാക്കാൻ ബുദ്ധിമുട്ട് ഉണ്ടാകുന്നു." },
          { number: 3, text: "എന്റെ ശബ്ദ പ്രശ്നങ്ങൾ വ്യക്തിപരമായും സാമൂഹികവുമായ ജീവിതത്തെ പരിമിതപ്പെടുത്തുന്നു." },
          { number: 4, text: "എന്റെ ശബ്ദം മൂലം സംഭാഷണങ്ങളിൽ നിന്ന് ഒഴിവാക്കപ്പെടുന്നതായി ഞാൻ അനുഭവിക്കുന്നു." },
          { number: 5, text: "എന്റെ ശബ്ദ പ്രശ്നം മൂലം ആളുകളുടെ സമൂഹങ്ങൾ ഒഴിവാക്കാൻ ഞാൻ നിർബന്ധിതനാകുന്നു." },
          { number: 6, text: "മുഖാമുഖം സംസാരിക്കുമ്പോൾ ആളുകൾ എന്നോട് വീണ്ടും പറയാൻ ആവശ്യപ്പെടുന്നു." },
          { number: 7, text: "ഞാൻ ആഗ്രഹിക്കുന്നതിനേക്കാൾ കുറച്ച് തവണ മാത്രമേ ടെലിഫോൺ ഉപയോഗിക്കുന്നുള്ളൂ." },
          { number: 8, text: "എന്റെ ശബ്ദ പ്രശ്നം കുടുംബാംഗങ്ങളും സുഹൃത്തുക്കളുമായുള്ള ആശയവിനിമയത്തെ പരിമിതപ്പെടുത്തുന്നു." },
          { number: 9, text: "എന്റെ ശബ്ദം മൂലം ഞാൻ വൈകല്യം അനുഭവിക്കുന്നു." },
          { number: 10, text: "എന്റെ ശബ്ദ പ്രശ്നം മൂലം വൈകാരികമായി എന്നെത്തന്നെ പ്രകടിപ്പിക്കാൻ ബുദ്ധിമുട്ട് ഉണ്ടാകുന്നു." }
        ],
        physical: [
          { number: 11, text: "സംസാരിക്കുമ്പോൾ എനിക്ക് ശ്വാസം മുട്ടുന്നു." },
          { number: 12, text: "ദിവസം മുഴുവൻ എന്റെ ശബ്ദത്തിന്റെ ശബ്ദം വ്യത്യാസപ്പെടുന്നു." },
          { number: 13, text: "ആളുകൾക്ക് എന്നെ കേൾക്കാൻ ബുദ്ധിമുട്ട് ഉണ്ടാകുന്നു." },
          { number: 14, text: "സംസാരിക്കാൻ എനിക്ക് വളരെയധികം പരിശ്രമം ചെയ്യേണ്ടിവരുന്നു." },
          { number: 15, text: "എന്റെ ശബ്ദം ദുർബലമോ ശ്വാസമിക്തമോ ആണ്." },
          { number: 16, text: "സംസാരിക്കുമ്പോൾ വേദനയോ അസ്വസ്ഥതയോ ഞാൻ അനുഭവിക്കുന്നു." },
          { number: 17, text: "സംസാരിക്കുമ്പോൾ എന്റെ ശബ്ദം ഇടയ്ക്ക് നിലക്കുന്നു." },
          { number: 18, text: "ശബ്ദം ഉണ്ടാക്കാൻ ഞാൻ ബലപ്രയോഗം ചെയ്യേണ്ടിവരുന്നതായി തോന്നുന്നു." },
          { number: 19, text: "എന്റെ ശബ്ദം പ്രൊജക്റ്റ് ചെയ്യാൻ എനിക്ക് ബുദ്ധിമുട്ടാണ്." },
          { number: 20, text: "എന്റെ ശബ്ദം കർശനമോ പരുക്കനോ ആണ്." }
        ],
        emotional: [
          { number: 21, text: "എന്റെ ശബ്ദം മൂലം മറ്റുള്ളവരോട് സംസാരിക്കുമ്പോൾ ഞാൻ പിരിമുറുക്കം അനുഭവിക്കുന്നു." },
          { number: 22, text: "എന്റെ ശബ്ദത്താൽ ആളുകൾക്ക് ശല്യം തോന്നുന്നു." },
          { number: 23, text: "മറ്റുള്ളവർ എന്റെ ശബ്ദ പ്രശ്നം മനസ്സിലാക്കുന്നില്ലെന്ന് ഞാൻ കണ്ടെത്തുന്നു." },
          { number: 24, text: "എന്റെ ശബ്ദ പ്രശ്നം എന്നെ അസ്വസ്ഥനാക്കുന്നു." },
          { number: 25, text: "എന്റെ ശബ്ദ പ്രശ്നം മൂലം ഞാൻ കുറച്ച് സാമൂഹികമാകുന്നു." },
          { number: 26, text: "എന്റെ ശബ്ദം എന്നെ അപ്രാപ്തനാണെന്ന് തോന്നിക്കുന്നു." },
          { number: 27, text: "ആളുകൾ എന്നോട് വീണ്ടും പറയാൻ ആവശ്യപ്പെടുമ്പോൾ എനിക്ക് ശല്യം തോന്നുന്നു." },
          { number: 28, text: "ആളുകൾ എന്നോട് വീണ്ടും പറയാൻ ആവശ്യപ്പെടുമ്പോൾ എനിക്ക് ലജ്ജ തോന്നുന്നു." },
          { number: 29, text: "എന്റെ ശബ്ദം എന്നെ നിരാശനാക്കുന്നു." },
          { number: 30, text: "എന്റെ ശബ്ദ പ്രശ്നം മൂലം ഞാൻ വിഷാദം അനുഭവിക്കുന്നു." }
        ]
      };
    } else {
      questions = {
        functional: [
          { number: 1, text: "My voice makes it difficult for people to hear me." },
          { number: 2, text: "People have difficulty understanding me in a noisy room." },
          { number: 3, text: "My voice difficulties restrict personal and social life." },
          { number: 4, text: "I feel left out of conversations because of my voice." },
          { number: 5, text: "My voice problem causes me to avoid groups of people." },
          { number: 6, text: "People ask me to repeat myself when speaking face-to-face." },
          { number: 7, text: "I use the telephone less often than I would like." },
          { number: 8, text: "My voice problem limits my communication with family and friends." },
          { number: 9, text: "I feel handicapped because of my voice." },
          { number: 10, text: "My voice problem makes it difficult for me to express myself emotionally." }
        ],
        physical: [
          { number: 11, text: "I run out of air when I talk." },
          { number: 12, text: "The sound of my voice varies throughout the day." },
          { number: 13, text: "People have difficulty hearing me." },
          { number: 14, text: "I use a great deal of effort to speak." },
          { number: 15, text: "My voice is weak or breathy." },
          { number: 16, text: "I experience pain or discomfort when speaking." },
          { number: 17, text: "My voice 'gives out' on me in the middle of speaking." },
          { number: 18, text: "I feel as though I have to strain to produce voice." },
          { number: 19, text: "I find it difficult to project my voice." },
          { number: 20, text: "My voice is hoarse or rough." }
        ],
        emotional: [
          { number: 21, text: "I am tense when talking with others because of my voice." },
          { number: 22, text: "People seem irritated by my voice." },
          { number: 23, text: "I find other people don't understand my voice problem." },
          { number: 24, text: "My voice problem upsets me." },
          { number: 25, text: "I am less outgoing because of my voice problem." },
          { number: 26, text: "My voice makes me feel incompetent." },
          { number: 27, text: "I feel annoyed when people ask me to repeat." },
          { number: 28, text: "I feel embarrassed when people ask me to repeat." },
          { number: 29, text: "My voice makes me feel frustrated." },
          { number: 30, text: "I am depressed because of my voice problem." }
        ]
      };
    }

    console.log(`✅ Returning VHI questions in ${questionLanguage}`);

    return res.status(200).json({
      success: true,
      data: {
        language: questionLanguage,
        questions
      }
    });
  } catch (error) {
    console.error("❌ Error fetching VHI questions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching VHI questions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};