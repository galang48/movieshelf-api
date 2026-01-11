const axios = require('axios');
const TMDB_BASE = 'https://api.themoviedb.org/3';

// options: { apiKey?: string, accessToken?: string }
function authConfig(options = {}) {
  const token = options.accessToken || process.env.TMDB_ACCESS_TOKEN;
  if (token) return { headers: { Authorization: `Bearer ${token}` } };
  return null;
}

async function tmdbGet(path, params = {}, options = {}) {
  const url = `${TMDB_BASE}${path}`;

  // kalau user ngasih accessToken, pakai itu
  const auth = authConfig(options);
  if (auth) {
    const res = await axios.get(url, { ...auth, params });
    return res.data;
  }

  // kalau user ngasih apiKey, pakai itu (override env)
  const apiKey = options.apiKey || process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('Isi TMDB_API_KEY atau TMDB_ACCESS_TOKEN di .env (atau set via Settings)');

  const res = await axios.get(url, { params: { ...params, api_key: apiKey } });
  return res.data;
}

async function getTrendingMovies(options = {}) {
  return tmdbGet('/trending/movie/day', { language: 'en-US' }, options);
}

module.exports = { getTrendingMovies };
