const db = require('../models');

exports.startQuestionnaire = async (req, res) => {
  try {
    const { assignmentId, questionnaireType, language } = req.body;

    if (!assignmentId || !questionnaireType || !language) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if assignment exists
    const assignment = await db.TaskAssignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Create questionnaire record
    const questionnaire = await db.QuestionnaireResponse.create({
      assignmentId,
      questionnaireType,
      language,
      startTime: new Date()
    });

    // Get questionnaire content based on type and language
    const questions = getQuestionnaireContent(questionnaireType, language);

    res.status(201).json({
      success: true,
      message: "Questionnaire started",
      data: {
        questionnaireId: questionnaire.id,
        questions,
        questionnaireType,
        language
      }
    });
  } catch (err) {
    console.error("Start questionnaire error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.submitQuestionnaire = async (req, res) => {
  try {
    const { questionnaireId, responses } = req.body;

    if (!questionnaireId || !responses) {
      return res.status(400).json({ success: false, message: "Questionnaire ID and responses are required" });
    }

    // Find questionnaire
    const questionnaire = await db.QuestionnaireResponse.findByPk(questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ success: false, message: "Questionnaire not found" });
    }

    // Calculate scores
    let totalScore = 0;
    let functionalScore = 0;
    let physicalScore = 0;
    let emotionalScore = 0;

    if (questionnaire.questionnaireType === 'vhi_english' || questionnaire.questionnaireType === 'vhi_multilingual') {
      // Calculate VHI scores
      Object.entries(responses).forEach(([questionNumber, score]) => {
        const num = parseInt(questionNumber);
        totalScore += score;

        if (num <= 10) {
          functionalScore += score;
        } else if (num <= 20) {
          physicalScore += score;
        } else {
          emotionalScore += score;
        }
      });
    }

    // Update questionnaire
    await questionnaire.update({
      responses,
      totalScore,
      functionalScore,
      physicalScore,
      emotionalScore,
      endTime: new Date(),
      completed: true
    });

    res.status(200).json({
      success: true,
      message: "Questionnaire submitted successfully",
      data: questionnaire
    });
  } catch (err) {
    console.error("Submit questionnaire error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function to get questionnaire content
function getQuestionnaireContent(type, language) {
  if (type === 'vhi_english') {
    return {
      title: "Voice Handicap Index (VHI) – English",
      instructions: "The following statements describe how your voice problem influences your daily activities. Please indicate how frequently you experience each item by selecting the appropriate option.",
      questions: [
        { number: 1, text: "My voice makes it difficult for people to hear me." },
        { number: 2, text: "People have difficulty understanding me in a noisy room." },
        // ... all 30 VHI questions
      ],
      scale: [
        { value: 0, label: "Never" },
        { value: 1, label: "Almost Never" },
        { value: 2, label: "Sometimes" },
        { value: 3, label: "Almost Always" },
        { value: 4, label: "Always" }
      ]
    };
  } else if (type === 'vhi_multilingual') {
    if (language === 'malayalam') {
      return {
        title: "വോയ്സ് ഹാൻഡികാപ്പ് ഇൻഡക്സ് (VHI) – മലയാളം",
        instructions: "താഴെപ്പറയുന്ന പ്രസ്താവനകൾ നിങ്ങളുടെ ശബ്ദ പ്രശ്നം നിങ്ങളുടെ ദിനചര്യയെ എങ്ങനെ ബാധിക്കുന്നു എന്നത് വിശദീകരിക്കുന്നു. ഓരോ ഇനത്തിലും നിങ്ങൾ എത്രത്തോളം അനുഭവിക്കുന്നുവെന്ന് സൂചിപ്പിക്കുക.",
        questions: [
          { number: 1, text: "എന്റെ ശബ്ദം കാരണം ആളുകൾക്ക് എന്നെ കേൾക്കാൻ ബുദ്ധിമുട്ടാണ്." },
          { number: 2, text: "ശബ്ദമുള്ള മുറിയിൽ എന്റെ ശബ്ദം മനസ്സിലാക്കാൻ ബുദ്ധിമുട്ടാണ്." },
          // ... selected VHI questions in Malayalam
        ],
        scale: [
          { value: 0, label: "ഒരിക്കലുമില്ല" },
          { value: 1, label: "എപ്പോഴും ഇല്ലാതിരിക്കുക" },
          { value: 2, label: "ഒരിക്കൽക്കധികം" },
          { value: 3, label: "പലപ്പോഴും" },
          { value: 4, label: "എല്ലായ്പ്പോഴും" }
        ]
      };
    } else {
      return {
        title: "Voice Handicap Index (VHI) – Hindi",
        instructions: "निम्नलिखित वक्तव्य यह वर्णन करते हैं कि आपकी आवाज़ की समस्या आपके दैनिक जीवन को किस प्रकार प्रभावित करती है। कृपया प्रत्येक वक्तव्य का उत्तर दें।",
        questions: [
          { number: 1, text: "मेरी आवाज़ के कारण लोगों को मुझे सुनने में कठिनाई होती है।" },
          { number: 2, text: "शोर वाले कमरे में मेरी आवाज़ को समझना मुश्किल होता है।" },
          // ... selected VHI questions in Hindi
        ],
        scale: [
          { value: 0, label: "कभी नहीं" },
          { value: 1, label: "लगभग कभी नहीं" },
          { value: 2, label: "कभी-कभी" },
          { value: 3, label: "लगभग हमेशा" },
          { value: 4, label: "हमेशा" }
        ]
      };
    }
  }
  
  return null;
}