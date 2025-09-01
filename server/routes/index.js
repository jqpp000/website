const express = require('express');
const router = express.Router();
const config = require('../config/config');

// Import route modules
const adsRoutes = require('./ads.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const healthRoutes = require('./health.routes');

// API documentation route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '58信息网 API Server',
    version: '1.0.0',
    endpoints: {
      health: `${config.api.prefix}/health`,
      auth: `${config.api.prefix}/auth`,
      ads: `${config.api.prefix}/ads`,
      users: `${config.api.prefix}/users`,
    },
    documentation: `${config.api.prefix}/docs`,
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ads', adsRoutes);
router.use('/users', usersRoutes);

module.exports = router;