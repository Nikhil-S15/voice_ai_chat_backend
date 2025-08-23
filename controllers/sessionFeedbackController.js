const db = require('../models');

exports.submitSessionFeedback = async (req, res) => {
  try {
    const { assignmentId, clarityRating, usabilityRating, fatigueRating, engagementRating, comments, assistanceNeeded, assistanceDetails } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: "Assignment ID is required" });
    }

    // Check if assignment exists
    const assignment = await db.TaskAssignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Validate ratings
    const ratings = [clarityRating, usabilityRating, fatigueRating, engagementRating];
    if (ratings.some(rating => rating && (rating < 1 || rating > 5))) {
      return res.status(400).json({ success: false, message: "All ratings must be between 1-5" });
    }

    // Create feedback
    const feedback = await db.SessionFeedback.create({
      assignmentId,
      clarityRating,
      usabilityRating,
      fatigueRating,
      engagementRating,
      comments,
      assistanceNeeded,
      assistanceDetails
    });

    // Mark assignment as completed
    await assignment.update({ completed: true });

    res.status(201).json({
      success: true,
      message: "Session feedback submitted successfully",
      data: feedback
    });
  } catch (err) {
    console.error("Session feedback error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};