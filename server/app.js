const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configuration
const config = require('./config/config');

// Import middleware
const { createLogger, logger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Initialize Express app
const app = express();

// Trust proxy (important for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(config.cors));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(createLogger());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(`${config.api.prefix}/`, limiter);

// Static files (for uploaded content, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check endpoint (outside of API prefix for monitoring tools)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use(config.api.prefix, routes);

// Serve static files (frontend and admin)
app.use(express.static(path.join(__dirname, 'public/frontend')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Serve frontend in production
if (config.server.env === 'production') {
  // Catch all handler for frontend routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/frontend/index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = () => {
  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(`🚀 Server running in ${config.server.env} mode`);
    logger.info(`📡 API available at http://${config.server.host}:${config.server.port}${config.api.prefix}`);
    logger.info(`❤️  Health check at http://${config.server.host}:${config.server.port}/health`);
    
    if (config.server.env === 'development') {
      console.log('\n📚 API Endpoints:');
      console.log(`   GET    ${config.api.prefix}/health - Health check`);
      console.log(`   POST   ${config.api.prefix}/auth/login - User login`);
      console.log(`   POST   ${config.api.prefix}/auth/register - User registration`);
      console.log(`   GET    ${config.api.prefix}/ads - Get all ads`);
      console.log(`   POST   ${config.api.prefix}/ads - Create new ad`);
      console.log(`   PUT    ${config.api.prefix}/ads/:id - Update ad`);
      console.log(`   DELETE ${config.api.prefix}/ads/:id - Delete ad`);
      console.log('\n');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  return server;
};

// Export app for testing
module.exports = app;

// Start server if not in test environment
if (require.main === module) {
  startServer();
}