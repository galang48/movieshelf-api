const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_TTL_MINUTES = 20;

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  // cukup panjang supaya susah ditebak
  return crypto.randomBytes(48).toString('hex');
}

async function createRefreshToken(database, userId) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MINUTES * 60 * 1000);

  await database.RefreshToken.create({
    tokenHash,
    userId,
    expiresAt,
  });

  return refreshToken;
}

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

  const token = signAccessToken(user);
  const refreshToken = await createRefreshToken(database, user.id);

  // Generate API Key if not exists
  let apiKey = user.apiKey;
  if (!apiKey) {
    apiKey = crypto.randomBytes(32).toString('hex');
    user.apiKey = apiKey;
    try {
      await user.save();
    } catch (saveErr) {
      console.error('FAILED TO SAVE API KEY:', saveErr);
      // continue without saving to see if that's the issue, or rethrow?
      // rethrow to see stack
      throw new Error('Failed to save API KEY: ' + saveErr.message);
    }
  }

  return { token, refreshToken, apiKey };
}

async function refresh(database, { refreshToken }) {
  if (!refreshToken) throw httpError(400, 'refreshToken wajib diisi');

  const tokenHash = hashToken(refreshToken);
  const row = await database.RefreshToken.findOne({ where: { tokenHash } });

  if (!row) throw httpError(401, 'refresh token tidak valid');
  if (row.revokedAt) throw httpError(401, 'refresh token sudah tidak berlaku');
  if (new Date(row.expiresAt).getTime() <= Date.now()) throw httpError(401, 'refresh token expired');

  const user = await database.User.findByPk(row.userId);
  if (!user) throw httpError(401, 'user tidak ditemukan');

  // ROTATE refresh token
  const newRefreshToken = generateRefreshToken();
  const newHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MINUTES * 60 * 1000);

  await database.RefreshToken.create({
    tokenHash: newHash,
    userId: user.id,
    expiresAt,
  });

  row.revokedAt = new Date();
  row.replacedByTokenHash = newHash;
  await row.save();

  const token = signAccessToken(user);

  return { token, refreshToken: newRefreshToken };
}

async function logout(database, { refreshToken }) {
  if (!refreshToken) throw httpError(400, 'refreshToken wajib diisi');

  const tokenHash = hashToken(refreshToken);
  const row = await database.RefreshToken.findOne({ where: { tokenHash } });

  // jangan bocorin info token; kalau gak ketemu pun tetap sukses
  if (row && !row.revokedAt) {
    row.revokedAt = new Date();
    await row.save();
  }

  return { message: 'Logout sukses' };
}

module.exports = { register, login, refresh, logout };
