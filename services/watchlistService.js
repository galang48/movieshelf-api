async function add(database, userId, tmdbId) {
  if (!tmdbId) throw new Error('tmdbId wajib diisi');

  const movie = await database.Movie.findOne({ where: { tmdbId: Number(tmdbId) } });
  if (!movie) throw new Error('Movie belum ada di DB. Admin harus sync dulu.');

  const [row] = await database.Watchlist.findOrCreate({
    where: { userId, movieId: movie.id },
    defaults: { userId, movieId: movie.id }
  });

  return row;
}

async function list(database, userId) {
  return database.Watchlist.findAll({
    where: { userId },
    include: [{ model: database.Movie }]
  });
}

async function remove(database, userId, tmdbId) {
  const movie = await database.Movie.findOne({ where: { tmdbId: Number(tmdbId) } });
  if (!movie) throw new Error('Movie tidak ditemukan');

  const row = await database.Watchlist.findOne({ where: { userId, movieId: movie.id } });
  if (!row) throw new Error('Item watchlist tidak ditemukan');

  await row.destroy();
  return { message: 'Berhasil dihapus' };
}

module.exports = { add, list, remove };
