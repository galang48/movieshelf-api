const db = require('../models');

function maskKey(k) {
  if (!k) return null;
  const s = String(k);
  if (s.length <= 6) return '******';
  return `${s.slice(0, 2)}******${s.slice(-4)}`;
}

async function getApiKey(req, res) {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User tidak ditemukan' });

    res.json({
      success: true,
      data: {
        hasApiKey: !!user.tmdbApiKey,
        masked: user.tmdbApiKey ? maskKey(user.tmdbApiKey) : null,
      },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

async function updateApiKey(req, res) {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User tidak ditemukan' });

    let { tmdbApiKey } = req.body;

    if (tmdbApiKey === undefined) {
      return res.status(400).json({ success: false, error: 'tmdbApiKey wajib dikirim (string, boleh kosong untuk clear)' });
    }

    tmdbApiKey = String(tmdbApiKey).trim();
    user.tmdbApiKey = tmdbApiKey ? tmdbApiKey : null;
    await user.save();

    res.json({
      success: true,
      data: {
        hasApiKey: !!user.tmdbApiKey,
        masked: user.tmdbApiKey ? maskKey(user.tmdbApiKey) : null,
      },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}

module.exports = { getApiKey, updateApiKey };
