const db = require('../models');

exports.submitOralCancer = async (req, res) => {
  try {
    const { userId, sessionId, startedAt, completedAt, ...formData } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "❌ User ID is required." });
    if (!sessionId) return res.status(400).json({ success: false, message: "❌ Session ID is required." });

    // Check user exists
    const userExists = await db.Onboarding.findOne({ where: { userId } });
    if (!userExists) {
      return res.status(404).json({ success: false, message: "❌ User not found. Complete onboarding first." });
    }

    // Calculate duration
    const durationMinutes = Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);

    // Save oral cancer data
    const oralCancer = await db.OralCancer.create({
      userId,
      sessionId,
      startedAt,
      completedAt,
      durationMinutes,
      diagnosisYes: formData.diagnosis?.yes,
      diagnosisNo: formData.diagnosis?.no,
      diagnosisNotCertain: formData.diagnosis?.notCertain,
      diagnosisConfirmedClinicalExam: formData.diagnosis?.confirmedBy?.clinicalExam,
      diagnosisConfirmedBiopsy: formData.diagnosis?.confirmedBy?.biopsy,
      diagnosisConfirmedImaging: formData.diagnosis?.confirmedBy?.imaging,
      tumorSiteBuccalMucosa: formData.tumorSite?.buccalMucosa,
      tumorSiteTongue: formData.tumorSite?.tongue,
      tumorSiteFloorOfMouth: formData.tumorSite?.floorOfMouth,
      tumorSiteAlveolus: formData.tumorSite?.alveolus,
      tumorSiteRetromolar: formData.tumorSite?.retromolar,
      tumorSiteHardPalate: formData.tumorSite?.hardPalate,
      tumorSiteLip: formData.tumorSite?.lip,
      tumorSiteOther: formData.tumorSite?.other,
      tStage: formData.tnm?.tStage,
      nStage: formData.tnm?.nStage,
      mStage: formData.tnm?.mStage,
      clinicalStage: formData.tnm?.clinicalStage,
      riskFactorTobaccoSmoke: formData.riskFactors?.tobaccoSmoke,
      riskFactorTobaccoChew: formData.riskFactors?.tobaccoChew,
      riskFactorAlcohol: formData.riskFactors?.alcohol,
      riskFactorBetelNut: formData.riskFactors?.betelNut,
      riskFactorPoorHygiene: formData.riskFactors?.poorHygiene,
      riskFactorHpv: formData.riskFactors?.hpv,
      riskFactorOther: formData.riskFactors?.other,
      medicalHistoryDiabetes: formData.medicalHistory?.diabetes,
      medicalHistoryHypertension: formData.medicalHistory?.hypertension,
      medicalHistoryCardio: formData.medicalHistory?.cardio,
      medicalHistoryLung: formData.medicalHistory?.lung,
      medicalHistoryImmuno: formData.medicalHistory?.immuno,
      medicalHistoryPriorCancer: formData.medicalHistory?.priorCancer,
      medicalHistoryOther: formData.medicalHistory?.other,
      symptomUlcer: formData.symptoms?.ulcer,
      symptomPain: formData.symptoms?.pain,
      symptomTrismus: formData.symptoms?.trismus,
      symptomDysphagia: formData.symptoms?.dysphagia,
      symptomOdynophagia: formData.symptoms?.odynophagia,
      symptomAlteredSpeech: formData.symptoms?.alteredSpeech,
      symptomOralBleeding: formData.symptoms?.oralBleeding,
      symptomNeckSwelling: formData.symptoms?.neckSwelling,
      symptomWeightLoss: formData.symptoms?.weightLoss,
      treatmentSurgery: formData.treatments?.surgery,
      treatmentRadiotherapy: formData.treatments?.radiotherapy,
      treatmentChemotherapy: formData.treatments?.chemotherapy,
      treatmentConcurrent: formData.treatments?.concurrent,
      treatmentImmunotherapy: formData.treatments?.immunotherapy,
      treatmentPalliative: formData.treatments?.palliative,
      treatmentNoTreatment: formData.treatments?.noTreatment,
      surgeryWideExcision: formData.surgeryDetails?.wideExcision,
      surgeryMandibulectomy: formData.surgeryDetails?.mandibulectomy,
      surgeryMaxillectomy: formData.surgeryDetails?.maxillectomy,
      surgeryNeckDissection: formData.surgeryDetails?.neckDissection,
      reconstructionNone: formData.reconstruction?.reconNone,
      reconstructionLocalFlap: formData.reconstruction?.localFlap,
      reconstructionFreeFlap: formData.reconstruction?.freeFlap,
      marginStatusClear: formData.marginStatus?.clear,
      marginStatusClose: formData.marginStatus?.close,
      marginStatusInvolved: formData.marginStatus?.involved,
      radiationDose: formData.radiation?.dose,
      radiationTargetPrimary: formData.radiation?.targetPrimary,
      radiationTargetNeck: formData.radiation?.targetNeck,
      radiationTargetBoth: formData.radiation?.targetBoth,
      radiationImrt: formData.radiation?.imrt,
      radiationD3crt: formData.radiation?.d3crt,
      radiationOther: formData.radiation?.rtOther,
      chemotherapyAgent: formData.chemotherapyDetails?.agent,
      chemotherapySchedule: formData.chemotherapyDetails?.schedule,
      followupDate: formData.followup?.date,
      followupNoDisease: formData.followup?.noDisease,
      followupPersistent: formData.followup?.persistent,
      followupRecurrent: formData.followup?.recurrent,
      followupMetastatic: formData.followup?.metastatic,
      followupDeceased: formData.followup?.deceased,
      outcomeTracheostomyYes: formData.outcomes?.tracheostomyYes,
      outcomeTracheostomyNo: formData.outcomes?.tracheostomyNo,
      outcomeTracheostomyTemp: formData.outcomes?.tracheostomyTemp,
      outcomeFeedingFull: formData.outcomes?.feedingFull,
      outcomeFeedingModified: formData.outcomes?.feedingModified,
      outcomeFeedingNg: formData.outcomes?.feedingNG,
      outcomeFeedingGastro: formData.outcomes?.feedingGastro,
      outcomeSpeechNormal: formData.outcomes?.speechNormal,
      outcomeSpeechEffort: formData.outcomes?.speechEffort,
      outcomeSpeechNonverbal: formData.outcomes?.speechNonverbal,
      outcomeSpeechAid: formData.outcomes?.speechAid
    });

    res.status(201).json({
      success: true,
      message: "✅ Oral Cancer Clinical Data saved successfully",
      recordId: oralCancer.id,
    });
  } catch (err) {
    console.error("❌ Oral Cancer save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};