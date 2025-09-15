// models/vhi.js
module.exports = (sequelize, DataTypes) => {
  const VHI = sequelize.define('VHI', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Onboarding', // Reference the existing Onboarding model's table
        key: 'userId'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    functionalScores: {
      type: DataTypes.JSONB, // Use JSONB for PostgreSQL, JSON for other DBs
      allowNull: false,
    },
    physicalScores: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    emotionalScores: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    functionalSubscore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    physicalSubscore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    emotionalSubscore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'english',
      validate: {
        isIn: [['english', 'malayalam']]
      }
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    dateCompleted: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'vhi_assessments',
    timestamps: true, // This adds createdAt and updatedAt
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['dateCompleted']
      }
    ]
  });


  // Define associations
  VHI.associate = function(models) {
    // Associate VHI with Onboarding via userId foreign key
    VHI.belongsTo(models.Onboarding, {
      foreignKey: 'userId',
      as: 'user'
    });
  };


  return VHI;
};
