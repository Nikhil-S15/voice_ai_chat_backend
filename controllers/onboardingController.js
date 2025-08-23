const { Onboarding } = require("../models");


exports.submitOnboarding = async (req, res) => {
  try {
    const { userId, participantName, witnessName, consentAccepted } = req.body;

    if (!userId || !participantName || consentAccepted === undefined) {
      return res.status(400).json({ success: false, message: "❌ Required fields missing" });
    }

    const onboarding = await Onboarding.create({
      userId,
      participantName,
      witnessName,
      consentAccepted
    });

    res.status(201).json({ success: true, message: "✅ Onboarding saved", userId: onboarding.userId });
  } catch (err) {
    console.error("❌ Onboarding error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
