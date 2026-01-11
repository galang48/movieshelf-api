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
  res.json({ success: true, data: req.user });
}

module.exports = { register, login, refresh, logout, me };
