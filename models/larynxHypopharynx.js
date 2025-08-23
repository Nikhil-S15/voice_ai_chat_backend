module.exports = (sequelize, DataTypes) => {
  const LarynxHypopharynx = sequelize.define('LarynxHypopharynx', {
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
    respondentIdentity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Patient'
    },
    // Diagnosis
    diagnosisConfirmed: {
      type: DataTypes.STRING,
      allowNull: false
    },
    diagnosisMethods: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    tumorSite: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    tumorLaterality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Tumor characteristics
    histology: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    tumorGrade: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    tStage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nStage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mStage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    clinicalStage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Risk factors
    riskFactors: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    medicalHistory: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    symptoms: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    // Functional assessment
    functionalVoice: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    functionalSwallowing: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    functionalBreathing: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    functionalNutrition: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    functionalAirway: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Treatment
    treatmentModalities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    treatmentSurgeryDetails: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    treatmentReconstruction: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    treatmentMarginStatus: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    radiationDose: {
      type: DataTypes.STRING,
      allowNull: true
    },
    radiationTarget: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    radiationTechnique: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    chemoAgents: {
      type: DataTypes.STRING,
      allowNull: true
    },
    chemoSchedule: {
      type: DataTypes.STRING,
      allowNull: true
    },
    chemoCompleted: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'No'
    },
    // Follow-up
    followupDate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    followupStatus: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    // Outcomes
    outcomeTracheostomy: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    outcomeFeeding: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    outcomeSpeech: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'larynx_hypopharynx'
  });

  LarynxHypopharynx.associate = function(models) {
    LarynxHypopharynx.belongsTo(models.Onboarding, { 
      foreignKey: 'userId', 
      targetKey: 'userId' 
    });
  };

  return LarynxHypopharynx;
};