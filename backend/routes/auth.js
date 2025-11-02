/**
 * Authentication Routes
 *
 * Handles login, registration, password management, and token refresh
 * Supports all user roles with role-specific authentication flows
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { catchAsync, AppError } = require('../middleware/error');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const ServiceProvider = require('../models/ServiceProvider');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

const router = express.Router();

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @param {string} role - User role
 * @param {boolean} rememberMe - Whether to use extended expiration
 * @returns {string} JWT token
 */
const signToken = (id, role, rememberMe = false) => {
  const expiresIn = rememberMe
    ? (process.env.JWT_REMEMBER_EXPIRE || '30d') // 30 days for remember me
    : (process.env.JWT_EXPIRE || '24h'); // 24 hours default

  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * Generate refresh token
 * @param {string} id - User ID
 * @param {boolean} rememberMe - Whether to use extended expiration
 * @returns {string} Refresh token
 */
const signRefreshToken = (id, rememberMe = false) => {
  const expiresIn = rememberMe
    ? (process.env.JWT_REFRESH_REMEMBER_EXPIRE || '90d') // 90 days for remember me
    : (process.env.JWT_REFRESH_EXPIRE || '7d'); // 7 days default

  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn
  });
};

/**
 * Create and send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Response message
 * @param {boolean} rememberMe - Whether to use extended token expiration
 */
const createSendToken = (user, statusCode, res, message = 'Success', rememberMe = false) => {
  const token = signToken(user._id, user.role, rememberMe);
  const refreshToken = signRefreshToken(user._id, rememberMe);

  // Calculate cookie expiration based on rememberMe
  const tokenExpireDays = rememberMe ? 30 : 1; // 30 days or 1 day
  const refreshExpireDays = rememberMe ? 90 : 7; // 90 days or 7 days

  const cookieOptions = {
    expires: new Date(Date.now() + tokenExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: process.env.NODE_ENV === 'production', // Allow JS access in development
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + refreshExpireDays * 24 * 60 * 60 * 1000)
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user,
      token,
      refreshToken
    }  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, catchAsync(async (req, res, next) => {
  // Get fresh user data from database
  const user = await User.findById(req.user.id)
    .populate('selectedHotelId', 'name address paymentSettings.currency')
    .populate('hotelId', 'name address paymentSettings.currency')
    .select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
}));

/**
 * @route   POST /api/auth/register
 * @desc    Register a new guest user
 * @access  Public
 */
router.post('/register', catchAsync(async (req, res, next) => {
  const {
    firstName,
    email,
    password,
    phone,
    selectedHotelId,
    roomNumber,
    checkInDate,
    checkOutDate,
    qrBased // Optional flag to indicate QR-based registration
  } = req.body;

  // Registration data received (output removed)

  // Validate required fields
  if (!firstName) {
    return next(new AppError('First name is required', 400));
  }
  if (!email) {
    return next(new AppError('Email is required', 400));
  }
  if (!password) {
    return next(new AppError('Password is required', 400));
  }
  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }
  if (!selectedHotelId) {
    return next(new AppError('Hotel selection is required', 400));
  }
  if (!roomNumber) {
    return next(new AppError('Room number is required', 400));
  }
  if (!checkInDate) {
    return next(new AppError('Check-in date is required', 400));
  }
  if (!checkOutDate) {
    return next(new AppError('Check-out date is required', 400));
  }

  // Validate dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    return next(new AppError('Check-in date cannot be in the past', 400));
  }
  if (checkOut <= checkIn) {
    return next(new AppError('Check-out date must be after check-in date', 400));
  }

  // Check if user already exists for this specific hotel
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    selectedHotelId: selectedHotelId
  });
  if (existingUser) {
    logger.logSecurity('REGISTRATION_ATTEMPT_EXISTING_EMAIL_HOTEL', req, { email, hotelId: selectedHotelId });
    return next(new AppError('User with this email already exists for this hotel', 400));
  }

  // Verify hotel exists
  const hotel = await Hotel.findById(selectedHotelId);
  if (!hotel || !hotel.isActive) {
    return next(new AppError('Invalid hotel selection', 400));
  }
  // Create new guest user with required information only
  const newUser = await User.create({
    firstName,
    email: email.toLowerCase(),
    password,
    phone,
    role: 'guest',
    selectedHotelId,
    roomNumber,
    checkInDate,
    checkOutDate,
    hasActiveBooking: true, // Set to true since they're providing booking details
    isActive: true
  });

  // Log registration with QR indication
  const logData = {
    hotelId: selectedHotelId,
    hotelName: hotel.name,
    qrBased: qrBased || false
  };

  if (qrBased) {
    logger.logAuth('USER_REGISTERED_VIA_QR', newUser, req, logData);
  } else {
    logger.logAuth('USER_REGISTERED', newUser, req, logData);
  }

  createSendToken(newUser, 201, res, 'User registered successfully. You can now log in to your account.');
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user (all roles) with optional hotel-scoped authentication
 * @access  Public
 */
