const db = require('../models');

exports.submitASIAT = async (req, res) => {
  try {
    const { userId, sessionId, vowels, consonants, words, passage } = req.body;

    // Calculate scores
    const consonantScore = calculateConsonantScore(consonants);
    const wordScore = calculateWordScore(words);
    const passageScore = calculatePassageScore(passage);
    
    const overallIntelligibility = (consonantScore + wordScore + passageScore) / 3;

    // Save to database
    const asiat = await db.ASIATAssessment.create({
      userId,
      sessionId,
      vowels,
      consonants,
      words,
      passage,
      consonantScore,
      wordScore,
      passageScore,
      overallIntelligibility,
      completedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "ASIAT assessment submitted successfully",
      asiatId: asiat.id
    });

  } catch (err) {
    console.error("ASIAT submission error:", err);
    res.status(500).json({ success: false, message: "Failed to submit ASIAT assessment" });
  }
};

function calculateConsonantScore(consonants) {
  const total = consonants.length;
  const correct = consonants.filter(c => c.correct).length;
  return (correct / total) * 100;
}

function calculateWordScore(words) {
  // Similar calculation logic
}

function calculatePassageScore(passage) {
  // Similar calculation logic
}