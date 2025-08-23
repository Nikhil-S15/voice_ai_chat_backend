const db = require('../models');

exports.submitDemographics = async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      startedAt,
      completedAt,
      respondentIdentity,
      address,
      personal,
      socioeconomic,
      disability,
      consented,
      date,
    } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "❌ User ID is required." });
    if (!sessionId) return res.status(400).json({ success: false, message: "❌ Session ID is required." });
    if (!respondentIdentity) return res.status(400).json({ success: false, message: "❌ Respondent identity is required." });
    if (!address?.country || !address?.city || !address?.district || !address?.state || !address?.pincode) {
      return res.status(400).json({ success: false, message: "❌ Complete address is required." });
    }
    if (!personal?.gender || !personal?.age || !personal?.education || !personal?.employment) {
      return res.status(400).json({ success: false, message: "❌ Personal details incomplete." });
    }
    if (!socioeconomic?.income || !socioeconomic?.residence || !socioeconomic?.maritalStatus) {
      return res.status(400).json({ success: false, message: "❌ Socioeconomic details incomplete." });
    }

    // Check if user exists
    const userExists = await db.Onboarding.findOne({ where: { userId } });
    if (!userExists) {
      return res.status(404).json({ success: false, message: "❌ User ID not found. Complete onboarding first." });
    }

    // Calculate duration
    const durationMinutes = Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);

    // Save demographics data
    const demographics = await db.Demographics.create({
      userId,
      sessionId,
      startedAt,
      completedAt,
      respondentIdentity,
      country: address.country,
      city: address.city,
      district: address.district,
      state: address.state,
      pincode: address.pincode,
      gender: personal.gender,
      age: personal.age,
      education: personal.education,
      employment: personal.employment,
      occupation: personal.occupation,
      income: socioeconomic.income,
      residence: socioeconomic.residence,
      maritalStatus: socioeconomic.maritalStatus,
      householdSize: socioeconomic.householdSize,
      transport: socioeconomic.transport,
      disability: disability || [],
      consented,
      date,
      durationMinutes
    });

    res.status(201).json({ 
      success: true, 
      message: "✅ Demographics saved", 
      recordId: demographics.id 
    });
  } catch (err) {
    console.error("❌ Demographics error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};