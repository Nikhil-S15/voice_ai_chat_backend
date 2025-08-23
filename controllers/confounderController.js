const db = require('../models');

exports.submitConfounder = async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      startedAt,
      completedAt,
      tobaccoUse,
      alcoholUse,
      substanceUse,
      voiceUse,
      ...rest
    } = req.body;

    // Basic validation
    if (!userId) return res.status(400).json({ success: false, message: "❌ User ID is required." });
    if (!sessionId) return res.status(400).json({ success: false, message: "❌ Session ID is required." });
    if (!tobaccoUse) return res.status(400).json({ success: false, message: "❌ Tobacco use response is required." });
    if (!alcoholUse) return res.status(400).json({ success: false, message: "❌ Alcohol use response is required." });
    if (!substanceUse) return res.status(400).json({ success: false, message: "❌ Substance use response is required." });
    if (!voiceUse) return res.status(400).json({ success: false, message: "❌ Voice use response is required." });

    // Check if user exists
    const userExists = await db.Onboarding.findOne({ where: { userId } });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "❌ User ID not found. Complete onboarding first."
      });
    }

    // Calculate duration
    const durationMinutes = Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);

    // Save confounder data
    const confounder = await db.Confounder.create({
      userId,
      sessionId,
      startedAt,
      completedAt,
      durationMinutes,
      tobaccoUse,
      alcoholUse,
      substanceUse,
      voiceUse,
      tobaccoForms: rest.tobaccoForms || [],
      currentTobaccoStatus: rest.currentTobaccoStatus,
      alcoholFrequency: rest.alcoholFrequency,
      alcoholRehab: rest.alcoholRehab,
      substanceType: rest.substanceType,
      substanceRecovery: rest.substanceRecovery,
      caffeinePerDay: rest.caffeinePerDay,
      waterIntake: rest.waterIntake,
      dentalProblem: rest.dentalProblem,
      dentures: rest.dentures,
      allergies: rest.allergies,
      medicalConditions: rest.medicalConditions || [],
      medications: rest.medications || [],
      medicalOther: rest.medicalOther,
      medicationOther: rest.medicationOther,
      menstruate: rest.menstruate,
      menstrualStatus: rest.menstrualStatus,
      voiceOccupation: rest.voiceOccupation,
      voiceHours: rest.voiceHours,
      fatigueScore: rest.fatigueScore,
      difficultyToday: rest.difficultyToday
    });

    res.status(201).json({
      success: true,
      message: "✅ Confounder Questionnaire saved",
      recordId: confounder.id
    });
  } catch (err) {
    console.error("❌ Confounder save error:", err);
    res.status(500).json({ success: false, message: "Server error while saving confounder" });
  }
};