
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,    // e.g. voice_ai_db
  process.env.DB_USER,    // e.g. voice_ai_db_user
  process.env.DB_PASS,    // your DB password
  {
    host: process.env.DB_HOST,   // e.g. dpg-d2klbm15pdvs739ofs50-a.oregon-postgres.render.com
    port: process.env.DB_PORT ,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,              // Require SSL connection
        rejectUnauthorized: false  // Accept self-signed certificates (common for managed DB)
      }
    },
    logging: false,
  }
);

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
