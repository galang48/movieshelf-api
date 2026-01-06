'use strict';

const express = require('express');
const router = express.Router();

const watchlistController = require('../controllers/watchlistController');
const { authenticateToken } = require('../middlewares/auth'); // sesuaikan nama middleware kamu

router.get('/', authenticateToken, watchlistController.getMyWatchlist);
router.post('/', authenticateToken, watchlistController.addToWatchlist);
router.delete('/:tmdbId', authenticateToken, watchlistController.removeFromWatchlist);

module.exports = router;
