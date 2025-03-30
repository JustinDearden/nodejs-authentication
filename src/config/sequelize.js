const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.PGDATABASE || 'authdb',
    process.env.PGUSER || 'postgres',
    process.env.PGPASSWORD || 'postgres',
    {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

module.exports = sequelize;
