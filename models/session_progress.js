// models/session_progress.js

module.exports = (sequelize, DataTypes) => {
  const SessionProgress = sequelize.define('SessionProgress', {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentPage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    progressData: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    timestamps: true,
    tableName: 'session_progress',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'sessionId']
      }
    ]
  });

  return SessionProgress;
};
