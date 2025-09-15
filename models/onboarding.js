// models/onboarding.js
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
    // HAS ONE associations
    Onboarding.hasOne(models.Demographics, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'Demographics'
    });
    
    Onboarding.hasOne(models.Confounder, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'Confounder'
    });
    
    Onboarding.hasOne(models.OralCancer, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'OralCancer'
    });
    
    Onboarding.hasOne(models.LarynxHypopharynx, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'LarynxHypopharynx'
    });
    
    Onboarding.hasOne(models.PharynxCancer, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'PharynxCancer'
    });
    
    Onboarding.hasOne(models.VHI, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'VHI'
    });

    // HAS MANY associations
    Onboarding.hasMany(models.GRBASRating, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'GRBASRatings'
    });
    
    Onboarding.hasMany(models.VoiceRecording, { 
      foreignKey: 'userId', 
      sourceKey: 'userId',
      as: 'VoiceRecordings'
    });
  };

  return Onboarding;
};