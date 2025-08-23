module.exports = (sequelize, DataTypes) => {
  const OralCancer = sequelize.define('OralCancer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'onboarding',
        key: 'userId'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    durationMinutes: DataTypes.INTEGER,
    // Diagnosis Section
    diagnosisYes: DataTypes.BOOLEAN,
    diagnosisNo: DataTypes.BOOLEAN,
    diagnosisNotCertain: DataTypes.BOOLEAN,
    diagnosisConfirmedClinicalExam: DataTypes.BOOLEAN,
    diagnosisConfirmedBiopsy: DataTypes.BOOLEAN,
    diagnosisConfirmedImaging: DataTypes.BOOLEAN,
    // Tumor Site
    tumorSiteBuccalMucosa: DataTypes.BOOLEAN,
    tumorSiteTongue: DataTypes.BOOLEAN,
    tumorSiteFloorOfMouth: DataTypes.BOOLEAN,
    tumorSiteAlveolus: DataTypes.BOOLEAN,
    tumorSiteRetromolar: DataTypes.BOOLEAN,
    tumorSiteHardPalate: DataTypes.BOOLEAN,
    tumorSiteLip: DataTypes.BOOLEAN,
    tumorSiteOther: DataTypes.BOOLEAN,
    // TNM Staging
    tStage: DataTypes.STRING,
    nStage: DataTypes.STRING,
    mStage: DataTypes.STRING,
    clinicalStage: DataTypes.STRING,
    // Risk Factors
    riskFactorTobaccoSmoke: DataTypes.BOOLEAN,
    riskFactorTobaccoChew: DataTypes.BOOLEAN,
    riskFactorAlcohol: DataTypes.BOOLEAN,
    riskFactorBetelNut: DataTypes.BOOLEAN,
    riskFactorPoorHygiene: DataTypes.BOOLEAN,
    riskFactorHpv: DataTypes.BOOLEAN,
    riskFactorOther: DataTypes.BOOLEAN,
    // Medical History
    medicalHistoryDiabetes: DataTypes.BOOLEAN,
    medicalHistoryHypertension: DataTypes.BOOLEAN,
    medicalHistoryCardio: DataTypes.BOOLEAN,
    medicalHistoryLung: DataTypes.BOOLEAN,
    medicalHistoryImmuno: DataTypes.BOOLEAN,
    medicalHistoryPriorCancer: DataTypes.BOOLEAN,
    medicalHistoryOther: DataTypes.BOOLEAN,
    // Symptoms
    symptomUlcer: DataTypes.BOOLEAN,
    symptomPain: DataTypes.BOOLEAN,
    symptomTrismus: DataTypes.BOOLEAN,
    symptomDysphagia: DataTypes.BOOLEAN,
    symptomOdynophagia: DataTypes.BOOLEAN,
    symptomAlteredSpeech: DataTypes.BOOLEAN,
    symptomOralBleeding: DataTypes.BOOLEAN,
    symptomNeckSwelling: DataTypes.BOOLEAN,
    symptomWeightLoss: DataTypes.BOOLEAN,
    // Treatment Modalities
    treatmentSurgery: DataTypes.BOOLEAN,
    treatmentRadiotherapy: DataTypes.BOOLEAN,
    treatmentChemotherapy: DataTypes.BOOLEAN,
    treatmentConcurrent: DataTypes.BOOLEAN,
    treatmentImmunotherapy: DataTypes.BOOLEAN,
    treatmentPalliative: DataTypes.BOOLEAN,
    treatmentNoTreatment: DataTypes.BOOLEAN,
    // Surgery Details
    surgeryWideExcision: DataTypes.BOOLEAN,
    surgeryMandibulectomy: DataTypes.BOOLEAN,
    surgeryMaxillectomy: DataTypes.BOOLEAN,
    surgeryNeckDissection: DataTypes.BOOLEAN,
    // Reconstruction
    reconstructionNone: DataTypes.BOOLEAN,
    reconstructionLocalFlap: DataTypes.BOOLEAN,
    reconstructionFreeFlap: DataTypes.BOOLEAN,
    // Margin Status
    marginStatusClear: DataTypes.BOOLEAN,
    marginStatusClose: DataTypes.BOOLEAN,
    marginStatusInvolved: DataTypes.BOOLEAN,
    // Radiation Details
    radiationDose: DataTypes.STRING,
    radiationTargetPrimary: DataTypes.BOOLEAN,
    radiationTargetNeck: DataTypes.BOOLEAN,
    radiationTargetBoth: DataTypes.BOOLEAN,
    radiationImrt: DataTypes.BOOLEAN,
    radiationD3crt: DataTypes.BOOLEAN,
    radiationOther: DataTypes.BOOLEAN,
    // Chemo Details
    chemotherapyAgent: DataTypes.STRING,
    chemotherapySchedule: DataTypes.STRING,
    // Follow-up
    followupDate: DataTypes.STRING,
    followupNoDisease: DataTypes.BOOLEAN,
    followupPersistent: DataTypes.BOOLEAN,
    followupRecurrent: DataTypes.BOOLEAN,
    followupMetastatic: DataTypes.BOOLEAN,
    followupDeceased: DataTypes.BOOLEAN,
    // Voice/Speech/Nutrition
    outcomeTracheostomyYes: DataTypes.BOOLEAN,
    outcomeTracheostomyNo: DataTypes.BOOLEAN,
    outcomeTracheostomyTemp: DataTypes.BOOLEAN,
    outcomeFeedingFull: DataTypes.BOOLEAN,
    outcomeFeedingModified: DataTypes.BOOLEAN,
    outcomeFeedingNg: DataTypes.BOOLEAN,
    outcomeFeedingGastro: DataTypes.BOOLEAN,
    outcomeSpeechNormal: DataTypes.BOOLEAN,
    outcomeSpeechEffort: DataTypes.BOOLEAN,
    outcomeSpeechNonverbal: DataTypes.BOOLEAN,
    outcomeSpeechAid: DataTypes.BOOLEAN
  }, {
    timestamps: true,
    tableName: 'oral_cancer'
  });

  OralCancer.associate = function(models) {
    OralCancer.belongsTo(models.Onboarding, { foreignKey: 'userId', targetKey: 'userId' });
  };

  return OralCancer;
};