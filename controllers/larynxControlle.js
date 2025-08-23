const db = require('../models');

exports.submitLarynxCancer = async (req, res) => {
  try {
    const { userId, sessionId, diagnosisConfirmed, followupStatus } = req.body;

    // Validate required fields
    if (!userId || !sessionId || !diagnosisConfirmed || !followupStatus) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, sessionId, diagnosisConfirmed, or followupStatus"
      });
    }

    // Check user exists
    const userExists = await db.Onboarding.findOne({ where: { userId } });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found. Complete onboarding first."
      });
    }

    // Calculate duration if timestamps are provided
    let durationMinutes = null;
    if (req.body.startedAt && req.body.completedAt) {
      durationMinutes = Math.round(
        (new Date(req.body.completedAt) - new Date(req.body.startedAt)) / 60000
      );
    }

    // Prepare data for creation
    const formData = {
      ...req.body,
      durationMinutes,
      followupStatus: Array.isArray(req.body.followupStatus) 
        ? req.body.followupStatus 
        : [req.body.followupStatus]
    };

    // Save to database
    const record = await db.LarynxHypopharynx.create(formData);

    return res.status(201).json({
      success: true,
      message: "Larynx/Hypopharynx data saved successfully",
      recordId: record.id
    });

  } catch (error) {
    console.error("Error saving larynx/hypopharynx data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving larynx/hypopharynx data",
      error: error.message
    });
  }
};