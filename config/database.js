const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Railway / Production
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  // Local development
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      dialectOptions: {
        ssl: process.env.DB_SSL === "true" ? { require: true, rejectUnauthorized: false } : false,
      },
      logging: false,
    }
  );
}

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL connection has been established successfully.");
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the PostgreSQL databases:", err);
  });

module.exports = sequelize;
