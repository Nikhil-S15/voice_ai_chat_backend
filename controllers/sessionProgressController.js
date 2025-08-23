// controllers/sessionProgressController.js

const db = require("../models");

exports.saveProgress = async (req, res) => {
  try {
    const { userId, sessionId, currentPage, progressData } = req.body;

    if (!userId || !sessionId || !currentPage || !progressData) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Upsert (insert or update) session progress by userId + sessionId
    const [progress, created] = await db.SessionProgress.upsert({
      userId,
      sessionId,
      currentPage,
      progressData,
      isComplete: false
    });

    res.json({ success: true, message: "Progress saved successfully" });
  } catch (error) {
    console.error("Error saving progress:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const { userId, sessionId } = req.query;

    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: "Missing userId or sessionId" });
    }

    const progress = await db.SessionProgress.findOne({
      where: { userId, sessionId, isComplete: false }
    });

    if (!progress) {
      return res.status(404).json({ success: false, message: "No saved progress found" });
    }

    res.json({
      success: true,
      currentPage: progress.currentPage,
      progressData: progress.progressData
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.completeProgress = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: "Missing userId or sessionId" });
    }

    const updated = await db.SessionProgress.update(
      { isComplete: true },
      { where: { userId, sessionId } }
    );

    res.json({ success: true, message: "Session marked as complete" });
  } catch (error) {
    console.error("Error completing progress:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
