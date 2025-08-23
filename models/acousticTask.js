module.exports = (sequelize, DataTypes) => {
  const AcousticTask = sequelize.define('AcousticTask', {
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
      type: DataTypes.ENUM(
        'prolonged_vowel',
        'maximum_phonation',
        'rainbow_passage',
        'pitch_glides',
        'loudness_task',
        'free_speech',
        'respiration_observation',
        'reflex_cough',
        'voluntary_cough',
        'breath_sounds',
        'malayalam_vowels',
        'malayalam_consonants',
        'malayalam_words',
        'malayalam_passage'
      ),
      allowNull: false
    },
    language: {
      type: DataTypes.ENUM('en', 'ml'),
      allowNull: false
    },
    audioFileUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    durationMs: DataTypes.INTEGER,
    sampleRate: DataTypes.INTEGER,
    bitDepth: DataTypes.INTEGER,
    recordingDevice: DataTypes.STRING,
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    taskCompletedAt: DataTypes.DATE,
    // GRBAS ratings
    grade: DataTypes.INTEGER,
    roughness: DataTypes.INTEGER,
    breathiness: DataTypes.INTEGER,
    asthenia: DataTypes.INTEGER,
    strain: DataTypes.INTEGER,
    clinicianNotes: DataTypes.TEXT
  }, {
    timestamps: true,
    tableName: 'acoustic_tasks'
  });

  AcousticTask.associate = function(models) {
    AcousticTask.belongsTo(models.Onboarding, { 
      foreignKey: 'userId', 
      targetKey: 'userId' 
    });
  };

  return AcousticTask;
};