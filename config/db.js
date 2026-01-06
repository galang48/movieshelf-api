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

async function connectDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // NOTE: alter sering gak bisa buang constraint UNIQUE lama di sqlite.
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    await ensureDefaultAdmin();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;
