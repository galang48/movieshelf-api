const db = require('../models');
const movieService = require('../services/movieService');

async function getAll(req, res) {
  try {
    const result = await movieService.getAll(db);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

async function search(req, res) {
  try {
    const result = await movieService.search(db, req.query.q);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

module.exports = { getAll, search };
