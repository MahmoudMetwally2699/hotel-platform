/**
 * Error Handling Middleware
 *
 * Global error handler for Express.js application
 * Handles different types of errors and returns appropriate responses
 */

const logger = require('../utils/logger');

/**
 * Custom Error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle MongoDB Cast Errors (Invalid ObjectId)
 * @param {Error} err - Mongoose CastError
 * @returns {AppError}
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB Duplicate Field Errors
 * @param {Error} err - MongoDB duplicate key error
 * @returns {AppError}
 */
const handleDuplicateFieldsDB = (err) => {
  // Handle both old and new MongoDB driver error formats
  const errorMessage = err.errmsg || err.message || '';

  // Check if this is an email duplicate error (which we want to handle specially for hotels)
  if (errorMessage.includes('email_1') || errorMessage.includes('email')) {
    // Check if it's a hotel-scoped email error
    if (errorMessage.includes('selectedHotelId')) {
      return new AppError('Email already exists for this hotel. Please use a different email or login instead.', 400);
    } else {
      return new AppError('Email already exists. For hotel guests, please scan the QR code at reception to register.', 400);
    }
  }

  // For other duplicate fields, try to extract the value
  let value = 'this value';
  try {
    const match = errorMessage.match(/(["'])(\\?.)*?\1/);
    if (match) {
      value = match[0];
    }
  } catch (e) {
    // If we can't extract the value, use a generic message
  }

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB Validation Errors
 * @param {Error} err - Mongoose ValidationError
 * @returns {AppError}
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = errors.join('. ');
  return new AppError(message, 400);
};

/**
 * Handle JWT Invalid Token Error
 * @returns {AppError}
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};

/**
 * Handle JWT Expired Token Error
 * @returns {AppError}
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', 401);
};

/**
 * Handle Multer File Upload Errors
 * @param {Error} err - Multer error
 * @returns {AppError}
 */
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size allowed is 5MB', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files. Maximum 5 files allowed', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }
  return new AppError('File upload error', 400);
};

/**
 * Send error response in development mode
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      stack: err.stack,
      details: err
    });
  }

  // Rendered website error
  logger.error('ERROR:', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

/**
 * Send error response in production mode
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }

  // Rendered website error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error('ERROR:', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error with context
  const errorContext = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    params: req.params,
    query: req.query
  };

  if (err.statusCode >= 500) {
    logger.error('Server Error', { ...errorContext, error: err.message, stack: err.stack });
  } else {
    logger.warn('Client Error', { ...errorContext, error: err.message });
  }
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types and preserve isOperational flag
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
      error.isOperational = true; // Ensure validation errors are treated as operational
    }
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
};

/**
 * Async error wrapper to catch async function errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function}
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  notFound
};
