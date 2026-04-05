const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// Read all model files
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add associations manually
db.User.belongsTo(db.Role, { foreignKey: 'roleId', as: 'role' });
db.Role.hasMany(db.User, { foreignKey: 'roleId', as: 'users' });

db.FinancialRecord.belongsTo(db.User, { foreignKey: 'userId', as: 'creator' });
db.User.hasMany(db.FinancialRecord, { foreignKey: 'userId', as: 'records' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

