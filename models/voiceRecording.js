module.exports = (sequelize, DataTypes) => {
  const VoiceRecording = sequelize.define('VoiceRecording', {
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
    taskType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false
    },
    audioFilePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recordingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'voice_recordings'
  });

  VoiceRecording.associate = function(models) {
    VoiceRecording.belongsTo(models.Onboarding, { foreignKey: 'userId', targetKey: 'userId' });
  };

  return VoiceRecording;
};