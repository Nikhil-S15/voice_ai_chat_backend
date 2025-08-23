const db = require('../models');

exports.submitGRBASRating = async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      taskNumber,
      gScore,
      rScore,
      bScore,
      aScore,
      sScore,
      clinicianName,
      evaluationDate,
      comments
    } = req.body;

    if (!userId || !sessionId || !taskNumber || clinicianName === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ Required fields are missing." 
      });
    }

    // Check user exists
    const userExists = await db.Onboarding.findOne({ where: { userId } });
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ User not found." 
      });
    }

    const rating = await db.GRBASRating.create({
      userId,
      sessionId,
      taskNumber,
      gScore,
      rScore,
      bScore,
      aScore,
      sScore,
      clinicianName,
      evaluationDate,
      comments
    });

    res.status(201).json({
      success: true,
      message: "✅ GRBAS rating saved successfully",
      rating
    });
  } catch (err) {
    console.error("❌ Error saving GRBAS rating:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

exports.getGRBASRatings = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ User ID and Session ID are required." 
      });
    }

    const ratings = await db.GRBASRating.findAll({
      where: { userId, sessionId },
      order: [['taskNumber', 'ASC']]
    });

    res.status(200).json({
      success: true,
      ratings
    });
  } catch (err) {
    console.error("❌ Error getting GRBAS ratings:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};