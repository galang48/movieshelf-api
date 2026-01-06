const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function register(database, { username, password }) {
  if (!username || !password) throw new Error('username dan password wajib diisi');

  const exists = await database.User.findOne({ where: { username } });
  if (exists) throw new Error('username sudah dipakai');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await database.User.create({ username, passwordHash, role: 'user' });

  return { id: user.id, username: user.username, role: user.role };
}

async function login(database, { username, password }) {
  if (!username || !password) throw new Error('username dan password wajib diisi');

  const user = await database.User.findOne({ where: { username } });
  if (!user) throw new Error('username/password salah');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('username/password salah');

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return { token };
}

module.exports = { register, login };
