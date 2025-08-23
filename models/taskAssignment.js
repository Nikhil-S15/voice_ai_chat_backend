module.exports = (sequelize, DataTypes) => {
  const TaskAssignment = sequelize.define('TaskAssignment', {
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
    condition: {
      type: DataTypes.ENUM(
        'oral_cancer',
        'larynx_hypopharynx',
        'pharynx_cancer',
        'other'
      ),
      allowNull: false
    },
    assignedTasks: {
      type: DataTypes.JSON,
      allowNull: false
    },
    completedTasks: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending'
    }
  }, {
    timestamps: true,
    tableName: 'task_assignments'
  });

  TaskAssignment.associate = function(models) {
    TaskAssignment.belongsTo(models.Onboarding, {
      foreignKey: 'userId',
      targetKey: 'userId'
    });
  };

  return TaskAssignment;
};