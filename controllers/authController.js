const db = require('../models');
const authService = require('../services/authService');

async function register(req, res) {
  try {
    const result = await authService.register(db, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    res.status(e.status || 400).json({ success: false, error: e.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(db, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(e.status || 400).json({ success: false, error: e.message });
  }
}

async function refresh(req, res) {
  try {
    const result = await authService.refresh(db, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(e.status || 400).json({ success: false, error: e.message });
  }
}

async function logout(req, res) {
  try {
    const result = await authService.logout(db, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(e.status || 400).json({ success: false, error: e.message });
  }
}

async function me(req, res) {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        apiKey: user.apiKey, // Include API Key
        tmdbApiKey: user.tmdbApiKey
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { register, login, refresh, logout, me };
