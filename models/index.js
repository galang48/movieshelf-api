'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
const DB_STORAGE = process.env.DB_STORAGE || './database.sqlite';

const sequelize = new Sequelize({
  dialect: DB_DIALECT,
  storage: DB_STORAGE,
  logging: false,
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// load models manual (biar jelas)
db.User = require('./user')(sequelize, DataTypes);
db.Movie = require('./movie')(sequelize, DataTypes);
db.Watchlist = require('./watchlist')(sequelize, DataTypes);

// associations
Object.keys(db).forEach((key) => {
  if (db[key] && typeof db[key].associate === 'function') {
    db[key].associate(db);
  }
});

module.exports = db;
