const { Op } = require('sequelize');
const tmdb = require('./tmdbService');

async function syncTrending(database, options = {}) {
  const data = await tmdb.getTrendingMovies(options);
  const items = data.results || [];

  for (const m of items) {
    await database.Movie.upsert({
      tmdbId: m.id,
      title: m.title || '-',
      overview: m.overview || null,
      releaseDate: m.release_date || null,
      posterPath: m.poster_path || null,
      popularity: m.popularity || 0,
      rawJson: JSON.stringify(m)
    });
  }

  return { message: 'Sync trending sukses', count: items.length };
}

async function getAll(database) {
  return database.Movie.findAll({ order: [['popularity', 'DESC']] });
}

async function search(database, q) {
  if (!q) throw new Error('q wajib diisi');
  return database.Movie.findAll({
    where: { title: { [Op.like]: `%${q}%` } },
    order: [['popularity', 'DESC']],
    limit: 50
  });
}

module.exports = { syncTrending, getAll, search };