router.post('/login', catchAsync(async (req, res, next) => {
  const { email, password, role, hotelId, rememberMe } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    logger.logSecurity('LOGIN_ATTEMPT_MISSING_CREDENTIALS', req, { email });
    return next(new AppError('Please provide email and password', 400));
  }

  // For guest role, require hotelId (QR-based login)
  if (role === 'guest' && !hotelId) {
    logger.logSecurity('LOGIN_ATTEMPT_GUEST_NO_HOTEL_ID', req, { email });
    return next(new AppError('Hotel identification required. Please scan QR code at hotel reception.', 400));
  }

  // Build user query with hotel context if provided (don't filter by isActive yet)
  let userQuery = {
    email: email.toLowerCase()
  };

  // If hotelId is provided, scope the search to that hotel
  if (hotelId) {
    userQuery.selectedHotelId = hotelId;
  }

  // Find user and include password field and other necessary fields
  const user = await User.findOne(userQuery)
    .select('+password')
    .populate('selectedHotelId', 'name address');

  // Check if user exists first
  if (!user) {
    const logData = { email, hotelId };
    if (hotelId) {
      logger.logSecurity('LOGIN_ATTEMPT_INVALID_CREDENTIALS_HOTEL_SCOPED', req, logData);
      return next(new AppError('Invalid credentials or user not found for this hotel', 401));
    } else {
      logger.logSecurity('LOGIN_ATTEMPT_INVALID_CREDENTIALS_NO_USER', req, logData);
      return next(new AppError('Incorrect email or password', 401));
    }
  }

  // Check if account is active and handle deactivation reasons
  if (!user.isActive) {
    const logData = { email, hotelId, deactivationReason: user.deactivationReason };
    logger.logSecurity('LOGIN_ATTEMPT_INACTIVE_ACCOUNT', req, logData);

    let errorMessage = 'Your account has been deactivated. Please contact the hotel reception to reactivate your account.';

    if (user.deactivationReason === 'checkout_expired') {
      errorMessage = 'Your account has been deactivated because your checkout time has passed. Please contact hotel reception to reactivate your account.';
    } else if (user.deactivationReason === 'admin_action') {
      errorMessage = 'Your account has been deactivated by hotel administration. Please contact hotel reception for assistance.';
    } else if (user.deactivationReason === 'manual') {
      errorMessage = 'Your account has been manually deactivated. Please contact hotel reception for assistance.';
    }

    return next(new AppError(errorMessage, 403));
  }

  // Check if checkout has expired for guest users and auto-deactivate
  if (user.role === 'guest' && user.isCheckoutExpired()) {
    await user.deactivateAccount('checkout_expired');
    logger.logSecurity('LOGIN_ATTEMPT_CHECKOUT_EXPIRED', req, {
      email,
      hotelId,
      checkoutTime: user.checkoutTime
    });
    return next(new AppError('Your checkout time has passed and your account has been automatically deactivated. Please contact hotel reception to extend your stay.', 403));
  }

  // Check password
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) {
    const logData = { email, hotelId };
    logger.logSecurity('LOGIN_ATTEMPT_INVALID_PASSWORD', req, logData);
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check role if specified
  if (role && user.role !== role) {
    logger.logSecurity('LOGIN_ATTEMPT_WRONG_ROLE', req, {
      email,
      expectedRole: role,
      actualRole: user.role,
      hotelId
    });
    return next(new AppError('Invalid login credentials for this portal', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const logData = { hotelId, rememberMe: !!rememberMe };
  if (hotelId) {
    logger.logAuth('USER_LOGIN_VIA_QR', user, req, logData);
  } else {
    logger.logAuth('USER_LOGIN', user, req, logData);
  }

  // Create a clean user object for response (excluding sensitive fields)
  const userForToken = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    roomNumber: user.roomNumber,
    checkInDate: user.checkInDate,
    checkOutDate: user.checkOutDate,
    hasActiveBooking: user.hasActiveBooking,
    selectedHotelId: user.selectedHotelId,
    hotelId: user.hotelId,
    serviceProviderId: user.serviceProviderId
  };

  // Login response user data (output removed)

  const message = hotelId ? 'Hotel-scoped login successful' : 'Login successful';
  createSendToken(userForToken, 200, res, message, rememberMe || false);
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });

  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });

  logger.logAuth('USER_LOGOUT', req.user, req);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public (requires refresh token)
 */
