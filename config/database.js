// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// const isProduction = process.env.NODE_ENV === "production";

// const sequelize = isProduction
//   ? new Sequelize(process.env.DATABASE_URL, {
//       dialect: "postgres",
//       dialectOptions: {
//         ssl: {
//           require: true,
//           rejectUnauthorized: false,
//         },
//       },
//       logging: false,
//     })
//   : new Sequelize(
//       process.env.DB_NAME,
//       process.env.DB_USER,
//       process.env.DB_PASS,
//       {
//         host: process.env.DB_HOST,
//         port: process.env.DB_PORT,
//         dialect: "postgres",
//         dialectOptions: process.env.DB_SSL === "true" ? {
//           ssl: { require: true, rejectUnauthorized: false },
//         } : {},
//         logging: false,
//       }
//     );

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("✅ PostgreSQL connection has been established successfully.");
//   })
//   .catch((err) => {
//     console.error("❌ Unable to connect to the PostgreSQL database:", err);
//   });

// module.exports = sequelize;
const { Sequelize } = require("sequelize");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

// ✅ Create Sequelize instance
let sequelize = isProduction
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
        logging: false,
        dialectOptions:
          process.env.DB_SSL === "true"
            ? { ssl: { require: true, rejectUnauthorized: false } }
            : {},
      }
    );

// ✅ Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL connection has been established successfully.");
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the PostgreSQL database:", err);
  });

// ✅ Sync models with retry (handles local SSL issue)
async function syncModels() {
  try {
    await sequelize.sync();
    console.log("✅ Models synced successfully.");
  } catch (err) {
    if (err.message.includes("does not support SSL")) {
      console.warn("⚠️ Retrying model sync without SSL...");
      sequelize.options.dialectOptions = {}; // disable SSL
      await sequelize.sync();
      console.log("✅ Models synced successfully without SSL.");
    } else {
      console.error("❌ Error syncing models:", err);
    }
  }
}

syncModels();

module.exports = sequelize;
