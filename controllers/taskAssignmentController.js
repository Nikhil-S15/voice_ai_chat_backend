const db = require('../models');
const { Op } = require('sequelize');

// Task definitions
const TASK_CONFIG = {
  oral_cancer: {
    required: [
      { type: 'prolonged_vowel', language: 'en' },
      { type: 'rainbow_passage', language: 'en' }
    ],
    optional: [
      { type: 'malayalam_passage', language: 'ml' }
    ]
  },
  larynx_hypopharynx: {
    required: [
      { type: 'maximum_phonation', language: 'en' },
      { type: 'free_speech', language: 'en' }
    ],
    optional: []
  },
  pharynx_cancer: {
    required: [
      { type: 'prolonged_vowel', language: 'en' },
      { type: 'malayalam_words', language: 'ml' }
    ],
    optional: [
      { type: 'pitch_glides', language: 'en' }
    ]
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { userId, sessionId, condition } = req.body;
    
    // Validate input
    if (!userId || !sessionId || !condition) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Check if user exists
    const user = await db.Onboarding.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get task configuration for condition
    const config = TASK_CONFIG[condition] || TASK_CONFIG.other;
    const assignedTasks = [...config.required];
    
    // Add optional tasks if needed
    if (config.optional.length > 0) {
      assignedTasks.push(...config.optional);
    }

    // Create assignment
    const assignment = await db.TaskAssignment.create({
      userId,
      sessionId,
      condition,
      assignedTasks,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      assignment,
      tasks: assignedTasks
    });
  } catch (err) {
    console.error("Assignment creation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create task assignment"
    });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    // Find active assignment
    const assignment = await db.TaskAssignment.findOne({
      where: {
        userId,
        sessionId,
        status: { [Op.ne]: 'completed' }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active task assignment found"
      });
    }

    res.json({
      success: true,
      tasks: assignment.assignedTasks,
      completed: assignment.completedTasks
    });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get tasks"
    });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { userId, sessionId, taskType, language } = req.body;
    
    // Find active assignment
    const assignment = await db.TaskAssignment.findOne({
      where: {
        userId,
        sessionId,
        status: { [Op.ne]: 'completed' }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active task assignment found"
      });
    }

    // Update completed tasks
    const completedTask = { type: taskType, language, completedAt: new Date() };
    const updated = await assignment.update({
      completedTasks: [...assignment.completedTasks, completedTask],
      status: assignment.assignedTasks.length === assignment.completedTasks.length + 1 
        ? 'completed' 
        : 'in_progress'
    });

    res.json({
      success: true,
      assignment: updated
    });
  } catch (err) {
    console.error("Complete task error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to complete task"
    });
  }
};