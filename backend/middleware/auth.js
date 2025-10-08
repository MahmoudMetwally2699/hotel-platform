/**
 * Authentication and Authorization Middleware
 *
 * JWT-based authentication with role-based access control
 * Protects routes based on user roles and permissions
 */

const jwt = require('jsonwebtoken');
const { AppError, catchAsync } = require('./error');
const User = require('../models/User');
const SuperHotel = require('../models/SuperHotel');
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

  // Manual cookie parsing as fallback
  const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      });
    }
    return cookies;
  };

  const parsedCookies = parseCookies(req.headers.cookie);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (parsedCookies.jwt) {
    token = parsedCookies.jwt;
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
      logger.logSecurity('ACCESS_DENIED_INACTIVE_USER', req, {
        userId: decoded.id,
        deactivationReason: currentUser.deactivationReason,
        autoDeactivatedAt: currentUser.autoDeactivatedAt
      });

      let errorMessage = 'Your account has been deactivated. Please contact support.';

      if (currentUser.deactivationReason === 'checkout_expired') {
        errorMessage = 'Your account has been automatically deactivated because your checkout time has passed. Please contact hotel reception for assistance.';
      }

      return next(new AppError(errorMessage, 401));
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      logger.logSecurity('ACCESS_DENIED_PASSWORD_CHANGED', req, { userId: decoded.id });
      return next(new AppError('User recently changed password! Please log in again.', 401));
    }    // Grant access to protected route
    req.user = currentUser;
    // Debug output removed
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
  // Debug output removed
  if (!req.user) {
    // req.user is undefined in restrictToOwnHotel (output removed)
    return next(new AppError('User not authenticated', 401));
  }

  if (req.user.role === 'superadmin') {
    // Super admin can access any hotel (output removed)
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

/**
 * Protect super hotel routes - Verify JWT token for super hotel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protectSuperHotel = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;

  // Debug output removed
  // Manual cookie parsing as fallback
  const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      });
    }
    return cookies;
  };

  const parsedCookies = parseCookies(req.headers.cookie);

  // Check Authorization header first (more reliable for cross-origin)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    // Token found in Authorization header (output removed)
  } else if (req.cookies && req.cookies.superHotelJwt) {
    token = req.cookies.superHotelJwt;
    // Token found in cookie (output removed)
  } else if (parsedCookies.superHotelJwt) {
    token = parsedCookies.superHotelJwt;
    // Token found in manually parsed cookies (output removed)
  }

  // Final token (output removed)

  if (!token) {
    // No token found, denying access (output removed)
    logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_NO_TOKEN', req);
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if super hotel still exists
    const currentSuperHotel = await SuperHotel.findById(decoded.id)
      .populate('assignedHotels', 'name address location contactInfo');

    if (!currentSuperHotel) {
      logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_NOT_FOUND', req, { superHotelId: decoded.id });
      return next(new AppError('The super hotel belonging to this token no longer exists.', 401));
    }

    // 4) Check if super hotel account is active
    if (!currentSuperHotel.isActive) {
      logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_INACTIVE', req, { superHotelId: decoded.id });
      return next(new AppError('Your super hotel account has been deactivated. Please contact support.', 401));
    }

    // 5) Check if password changed after the token was issued
    if (currentSuperHotel.changedPasswordAfter && currentSuperHotel.changedPasswordAfter(decoded.iat)) {
      logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_PASSWORD_CHANGED', req, { superHotelId: decoded.id });
      return next(new AppError('Password recently changed! Please log in again.', 401));
    }

    // Grant access to protected route
    req.superHotel = currentSuperHotel;
    // Debug output removed
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_INVALID_TOKEN', req);
      return next(new AppError('Invalid token. Please log in again!', 401));
    } else if (error.name === 'TokenExpiredError') {
      logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_EXPIRED_TOKEN', req);
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }

    logger.error('Super Hotel JWT Verification Error:', error);
    return next(new AppError('Authentication failed. Please log in again.', 401));
  }
});

/**
 * Restrict super hotel access to their assigned hotels only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const restrictToAssignedHotels = catchAsync(async (req, res, next) => {
  if (!req.superHotel) {
    return next(new AppError('Super hotel not authenticated', 401));
  }

  // For routes with hotelId parameter
  if (req.params.hotelId) {
    const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id.toString());

    if (!assignedHotelIds.includes(req.params.hotelId)) {
      logger.logSecurity('SUPER_HOTEL_ACCESS_DENIED_UNASSIGNED_HOTEL', req, {
        superHotelId: req.superHotel._id,
        requestedHotelId: req.params.hotelId,
        assignedHotels: assignedHotelIds
      });
      return next(new AppError('You can only access data from your assigned hotels', 403));
    }
  }

  next();
});

module.exports = {
  protect,
  protectSuperHotel,
  restrictTo,
  restrictToOwnHotel,
  restrictToAssignedHotels,
  restrictToOwnServiceProvider,
  restrictToOwnBookings,
  restrictProviderToHotelAdmin
};
