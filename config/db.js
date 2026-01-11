'use strict';

const db = require('../models');
const bcrypt = require('bcryptjs');

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const exists = await db.User.findOne({ where: { username } });
  if (exists) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await db.User.create({ username, passwordHash, role: 'admin' });
  console.log(`✅ Default admin dibuat: ${username} (password dari .env)`);
}

// NEW: SQLite kadang tidak menambah kolom saat sync({ alter: true }).
async function ensureUserColumns() {
  const qi = db.sequelize.getQueryInterface();

  const tn = db.User.getTableName();
  const tableName = typeof tn === 'string' ? tn : tn.tableName;

  const desc = await qi.describeTable(tableName);

  if (!desc.tmdbApiKey) {
    await qi.addColumn(tableName, 'tmdbApiKey', {
      type: db.Sequelize.STRING,
      allowNull: true,
    });
    console.log('✅ Column Users.tmdbApiKey added');
  }

  if (!desc.apiKey) {
    await qi.addColumn(tableName, 'apiKey', {
      type: db.Sequelize.STRING(64),
      allowNull: true,
    });
    console.log('✅ Column Users.apiKey added');

    // Add unique index separately for SQLite compatibility
    try {
      await qi.addIndex(tableName, ['apiKey'], {
        unique: true,
        name: 'users_api_key_unique'
      });
      console.log('✅ Index users_api_key_unique added');
    } catch (e) {
      console.log('⚠️ Index creation skipped (might exist):', e.message);
    }
  }
}

async function connectDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // NOTE: alter sering gak bisa buang constraint UNIQUE lama di sqlite.
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    // NEW: pastikan kolom baru ada (tanpa reset DB)
    await ensureUserColumns();

    await ensureDefaultAdmin();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;
