'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDatabase = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// static web (wajib jadi web)
app.use(express.static(path.join(__dirname, 'public')));

// API v1 (pakai 1 file route: routes/api.js)
app.use('/api/v1', apiRoutes);

// root -> login.html
app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 404 untuk endpoint API
app.use('/api', (req, res) => {
  return res.status(404).json({ success: false, error: 'Endpoint not found' });
});

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