router.post('/refresh-token', catchAsync(async (req, res, next) => {
  let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 401));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+isActive').populate('selectedHotelId', 'name address');

    if (!currentUser || !currentUser.isActive) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    createSendToken(currentUser, 200, res, 'Token refreshed successfully');
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email (supports hotel-scoped reset for guests)
 * @access  Public
 */
router.post('/forgot-password', catchAsync(async (req, res, next) => {
  const { email, hotelId, qrToken } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  // For guest users, require either hotelId or qrToken for hotel-scoped reset
  let validatedHotelId = hotelId;
  let hotelName = '';

  if (qrToken) {
    try {
      // Validate QR token and extract hotel information
      const hotelInfo = await qrUtils.processQRRegistration(qrToken);
      validatedHotelId = hotelInfo.hotelId;
      hotelName = hotelInfo.hotelName;

      logger.info('QR token validated for password reset', {
        hotelId: validatedHotelId,
        hotelName: hotelName,
        email: email.toLowerCase()
      });
    } catch (error) {
      logger.logSecurity('PASSWORD_RESET_INVALID_QR_TOKEN', req, { email, qrTokenError: error.message });
      return next(new AppError('Invalid QR code. Please scan a valid hotel QR code.', 400));
    }
  }

  // Build user query - include hotel scope if provided
  let userQuery = {
    email: email.toLowerCase(),
    isActive: true
  };

  // If hotel context is provided, scope the search to that hotel (for guests)
  // Hotel admins can also use this without hotel context
  if (validatedHotelId) {
    userQuery.selectedHotelId = validatedHotelId;
    userQuery.role = 'guest'; // Ensure we're only looking for guest users when hotel-scoped
  } else {
    // For non-hotel-scoped requests, allow hotel admin password reset
    // Don't add role restriction - this allows hotel admins, service providers, etc.
  }

  // Get user based on email and hotel context
  const user = await User.findOne(userQuery);

  if (!user) {
    // Don't reveal if user exists or not, but log the attempt with context
    const logContext = { email, hotelId: validatedHotelId, hotelScoped: !!validatedHotelId };
    logger.logSecurity('PASSWORD_RESET_ATTEMPT_NONEXISTENT_USER', req, logContext);

    return res.status(200).json({
      success: true,
      message: validatedHotelId
        ? 'If an account with that email exists for this hotel, a password reset email has been sent.'
        : 'If an account with that email exists, a password reset email has been sent.'
    });
  }

  // Get hotel information if not already available
  if (user.role === 'guest' && user.selectedHotelId && !hotelName) {
    const hotel = await Hotel.findById(user.selectedHotelId);
    hotelName = hotel ? hotel.name : 'Your Hotel';
  } else if (user.role === 'hotel' && user.hotelId && !hotelName) {
    // For hotel admin users, get hotel name from their hotelId
    const hotel = await Hotel.findById(user.hotelId);
    hotelName = hotel ? hotel.name : 'Your Hotel';
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user's email
  try {
    // Create reset URL with hotel context for guests
    let resetURL;
    if (user.role === 'guest' && validatedHotelId) {
      resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}?hotelId=${validatedHotelId}`;
    } else if (user.role === 'hotel') {
      resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/hotel/reset-password/${resetToken}`;
    } else {
      resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    }

    // Customize email content based on user role and hotel context
    const emailData = {
      firstName: user.firstName,
      resetURL,
      expiryTime: '10 minutes'
    };

    // Add hotel context for guest users
    if (user.role === 'guest' && hotelName) {
      emailData.hotelName = hotelName;
      emailData.isHotelGuest = true;
    } else if (user.role === 'hotel' && hotelName) {
      emailData.hotelName = hotelName;
      emailData.isHotelAdmin = true;
    }

    // Choose appropriate email template and subject
    let emailSubject = 'Password Reset Request';
    let emailTemplate = 'password-reset';

    if (user.role === 'guest' && hotelName) {
      emailSubject = `Password Reset Request - ${hotelName}`;
    } else if (user.role === 'hotel' && hotelName) {
      emailSubject = `Hotel Admin Password Reset - ${hotelName}`;
      emailTemplate = 'hotel-admin-password-reset';
    }

    await sendEmail({
      email: user.email,
      subject: emailSubject,
      template: emailTemplate,
      data: emailData
    });

    // Log with hotel context
    const logData = {
      hotelId: validatedHotelId || (user.role === 'hotel' ? user.hotelId : null),
      hotelName: hotelName,
      hotelScoped: !!validatedHotelId,
      userRole: user.role
    };
    logger.logAuth('PASSWORD_RESET_REQUESTED', user, req, logData);

    let successMessage = 'Password reset email sent successfully.';
    if (validatedHotelId) {
      successMessage = `Password reset email sent successfully for ${hotelName}.`;
    } else if (user.role === 'hotel' && hotelName) {
      successMessage = `Hotel admin password reset email sent successfully for ${hotelName}.`;
    }

    res.status(200).json({
      success: true,
      message: successMessage
    });

  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error('Error sending password reset email:', err);
    return next(new AppError('There was an error sending the email. Try again later.', 500));
  }
}));

/**
 * @route   PATCH /api/auth/reset-password/:token
 * @desc    Reset password with token (supports hotel-scoped reset for guests)
 * @access  Public
 */
router.patch('/reset-password/:token', catchAsync(async (req, res, next) => {
  const { password, passwordConfirm, hotelId } = req.body;

  if (!password || !passwordConfirm) {
    return next(new AppError('Password and password confirmation are required', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Build query for finding user with hotel context if provided
  let userQuery = {
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isActive: true
  };

  // If hotelId is provided, add hotel scope (for guest users)
  if (hotelId) {
    userQuery.selectedHotelId = hotelId;
    userQuery.role = 'guest';
  }

  const user = await User.findOne(userQuery);

  // If token has not expired, and there is user, set the new password
  if (!user) {
    const logContext = {
      token: req.params.token,
      hotelId: hotelId,
      hotelScoped: !!hotelId
    };
    logger.logSecurity('PASSWORD_RESET_INVALID_TOKEN', req, logContext);

    return next(new AppError(
      hotelId
        ? 'Token is invalid, has expired, or user not found for this hotel'
        : 'Token is invalid or has expired',
      400
    ));
  }

  // Additional validation for hotel-scoped reset
  if (hotelId && user.role === 'guest') {
    if (!user.selectedHotelId || user.selectedHotelId.toString() !== hotelId) {
      logger.logSecurity('PASSWORD_RESET_HOTEL_MISMATCH', req, {
        userId: user._id,
        userHotelId: user.selectedHotelId,
        requestedHotelId: hotelId
      });
      return next(new AppError('Invalid hotel context for password reset', 400));
    }

    // Get hotel name for logging
    const hotel = await Hotel.findById(hotelId);
    const hotelName = hotel ? hotel.name : 'Unknown Hotel';

    logger.logAuth('PASSWORD_RESET_COMPLETED_HOTEL_SCOPED', user, req, {
      hotelId: hotelId,
      hotelName: hotelName
    });
  } else {
    logger.logAuth('PASSWORD_RESET_COMPLETED', user, req);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const successMessage = hotelId
    ? 'Password reset successful for your hotel account'
    : 'Password reset successful';

  createSendToken(user, 200, res, successMessage);
}));

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update password for logged in user
 * @access  Private
 */
router.patch('/update-password', protect, catchAsync(async (req, res, next) => {
  const { passwordCurrent, password, passwordConfirm } = req.body;

  if (!passwordCurrent || !password || !passwordConfirm) {
    return next(new AppError('Current password, new password, and password confirmation are required', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('New passwords do not match', 400));
  }

  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // Check if current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    logger.logSecurity('PASSWORD_UPDATE_WRONG_CURRENT', req, { userId: user._id });
    return next(new AppError('Your current password is incorrect', 401));
  }

  // Update password
  user.password = password;
  await user.save();

  logger.logAuth('PASSWORD_UPDATED', user, req);

  createSendToken(user, 200, res, 'Password updated successfully');
}));

/**
 * @route   PATCH /api/auth/update-me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/update-me', protect, catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
  }

  // Filtered out unwanted fields that are not allowed to be updated
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address', 'preferences'];
  const filteredBody = {};

  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredBody[el] = req.body[el];
    }
  });

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  logger.logAuth('PROFILE_UPDATED', updatedUser, req);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

/**
 * @route   DELETE /api/auth/delete-me
 * @desc    Deactivate current user account
 * @access  Private
 */
router.delete('/delete-me', protect, catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  logger.logAuth('ACCOUNT_DEACTIVATED', req.user, req);

  res.status(204).json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated and return basic user info
 * @access  Private
 */
router.get('/check', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      isAuthenticated: true,
      userId: req.user._id,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email
    }
  });
});

/**
 * @route   GET /api/auth/debug/me
 * @desc    Get current user information for debugging
 * @access  Private
 */
router.get('/debug/me', protect, catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('selectedHotelId', 'name address')
    .populate('hotelId', 'name address');
  // Debug user data (output removed)

  res.status(200).json({
    success: true,
    data: {
      user: {
        ...user.toObject(),        password: undefined
      }
    }
  });
}));

