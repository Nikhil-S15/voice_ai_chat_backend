module.exports = (sequelize, DataTypes) => {
  const GRBASRating = sequelize.define('GRBASRating', {
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
    taskNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    gScore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rScore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bScore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    aScore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sScore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clinicianName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    evaluationDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'grbas_ratings'
  });

  GRBASRating.associate = function(models) {
    GRBASRating.belongsTo(models.Onboarding, { 
      foreignKey: 'userId', 
      targetKey: 'userId' 
    });
  };

  return GRBASRating;
};