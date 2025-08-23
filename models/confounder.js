module.exports = (sequelize, DataTypes) => {
  const Confounder = sequelize.define('Confounder', {
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
    // Tobacco
    tobaccoUse: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tobaccoForms: DataTypes.ARRAY(DataTypes.STRING),
    currentTobaccoStatus: DataTypes.STRING,
    // Alcohol
    alcoholUse: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alcoholFrequency: DataTypes.STRING,
    alcoholRehab: DataTypes.STRING,
    // Substance
    substanceUse: {
      type: DataTypes.STRING,
      allowNull: false
    },
    substanceType: DataTypes.STRING,
    substanceRecovery: DataTypes.STRING,
    // Other habits
    caffeinePerDay: DataTypes.STRING,
    waterIntake: DataTypes.STRING,
    // Dental
    dentalProblem: DataTypes.STRING,
    dentures: DataTypes.STRING,
    allergies: DataTypes.STRING,
    // Medical
    medicalConditions: DataTypes.ARRAY(DataTypes.STRING),
    medications: DataTypes.ARRAY(DataTypes.STRING),
    medicalOther: DataTypes.STRING,
    medicationOther: DataTypes.STRING,
    // Menstrual
    menstruate: DataTypes.STRING,
    menstrualStatus: DataTypes.STRING,
    // Voice
    voiceUse: {
      type: DataTypes.STRING,
      allowNull: false
    },
    voiceOccupation: DataTypes.STRING,
    voiceHours: DataTypes.STRING,
    // Fatigue
    fatigueScore: DataTypes.STRING,
    difficultyToday: DataTypes.STRING
  }, {
    timestamps: true,
    tableName: 'confounders'
  });

  Confounder.associate = function(models) {
    Confounder.belongsTo(models.Onboarding, { foreignKey: 'userId', targetKey: 'userId' });
  };

  return Confounder;
};