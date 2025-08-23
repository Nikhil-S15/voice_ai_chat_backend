const db = require('../models');
const { uploadToCloudStorage } = require('../services/storageService');
const { validateRecording } = require('../validators/acousticTaskValidator');

exports.assignTasks = async (req, res) => {
  try {
    const { userId, condition } = req.body;
    
    // Validate user exists
    const user = await db.Onboarding.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Assign tasks based on condition (simplified example)
    let tasks = [];
    if (condition === 'oral_cancer') {
      tasks = [
        { type: 'prolonged_vowel', language: 'en' },
        { type: 'rainbow_passage', language: 'en' },
        { type: 'malayalam_vowels', language: 'ml' }
      ];
    } else if (condition === 'larynx') {
      tasks = [
        { type: 'maximum_phonation', language: 'en' },
        { type: 'free_speech', language: 'en' }
      ];
    }

    res.json({ 
      success: true, 
      tasks 
    });
  } catch (err) {
    console.error("Task assignment error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to assign tasks" 
    });
  }
};

exports.uploadRecording = async (req, res) => {
  try {
    const { userId, sessionId, taskType, language, recordingDevice } = req.body;
    const audioFile = req.file;

    // Validate input
    const validation = validateRecording({
      userId,
      sessionId,
      taskType, 
      language,
      recordingDevice,
      audioFile
    });
    
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.errors.join(', ') 
      });
    }

    // Upload to cloud storage
    const fileUrl = await uploadToCloudStorage(
      audioFile, 
      `recordings/${userId}/${sessionId}/${taskType}_${Date.now()}`
    );

    // Create task record
    const task = await db.AcousticTask.create({
      userId,
      sessionId,
      taskType,
      language,
      audioFileUrl: fileUrl,
      durationMs: req.body.durationMs,
      sampleRate: req.body.sampleRate,
      bitDepth: req.body.bitDepth,
      recordingDevice,
      taskCompletedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Recording uploaded successfully",
      taskId: task.id
    });
  } catch (err) {
    console.error("Recording upload error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to upload recording" 
    });
  }
};

exports.submitGRBAS = async (req, res) => {
  try {
    const { taskId, grade, roughness, breathiness, asthenia, strain, notes } = req.body;
    
    // Validate GRBAS scores (0-3)
    const scores = { grade, roughness, breathiness, asthenia, strain };
    for (const [key, value] of Object.entries(scores)) {
      if (value < 0 || value > 3) {
        return res.status(400).json({ 
          success: false, 
          message: `${key} must be between 0-3` 
        });
      }
    }

    const updated = await db.AcousticTask.update({
      grade,
      roughness,
      breathiness,
      asthenia,
      strain,
      clinicianNotes: notes
    }, {
      where: { id: taskId }
    });

    if (updated[0] === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Task not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "GRBAS ratings submitted" 
    });
  } catch (err) {
    console.error("GRBAS submission error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit GRBAS ratings" 
    });
  }
};