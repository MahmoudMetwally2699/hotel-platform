/**
 * Authentication and Authorization Middleware
 *
 * JWT-based authentication with role-based access control
 * Protects routes based on user roles and permissions
 */

const jwt = require('jsonwebtoken');
const { AppError, catchAsync } = require('./error');
const User = require('../models/User');
const logger = require('../utils/logger');

// Removed rate limiting for authentication attempts

/**
 * Protect routes - Verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    logger.logSecurity('ACCESS_DENIED_NO_TOKEN', req);
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id)
      .select('+isActive')
      .populate('selectedHotelId', 'name address')
      .populate('serviceProviderId', 'businessName');
    if (!currentUser) {
      logger.logSecurity('ACCESS_DENIED_USER_NOT_FOUND', req, { userId: decoded.id });
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // 4) Check if user account is active
    if (!currentUser.isActive) {
      logger.logSecurity('ACCESS_DENIED_INACTIVE_USER', req, { userId: decoded.id });
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      logger.logSecurity('ACCESS_DENIED_PASSWORD_CHANGED', req, { userId: decoded.id });
      return next(new AppError('User recently changed password! Please log in again.', 401));
    }    // Grant access to protected route
    req.user = currentUser;
    console.log('🔐 protect middleware - Set req.user:', {
      userId: req.user._id,
      role: req.user.role,
      email: req.user.email,
      hotelId: req.user.hotelId,
      serviceProviderId: req.user.serviceProviderId,
      selectedHotelId: req.user.selectedHotelId
    });
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.logSecurity('ACCESS_DENIED_INVALID_TOKEN', req);
      return next(new AppError('Invalid token. Please log in again!', 401));
    } else if (error.name === 'TokenExpiredError') {
      logger.logSecurity('ACCESS_DENIED_EXPIRED_TOKEN', req);
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }

    logger.error('JWT Verification Error:', error);
    return next(new AppError('Authentication failed. Please log in again.', 401));
  }
});

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function}
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.logSecurity('ACCESS_DENIED_INSUFFICIENT_PERMISSIONS', req, {
        userRole: req.user.role,
        requiredRoles: roles
      });

      // Provide more specific error messages based on the user's role and required roles
      let errorMessage = 'You do not have permission to perform this action';

      if (req.user.role === 'guest' && roles.includes('service')) {
        errorMessage = 'This endpoint is only accessible to service providers. Guests should use the client endpoints instead.';
      } else if (req.user.role === 'guest' && roles.includes('hotel')) {
        errorMessage = 'This endpoint is only accessible to hotel administrators. Guests should use the client endpoints instead.';
      } else if (req.user.role === 'guest' && roles.includes('superadmin')) {
        errorMessage = 'This endpoint is only accessible to platform administrators.';
      }

      return next(new AppError(errorMessage, 403));
    }
    next();
  };
};

/**
 * Restrict access to hotel admins to their own hotel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const restrictToOwnHotel = catchAsync(async (req, res, next) => {
  // Debug logging to understand the issue
  console.log('🔐 restrictToOwnHotel - req.user:', req.user);
  console.log('🔐 restrictToOwnHotel - req.user exists:', !!req.user);

  if (!req.user) {
    console.log('❌ req.user is undefined in restrictToOwnHotel');
    return next(new AppError('User not authenticated', 401));
  }

  if (req.user.role === 'superadmin') {
    // Super admin can access any hotel
    console.log('🔐 Superadmin access granted');
    return next();
  }

  if (req.user.role !== 'hotel') {
    logger.logSecurity('ACCESS_DENIED_NOT_HOTEL_ADMIN', req);
    return next(new AppError('You do not have permission to access hotel data', 403));
  }

  // For hotel route with :hotelId parameter
  if (req.params.hotelId) {
    if (req.params.hotelId !== req.user.hotelId.toString()) {
      logger.logSecurity('ACCESS_DENIED_DIFFERENT_HOTEL', req, {
        userHotelId: req.user.hotelId,
        requestedHotelId: req.params.hotelId
      });
      return next(new AppError('You can only access data from your own hotel', 403));
    }  }

  // For requests with hotelId in body
  if (req.body && req.body.hotelId && req.body.hotelId !== req.user.hotelId.toString()) {
    logger.logSecurity('ACCESS_DENIED_DIFFERENT_HOTEL', req, {
      userHotelId: req.user.hotelId,
      requestedHotelId: req.body.hotelId
    });
    return next(new AppError('You can only modify data for your own hotel', 403));
  }

  next();
});

/**
 * Restrict access to service providers to their own account and services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const restrictToOwnServiceProvider = catchAsync(async (req, res, next) => {
  if (req.user.role === 'superadmin' || req.user.role === 'hotel') {
    // Superadmin and hotel admins can access any service provider data
    // Note: Hotel admins can only manage providers in their own hotel,
    // which is already enforced by restrictToOwnHotel middleware
    return next();
  }

  if (req.user.role !== 'service') {
    logger.logSecurity('ACCESS_DENIED_NOT_SERVICE_PROVIDER', req);
    return next(new AppError('You do not have permission to access service provider data', 403));
  }

  // For service provider route with :providerId parameter
  if (req.params.providerId && req.params.providerId !== req.user.serviceProviderId.toString()) {
    logger.logSecurity('ACCESS_DENIED_DIFFERENT_SERVICE_PROVIDER', req, {
      userProviderId: req.user.serviceProviderId,
      requestedProviderId: req.params.providerId
    });
    return next(new AppError('You can only access your own service provider data', 403));
  }

  next();
});

/**
 * Restrict service provider management to hotel admins only (not super admins)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const restrictProviderToHotelAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role === 'superadmin') {
    // Super admins can no longer manage service providers directly
    logger.logSecurity('ACCESS_DENIED_SUPERADMIN_PROVIDER_MANAGEMENT', req);
    return next(new AppError('Super admins cannot manage service providers directly. Please contact the hotel admin.', 403));
  }

  if (req.user.role !== 'hotel') {
    logger.logSecurity('ACCESS_DENIED_NOT_HOTEL_ADMIN', req);
    return next(new AppError('You do not have permission to manage service providers', 403));
  }

  next();
});

/**
 * Restrict guest access to their own bookings and profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const restrictToOwnBookings = catchAsync(async (req, res, next) => {
  if (req.user.role === 'superadmin' || req.user.role === 'hotel' || req.user.role === 'service') {
    // Admin users can access bookings based on their role permissions
    return next();
  }

  if (req.user.role !== 'guest') {
    logger.logSecurity('ACCESS_DENIED_NOT_GUEST', req);
    return next(new AppError('You do not have permission to access booking data', 403));
  }

  // For booking route with :bookingId parameter
  if (req.params.bookingId) {
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking || booking.userId.toString() !== req.user.id) {
      logger.logSecurity('ACCESS_DENIED_DIFFERENT_BOOKING_OWNER', req, {
        userId: req.user.id,
        bookingId: req.params.bookingId
      });
      return next(new AppError('You can only access your own bookings', 403));
    }
  }

  next();
});

module.exports = {
  protect,
  restrictTo,
  restrictToOwnHotel,
  restrictToOwnServiceProvider,
  restrictToOwnBookings,
  restrictProviderToHotelAdmin
};
