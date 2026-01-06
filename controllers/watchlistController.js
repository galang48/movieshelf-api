const db = require('../models');
const watchlistService = require('../services/watchlistService');

async function add(req, res) {
  try {
    const userId = req.user.id;
    const { tmdbId } = req.body;
    const result = await watchlistService.add(db, userId, tmdbId);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

async function list(req, res) {
  try {
    const userId = req.user.id;
    const result = await watchlistService.list(db, userId);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user.id;
    const { tmdbId } = req.params;
    const result = await watchlistService.remove(db, userId, tmdbId);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

module.exports = { add, list, remove };
