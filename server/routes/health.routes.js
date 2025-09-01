const express = require('express');
const router = express.Router();
const os = require('os');
const config = require('../config/config');

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    server: {
      port: config.server.port,
      host: config.server.host,
    },
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      memory: {
        free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) + '%'
      }
    },
    process: {
      pid: process.pid,
      version: process.version,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      }
    }
  };

  res.status(200).json({
    success: true,
    data: healthInfo
  });
});

/**
 * @route   GET /api/v1/health/ping
 * @desc    Simple ping endpoint
 * @access  Public
 */
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;