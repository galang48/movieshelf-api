require('dotenv').config();

const development = {
  dialect: process.env.DB_DIALECT || 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false
};

const test = development;
const production = development;

module.exports = { development, test, production };
