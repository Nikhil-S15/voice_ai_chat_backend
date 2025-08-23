module.exports = (sequelize, DataTypes) => {
  const TaskProgress = sequelize.define('TaskProgress', {
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
    currentTask: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    totalTasks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'English'
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'task_progress'
  });

  TaskProgress.associate = function(models) {
    TaskProgress.belongsTo(models.Onboarding, { 
      foreignKey: 'userId', 
      targetKey: 'userId' 
    });
  };

  return TaskProgress;
};