/**
 * Logger Configuration
 *
 * Winston-based logging system with multiple transports
 * Handles different log levels and formats for development and production
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist (only in non-serverless environments)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
let logsDir;

if (!isServerless) {
  logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} else {
  // Use /tmp directory for serverless environments (if needed)
  logsDir = '/tmp';
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'hotel-platform-backend' },
  transports: []
});

// Configure transports based on environment
if (isServerless) {
  // For serverless environments, use console logging only
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  }));
} else {
  // For traditional server environments, use file logging
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 3,
    tailable: true
  }));

  // Handle exceptions and rejections with files
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  );
}

// Add console logging in development or serverless environments
if (process.env.NODE_ENV !== 'production' || isServerless) {
  if (!isServerless) {
    logger.add(new winston.transports.Console({
      format: consoleFormat
    }));
  }
}

// Create a stream object for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Log HTTP requests with additional context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
logger.logRequest = (req, res, message = '') => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    statusCode: res.statusCode,
    message: message || 'HTTP Request'
  };

  if (res.statusCode >= 400) {
    logger.error('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log authentication events
 * @param {string} event - Authentication event type
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {Object} additional - Additional data
 */
logger.logAuth = (event, user, req, additional = {}) => {
  const logData = {
    event,
    userId: user?.id,
    userRole: user?.role,
    email: user?.email,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    ...additional
  };

  logger.info('Authentication Event', logData);
};

/**
 * Log business events (bookings, payments, etc.)
 * @param {string} event - Business event type
 * @param {Object} data - Event data
 * @param {Object} user - User object
 */
logger.logBusiness = (event, data, user = null) => {
  const logData = {
    event,
    userId: user?.id,
    userRole: user?.role,
    timestamp: new Date().toISOString(),
    ...data
  };

  logger.info('Business Event', logData);
};

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {Object} req - Express request object
 * @param {Object} additional - Additional data
 */
logger.logSecurity = (event, req, additional = {}) => {
  const logData = {
    event,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    url: req?.originalUrl,
    method: req?.method,
    timestamp: new Date().toISOString(),
    ...additional
  };

  logger.warn('Security Event', logData);
};

/**
 * Log database operations
 * @param {string} operation - Database operation type
 * @param {string} collection - Collection name
 * @param {Object} data - Operation data
 * @param {Object} user - User object
 */
logger.logDatabase = (operation, collection, data, user = null) => {
  const logData = {
    operation,
    collection,
    userId: user?.id,
    userRole: user?.role,
    recordId: data?.id || data?._id,
    timestamp: new Date().toISOString()
  };

  logger.info('Database Operation', logData);
};

module.exports = logger;
