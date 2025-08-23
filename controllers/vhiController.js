const db = require('../models');

exports.submitVHI = async (req, res) => {
  try {
    const { userId, sessionId, functionalScores, physicalScores, emotionalScores } = req.body;

    // Validate required fields
    if (!userId || !sessionId || !functionalScores || !physicalScores || !emotionalScores) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Calculate subscores and total score
    const functionalSubscore = Object.values(functionalScores).reduce((a, b) => a + b, 0);
    const physicalSubscore = Object.values(physicalScores).reduce((a, b) => a + b, 0);
    const emotionalSubscore = Object.values(emotionalScores).reduce((a, b) => a + b, 0);
    const totalScore = functionalSubscore + physicalSubscore + emotionalSubscore;

    // Create record
    const record = await db.VHI.create({
      userId,
      sessionId,
      functionalScores,
      physicalScores,
      emotionalScores,
      totalScore,
      functionalSubscore,
      physicalSubscore,
      emotionalSubscore,
      dateCompleted: new Date()
    });

    return res.status(201).json({
      success: true,
      message: "VHI assessment saved successfully",
      data: {
        id: record.id,
        totalScore,
        functionalSubscore,
        physicalSubscore,
        emotionalSubscore
      }
    });

  } catch (error) {
    console.error("Error saving VHI assessment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving VHI assessment",
      error: error.message
    });
  }
};

exports.getVHIHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const assessments = await db.VHI.findAll({
      where: { userId },
      order: [['dateCompleted', 'DESC']],
      attributes: ['id', 'totalScore', 'functionalSubscore', 'physicalSubscore', 'emotionalSubscore', 'dateCompleted']
    });

    return res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error("Error fetching VHI history:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching VHI history",
      error: error.message
    });
  }
};