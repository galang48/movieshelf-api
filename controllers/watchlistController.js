const db = require('../models');
const service = require('../services/watchlistService');

async function add(req, res) {
  try {
    const { tmdbId } = req.body;
    const data = await service.add(db, req.user.id, tmdbId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

async function list(req, res) {
  try {
    const data = await service.list(db, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

async function remove(req, res) {
  try {
    const { tmdbId } = req.params;
    const data = await service.remove(db, req.user.id, tmdbId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

module.exports = {
  add,
  list,
  remove,
};
