const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Create logs directory if it doesn't exist
const logDirectory = path.join(__dirname, '..', config.logging.dir);
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '0';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
    (res._startAt[1] - req._startAt[1]) / 1000000;
  return ms.toFixed(3);
});

// Development format
const developmentFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Production format (more detailed)
const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Create logger middleware based on environment
const createLogger = () => {
  if (config.server.env === 'development') {
    // Colorized output for development
    return morgan(developmentFormat);
  } else {
    // Write to file in production
    return morgan(productionFormat, { stream: accessLogStream });
  }
};

// Custom logger utility functions
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message} ${JSON.stringify(meta)}`;
    
    if (config.server.env === 'development') {
      console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan color
    } else {
      fs.appendFileSync(path.join(logDirectory, 'app.log'), logMessage + '\n');
    }
  },

  error: (message, error = {}, meta = {}) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error.stack || error.message || error;
    const logMessage = `[${timestamp}] [ERROR] ${message} ${errorDetails} ${JSON.stringify(meta)}`;
    
    if (config.server.env === 'development') {
      console.error('\x1b[31m%s\x1b[0m', logMessage); // Red color
    }
    
    fs.appendFileSync(path.join(logDirectory, 'error.log'), logMessage + '\n');
  },

  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WARN] ${message} ${JSON.stringify(meta)}`;
    
    if (config.server.env === 'development') {
      console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow color
    } else {
      fs.appendFileSync(path.join(logDirectory, 'app.log'), logMessage + '\n');
    }
  },

  debug: (message, meta = {}) => {
    if (config.logging.level === 'debug') {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [DEBUG] ${message} ${JSON.stringify(meta)}`;
      
      if (config.server.env === 'development') {
        console.log('\x1b[35m%s\x1b[0m', logMessage); // Magenta color
      }
    }
  }
};

module.exports = {
  createLogger,
  logger
};