// Import QR utilities
const qrUtils = require('../utils/qr');

/**
 * @route   POST /api/auth/validate-qr
 * @desc    Validate QR token and return hotel information for registration and login
 * @access  Public
 */
router.post('/validate-qr', catchAsync(async (req, res, next) => {
  const { qrToken, context = 'registration' } = req.body;

  if (!qrToken) {
    return next(new AppError('QR token is required', 400));
  }

  try {
    // Process QR token and validate hotel
    const hotelInfo = await qrUtils.processQRRegistration(qrToken);

    // Add context-specific information
    const responseData = {
      ...hotelInfo,
      context: context,
      supportedActions: ['registration', 'login']
    };

    logger.info(`QR token validated for ${context}`, {
      hotelId: hotelInfo.hotelId,
      hotelName: hotelInfo.hotelName,
      context: context
    });

    res.status(200).json({
      status: 'success',
      data: responseData
    });

  } catch (error) {
    // Pass through AppError instances (they have appropriate status codes)
    if (error instanceof AppError) {
      return next(error);
    }

    logger.error('QR validation error:', error);
    return next(new AppError('Failed to validate QR code', 500));
  }
}));

/**
 * @route   GET /auth/verify-session
 * @desc    Verify if user session is still valid
 * @access  Private
 */
router.get('/verify-session', protect, catchAsync(async (req, res, next) => {
  // If we reach here, the protect middleware has already verified the token
  // and checked that the user is active

  const user = req.user;

  // Additional check for guest checkout expiration
  if (user.role === 'guest' && user.isCheckoutExpired && user.isCheckoutExpired()) {
    logger.info(`Session verification failed - checkout expired for user ${user._id}`);
    return next(new AppError('Your checkout time has passed and your account has been deactivated. Please contact hotel reception for assistance.', 401));
  }

  res.status(200).json({
    status: 'success',
    message: 'Session is valid',
    data: {
      userId: user._id,
      role: user.role,
      isActive: user.isActive,
      checkoutTime: user.checkoutTime
    }
  });
}));

module.exports = router;
