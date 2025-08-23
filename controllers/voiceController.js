const db = require('../models');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// Supported audio file extensions
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

exports.validateRecording = [
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No audio file uploaded" 
      });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
      });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }

    next();
  }
];

exports.submitRecording = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation errors",
        errors: errors.array() 
      });
    }

    const { userId, sessionId, taskType, language, duration } = req.body;
    
    // Validate required fields
    if (!userId || !sessionId || !taskType || !language) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Check if user exists
    const userExists = await db.Onboarding.findOne({ where: { userId } });
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename with date prefix
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const filename = `${datePrefix}_${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    fs.writeFileSync(filePath, req.file.buffer);

    // Save recording data
    const recording = await db.VoiceRecording.create({
      userId,
      sessionId,
      taskType,
      language,
      audioFilePath: `/uploads/recordings/${filename}`,
      durationSeconds: duration || 0
    });

    res.status(201).json({
      success: true,
      message: "Recording saved successfully",
      data: {
        recordingId: recording.id,
        filePath: recording.audioFilePath,
        duration: recording.durationSeconds,
        createdAt: recording.createdAt
      }
    });

  } catch (err) {
    console.error("Recording save error:", err);
    
    // Clean up file if saving to DB failed
    if (req.file && filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error("Error cleaning up file:", cleanupErr);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getInstructions = (req, res) => {
  const { language } = req.params;
  
  const instructions = {
    english: [
      { id: 1, text: "Take a deep breath and say the vowel sound /a/ (as in 'car') for as long as you can in one breath. Try to keep your voice steady and clear." },
      { id: 2, text: "Breathe in deeply and hold the vowel /a/ for as long as possible in one breath. The goal is to measure how long you can produce sound without taking another breath." },
      { id: 3, text: "You will be shown a short paragraph called the 'Rainbow Passage'. Read it aloud in your natural voice and pace." },
      { id: 4, text: "Start by making a low-pitched sound and smoothly glide to a high-pitched sound, like a siren. Then do the reverse: from high to low pitch." },
      { id: 5, text: "Say the vowel /a/ three times: first softly, then in your normal voice, and then loudly. Try to make each version as distinct as possible." },
      { id: 6, text: "Speak about a topic of your choice, such as your day or a favorite memory, for about 30 to 60 seconds. Speak naturally and continuously." },
      { id: 7, text: "Sit calmly and breathe normally. We will observe your breathing patterns. You do not need to do anything special." },
      { id: 8, text: "If you feel a natural urge to cough, please do so. This will help us understand your natural cough reflex." },
      { id: 9, text: "Take a deep breath and cough as if you are trying to clear your throat. Do this once or twice." },
      { id: 10, text: "Breathe normally through your mouth for a few seconds. We will listen to the sounds of your breathing." }
    ],
    malayalam: [
      { id: 1, text: "ഒരു ദീപമായി ശ്വാസം എടുക്കുക, ശേഷം അക്ഷരം /ആ/ ദീർഘകാലം വരെ ഒരു ശ്വാസത്തിൽ ഉച്ചരിക്കുക. ശബ്ദം സ്ഥിരതയോടെ പറയാൻ ശ്രമിക്കുക." },
      { id: 2, text: "ഒരു ദീപമായി ശ്വാസം എടുക്കുക, ശേഷം അക്ഷരം /ആ/ ഒരേ ശ്വാസത്തിൽ എത്ര നാളം വരെ നിലനിർത്താനാകുമെന്നത് പരിശോധിക്കുക." },
      { id: 3, text: "താഴെ നൽകിയിരിക്കുന്ന പാരഗ്രാഫ് ഉച്ചരിക്കുക. നിങ്ങളുടെ സ്വാഭാവിക ശബ്ദത്തിലും ശൈലിയിലുമാണ് വായിക്കേണ്ടത്." },
      { id: 4, text: "താഴെയുള്ള ശബ്ദത്തിൽ തുടങ്ങുകയും ക്രമേണ ഉയർന്ന ശബ്ദത്തിലേക്ക് നീങ്ങുകയും ചെയ്യുക. പിന്നീട് വീണ്ടും താഴേക്ക് പോകുക." },
      { id: 5, text: "/ആ/ അക്ഷരം മൂന്ന് തവണ ഉച്ചരിക്കുക – ആദ്യം നിസ്സാരമായി, തുടർന്ന് സ്വാഭാവികമായി, പിന്നെ ബലമായി." },
      { id: 6, text: "നിങ്ങളുടെ ദിനചര്യയെക്കുറിച്ച്, ഒരു യാത്രയെക്കുറിച്ച് അല്ലെങ്കിൽ ഓർമ്മകളെക്കുറിച്ച് 30-60 സെക്കന്റ് വരെ സ്വതന്ത്രമായി സംസാരിക്കുക." },
      { id: 7, text: "സാധാരണ നിലയിൽ ഇരിക്കുക, സ്വാഭാവികമായി ശ്വാസമെടുക്കുക. ശ്വാസമെടുക്കലിന്റെ താളവും രീതി പരിശോധിക്കും." },
      { id: 8, text: "ചുമവേണ്ടതായിട്ടുള്ള സ്വാഭാവിക ആവശ്യം ഉണ്ടെങ്കിൽ, ചുമിക. ഇത് നിങ്ങളുടെ സ്വാഭാവിക പ്രതിചരണങ്ങൾ വിലയിരുത്താൻ സഹായിക്കും." },
      { id: 9, text: "ഒരു ദീപമായ ശ്വാസം എടുക്കുക, ശേഷം അറിയിപ്പോടെ ചുമിക്കുക." },
      { id: 10, text: "വായിലൂടെ പതുക്കെ ശ്വാസമെടുക്കുക. ശബ്ദപരിശോധനക്കായി ഈ ശ്വാസ ശബ്ദങ്ങൾ രേഖപ്പെടുത്തപ്പെടും." }
    ]
  };

  if (!instructions[language]) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid language specified. Supported languages: english, malayalam" 
    });
  }

  res.json({
    success: true,
    data: {
      language,
      instructions: instructions[language]
    }
  });
};

exports.getUserRecordings = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID and Session ID are required" 
      });
    }

    const recordings = await db.VoiceRecording.findAll({
      where: { userId, sessionId },
      attributes: ['id', 'taskType', 'language', 'durationSeconds', 'recordingDate'],
      order: [['recordingDate', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        count: recordings.length,
        recordings
      }
    });
  } catch (err) {
    console.error("Error fetching recordings:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};