module.exports = (sequelize, DataTypes) => {
  const VHI = sequelize.define('VHI', {
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
    // Functional subscale (questions 1-10)
    functionalScores: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    // Physical subscale (questions 11-20)
    physicalScores: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    // Emotional subscale (questions 21-30)
    emotionalScores: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    functionalSubscore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    physicalSubscore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    emotionalSubscore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dateCompleted: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'vhi_assessments'
  });

  VHI.associate = function(models) {
    VHI.belongsTo(models.Onboarding, { 
      foreignKey: 'userId', 
      targetKey: 'userId' 
    });
  };

  return VHI;
};