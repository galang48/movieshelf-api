const axios = require('axios');
const TMDB_BASE = 'https://api.themoviedb.org/3';

function authConfig() {
  if (process.env.TMDB_ACCESS_TOKEN) {
    return { headers: { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` } };
  }
  return null;
}

async function tmdbGet(path, params = {}) {
  const url = `${TMDB_BASE}${path}`;
  const auth = authConfig();

  if (auth) {
    const res = await axios.get(url, { ...auth, params });
    return res.data;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('Isi TMDB_API_KEY atau TMDB_ACCESS_TOKEN di .env');

  const res = await axios.get(url, { params: { ...params, api_key: apiKey } });
  return res.data;
}

async function getTrendingMovies() {
  return tmdbGet('/trending/movie/day', { language: 'en-US' });
}

module.exports = { getTrendingMovies };
