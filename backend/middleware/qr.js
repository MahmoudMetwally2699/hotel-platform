/**
 * QR Token Validation Middleware
 *
 * Optional middleware for validating QR tokens in various routes
 * Provides flexible QR token validation without breaking existing functionality
 */

const { AppError, catchAsync } = require('./error');
const { validateQRToken, processQRRegistration } = require('../utils/qr');
const logger = require('../utils/logger');

/**
 * Optional QR token validation middleware
 * Validates QR token if present in request body or query parameters
 * Does not block request if no QR token is provided
 */
const validateOptionalQR = catchAsync(async (req, res, next) => {
  const qrToken = req.body.qrToken || req.query.qr;

  if (!qrToken) {
    // No QR token provided, continue with normal flow
    return next();
  }

  try {
    // Validate QR token and add hotel info to request
    const hotelInfo = await processQRRegistration(qrToken);

    // Add validated hotel information to request object
    req.qrHotel = hotelInfo;

    logger.info('QR token validated in middleware', {
      hotelId: hotelInfo.hotelId,
      hotelName: hotelInfo.hotelName,
      route: req.originalUrl
    });

    next();
  } catch (error) {
    // QR validation failed - add error info but don't block request
    req.qrError = error.message;

    logger.logSecurity('QR_TOKEN_VALIDATION_FAILED', null, req, {
      error: error.message,
      qrToken: qrToken.substring(0, 20) + '...' // Log partial token for debugging
    });

    next(); // Continue with request even if QR validation fails
  }
});

/**
 * Required QR token validation middleware
 * Blocks request if QR token is invalid or missing
 */
const requireValidQR = catchAsync(async (req, res, next) => {
  const qrToken = req.body.qrToken || req.query.qr;

  if (!qrToken) {
    return next(new AppError('QR token is required', 400));
  }

  try {
    // Validate QR token and add hotel info to request
    const hotelInfo = await processQRRegistration(qrToken);

    // Add validated hotel information to request object
    req.qrHotel = hotelInfo;

    logger.info('QR token validated (required)', {
      hotelId: hotelInfo.hotelId,
      hotelName: hotelInfo.hotelName,
      route: req.originalUrl
    });

    next();
  } catch (error) {
    logger.logSecurity('QR_TOKEN_REQUIRED_VALIDATION_FAILED', null, req, {
      error: error.message,
      qrToken: qrToken.substring(0, 20) + '...'
    });

    // Block request if QR validation fails
    return next(error);
  }
});

/**
 * Extract QR token from various sources (body, query, headers)
 * Utility middleware to normalize QR token location
 */
const extractQRToken = (req, res, next) => {
  // Check various locations for QR token
  const qrToken =
    req.body.qrToken ||
    req.query.qr ||
    req.query.qrToken ||
    req.headers['x-qr-token'];

  if (qrToken) {
    // Normalize QR token location
    req.qrToken = qrToken;
    req.body.qrToken = qrToken;
  }

  next();
};

/**
 * QR-based hotel context middleware
 * Automatically sets hotel context from QR token for subsequent middleware
 */
const setQRHotelContext = catchAsync(async (req, res, next) => {
  if (req.qrHotel) {
    // Set hotel context from validated QR token
    req.hotelContext = {
      hotelId: req.qrHotel.hotelId,
      hotelName: req.qrHotel.hotelName,
      source: 'qr_token'
    };

    logger.info('Hotel context set from QR token', {
      hotelId: req.qrHotel.hotelId,
      route: req.originalUrl
    });
  }

  next();
});

/**
 * Rate limiting for QR validation attempts
 * Prevents brute force attacks on QR tokens
 */
const qrRateLimit = (req, res, next) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll just add basic IP-based tracking
  const clientIP = req.ip || req.connection.remoteAddress;

  // In production, implement proper rate limiting here
  // For example: max 10 QR validation attempts per minute per IP

  logger.info('QR validation attempt', {
    clientIP,
    userAgent: req.get('User-Agent'),
    route: req.originalUrl
  });

  next();
};

/**
 * Security headers for QR-related endpoints
 */
const qrSecurityHeaders = (req, res, next) => {
  // Add security headers for QR-related requests
  res.set({
    'X-QR-Security': 'enabled',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });

  next();
};

module.exports = {
  validateOptionalQR,
  requireValidQR,
  extractQRToken,
  setQRHotelContext,
  qrRateLimit,
  qrSecurityHeaders
};
