const { Sequelize } = require("sequelize");

// Future Improvement: Add dialectOptions for SSL when deploying to production environments
const sequelize = new Sequelize(
  process.env.PGDATABASE || "authdb",
  process.env.PGUSER || "postgres",
  process.env.PGPASSWORD || "postgres",
  {
    host: process.env.PGHOST || "localhost",
    port: process.env.PGPORT || 5432,
    dialect: "postgres",
    logging: process.env.SEQUELIZE_LOGGING === "true" ? console.log : false,
    pool: {
      max: parseInt(process.env.PGPOOL_MAX) || 10,
      min: parseInt(process.env.PGPOOL_MIN) || 0,
      acquire: parseInt(process.env.PGPOOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.PGPOOL_IDLE) || 10000,
    },
  }
);

module.exports = sequelize;
