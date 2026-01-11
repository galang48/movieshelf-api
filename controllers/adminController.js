const db = require('../models');
const movieService = require('../services/movieService');

async function syncTrending(req, res) {
  try {
    const user = await db.User.findByPk(req.user.id);
    const apiKey = user?.tmdbApiKey || null;

    const result = await movieService.syncTrending(db, apiKey ? { apiKey } : {});
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

module.exports = { syncTrending };
