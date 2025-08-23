const { Sequelize } = require("sequelize");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const sequelize = isProduction
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        dialectOptions: process.env.DB_SSL === "true" ? {
          ssl: { require: true, rejectUnauthorized: false },
        } : {},
        logging: false,
      }
    );

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL connection has been established successfully.");
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the PostgreSQL database:", err);
  });

module.exports = sequelize;
