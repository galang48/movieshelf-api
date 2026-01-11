const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const movieController = require('../controllers/movieController');
const watchlistController = require('../controllers/watchlistController');
const adminController = require('../controllers/adminController');

const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// refresh/logout TIDAK pakai authJwt, supaya bisa dipakai saat access token expired
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

router.get('/auth/me', authJwt, authController.me);

router.get('/movies', authJwt, movieController.getAll);
router.get('/movies/search', authJwt, movieController.search);

router.post('/watchlist', authJwt, watchlistController.add);
router.get('/watchlist', authJwt, watchlistController.list);
router.delete('/watchlist/:tmdbId', authJwt, watchlistController.remove);

router.post('/admin/sync/trending', authJwt, requireRole('admin'), adminController.syncTrending);

module.exports = router;
