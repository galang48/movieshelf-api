const jwt = require('jsonwebtoken');

const db = require('../models');

async function authJwt(req, res, next) {
  const header = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // 1. Cek JWT (Prioritas Utama)
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid/expired token' });
    }
  }

  // 2. Cek API Key (Fallback jika tidak ada token)
  if (apiKey) {
    try {
      const user = await db.User.findOne({ where: { apiKey } });
      if (user) {
        // Samakan struktur req.user dengan payload JWT
        req.user = { id: user.id, username: user.username, role: user.role };
        return next();
      } else {
        return res.status(401).json({ success: false, error: 'Invalid API Key' });
      }
    } catch (err) {
      console.error('Auth Middleware Error:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(401).json({ success: false, error: 'Missing token or API Key' });
}

module.exports = authJwt;
