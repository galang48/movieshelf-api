async function add(database, userId, tmdbId) {
  const movie = await database.Movie.findOne({ where: { tmdbId } });
  if (!movie) throw new Error('Movie tidak ditemukan');

  const exists = await database.Watchlist.findOne({
    where: { userId, movieId: movie.id },
  });
  if (exists) throw new Error('Movie sudah ada di watchlist');

  await database.Watchlist.create({
    userId,
    movieId: movie.id,
  });

  return { message: 'Berhasil ditambahkan' };
}

async function list(database, userId) {
  const rows = await database.Watchlist.findAll({
    where: { userId },
    include: [
      {
        model: database.Movie,
        as: 'movie',
        attributes: ['tmdbId', 'title', 'posterPath', 'releaseDate'],
      },
    ],
  });

  return rows.map((r) => ({
    tmdbId: r.movie.tmdbId,
    title: r.movie.title,
    posterPath: r.movie.posterPath,
    releaseDate: r.movie.releaseDate,
  }));
}

async function remove(database, userId, tmdbId) {
  const movie = await database.Movie.findOne({ where: { tmdbId } });
  if (!movie) throw new Error('Movie tidak ditemukan');

  const row = await database.Watchlist.findOne({
    where: { userId, movieId: movie.id },
  });
  if (!row) throw new Error('Data tidak ditemukan');

  await row.destroy();
  return { message: 'Berhasil dihapus' };
}

module.exports = { add, list, remove };
