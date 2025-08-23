module.exports = (sequelize, DataTypes) => {
  const Onboarding = sequelize.define('Onboarding', {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    participantName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    witnessName: DataTypes.STRING,
    consentAccepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'onboarding'
  });

  Onboarding.associate = function(models) {
    Onboarding.hasMany(models.Demographics, { foreignKey: 'userId', sourceKey: 'userId' });
    Onboarding.hasMany(models.Confounder, { foreignKey: 'userId', sourceKey: 'userId' });
    Onboarding.hasMany(models.OralCancer, { foreignKey: 'userId', sourceKey: 'userId' });
    Onboarding.hasMany(models.LarynxHypopharynx, { foreignKey: 'userId', sourceKey: 'userId' });
    Onboarding.hasMany(models.PharynxCancer, { foreignKey: 'userId', sourceKey: 'userId' });
  };

  return Onboarding;
};