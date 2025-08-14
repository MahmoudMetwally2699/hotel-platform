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
 * @returns {string} JWT token
 */
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

/**
 * Generate refresh token
 * @param {string} id - User ID
 * @returns {string} Refresh token
 */
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

/**
 * Create and send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Response message
 */
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: process.env.NODE_ENV === 'production', // Allow JS access in development
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
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
    .populate('selectedHotelId', 'name address')
    .populate('hotelId', 'name address')
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
    selectedHotelId
  } = req.body;

  console.log('Registration data received:', {
    firstName,
    email,
    phone,
    selectedHotelId
  });

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    logger.logSecurity('REGISTRATION_ATTEMPT_EXISTING_EMAIL', req, { email });
    return next(new AppError('User with this email already exists', 400));
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
    isActive: true
  });

  logger.logAuth('USER_REGISTERED', newUser, req, { hotelId: selectedHotelId });

  createSendToken(newUser, 201, res, 'User registered successfully. You can now log in to your account.');
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user (all roles)
 * @access  Public
 */
router.post('/login', catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    logger.logSecurity('LOGIN_ATTEMPT_MISSING_CREDENTIALS', req, { email });
    return next(new AppError('Please provide email and password', 400));
  }  // Find user and include password field and other necessary fields
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true
  }).select('+password').populate('selectedHotelId', 'name address');  // Check if user exists and password is correct
  if (!user) {
    logger.logSecurity('LOGIN_ATTEMPT_INVALID_CREDENTIALS_NO_USER', req, { email });
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check password
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) {
    logger.logSecurity('LOGIN_ATTEMPT_INVALID_PASSWORD', req, { email });
    return next(new AppError('Incorrect email or password', 401));
  }
  // Check role if specified
  if (role && user.role !== role) {
    logger.logSecurity('LOGIN_ATTEMPT_WRONG_ROLE', req, {
      email,
      expectedRole: role,
      actualRole: user.role
    });
    return next(new AppError('Invalid login credentials for this portal', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  logger.logAuth('USER_LOGIN', user, req);
  // Create a clean user object for response (excluding sensitive fields)
  const userForToken = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    selectedHotelId: user.selectedHotelId,
    hotelId: user.hotelId,
    serviceProviderId: user.serviceProviderId
  };

  console.log('🔍 Login response user data:', userForToken);

  createSendToken(userForToken, 200, res, 'Login successful');
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  logger.logAuth('USER_LOGOUT', req.user, req);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', catchAsync(async (req, res, next) => {
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
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  // Get user based on email
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true
  });

  if (!user) {
    // Don't reveal if user exists or not
    logger.logSecurity('PASSWORD_RESET_ATTEMPT_NONEXISTENT_USER', req, { email });
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset email has been sent.'
    });
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        firstName: user.firstName,
        resetURL,
        expiryTime: '10 minutes'
      }
    });

    logger.logAuth('PASSWORD_RESET_REQUESTED', user, req);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
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
 * @desc    Reset password with token
 * @access  Public
 */
router.patch('/reset-password/:token', catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

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

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isActive: true
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    logger.logSecurity('PASSWORD_RESET_INVALID_TOKEN', req);
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.logAuth('PASSWORD_RESET_COMPLETED', user, req);

  createSendToken(user, 200, res, 'Password reset successful');
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
  console.log('🔍 Debug user data:', {
    id: user._id,
    email: user.email,
    role: user.role,
    selectedHotelId: user.selectedHotelId,
    hotelId: user.hotelId,
    isActive: user.isActive
  });

  res.status(200).json({
    success: true,
    data: {
      user: {
        ...user.toObject(),        password: undefined
      }
    }
  });
}));

module.exports = router;
