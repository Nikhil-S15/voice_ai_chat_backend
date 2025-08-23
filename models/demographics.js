module.exports = (sequelize, DataTypes) => {
  const Demographics = sequelize.define('Demographics', {
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
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    respondentIdentity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Address fields
    country: DataTypes.STRING,
    city: DataTypes.STRING,
    district: DataTypes.STRING,
    state: DataTypes.STRING,
    pincode: DataTypes.STRING,
    // Personal fields
    gender: DataTypes.STRING,
    age: DataTypes.STRING,
    education: DataTypes.STRING,
    employment: DataTypes.STRING,
    occupation: DataTypes.STRING,
    // Socioeconomic fields
    income: DataTypes.STRING,
    residence: DataTypes.STRING,
    maritalStatus: DataTypes.STRING,
    householdSize: DataTypes.STRING,
    transport: DataTypes.STRING,
    // Other fields
    disability: DataTypes.ARRAY(DataTypes.STRING),
    consented: DataTypes.BOOLEAN,
    date: DataTypes.STRING,
    durationMinutes: DataTypes.INTEGER
  }, {
    timestamps: true,
    tableName: 'demographics'
  });

  Demographics.associate = function(models) {
    Demographics.belongsTo(models.Onboarding, { foreignKey: 'userId', targetKey: 'userId' });
  };

  return Demographics;
};