const { Sequelize } = require('sequelize');
const env = require('./environment');

const sequelize = env.DB_DIALECT === 'sqlite'
  ? new Sequelize({
      dialect: 'sqlite',
      storage: env.DB_STORAGE || './finance.db',
      logging: env.NODE_ENV === 'development' ? console.log : false,
    })
  : new Sequelize(
      env.DB_NAME,
      env.DB_USER,
      env.DB_PASSWORD,
      {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: env.DB_DIALECT,
        logging: env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

module.exports = sequelize;

