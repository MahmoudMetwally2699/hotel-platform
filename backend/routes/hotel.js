/**
 * Hotel Admin Routes
 *
 * Routes accessible only by hotel admin users
 * Handles service provider management, user management, markup settings, and hotel operations
 * Service provider creation/management is restricted to hotel admins
 */

const express = require('express');
const mongoose = require('mongoose');
const { catchAsync, AppError } = require('../middleware/error');
const { protect, restrictTo, restrictToOwnHotel, restrictProviderToHotelAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('hotel'));
router.use(restrictToOwnHotel);

/**
 * @route   GET /api/hotel/dashboard
 * @desc    Get hotel admin dashboard data with enhanced service provider metrics
 * @access  Private/HotelAdmin
 */
router.get('/dashboard', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  // Get hotel statistics with enhanced service provider metrics
  const [
    hotel,
    totalProviders,
    activeProviders,
    totalServices,
    activeServices,
    totalBookings,
    recentBookings,
    revenueStats,
    topServices,
    pendingProviderApprovals,
    recentUsers,
    servicesByCategory
  ] = await Promise.all([
    Hotel.findById(hotelId),
    ServiceProvider.countDocuments({ hotelId }),
    ServiceProvider.countDocuments({ hotelId, isActive: true, isVerified: true }),
    Service.countDocuments({ hotelId }),
    Service.countDocuments({ hotelId, isActive: true, isApproved: true }),
    Booking.countDocuments({ hotelId }),    Booking.find({ hotelId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('serviceId serviceProviderId guestId', 'name businessName firstName lastName'),
    Booking.getRevenueStats({ hotelId }),
    Service.find({ hotelId, isActive: true })
      .sort({ 'performance.totalBookings': -1 })
      .limit(5)
      .select('name performance pricing.basePrice'),
    ServiceProvider.countDocuments({ hotelId, isVerified: false, verificationStatus: 'pending' }),
    User.find({ role: 'guest', selectedHotelId: hotelId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt'),    Service.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.basePrice' },
          totalBookings: { $sum: '$performance.totalBookings' }
        }
      }
    ])
  ]);
  // Get monthly booking trends
  const monthlyTrends = await Booking.aggregate([
    { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  // Get category performance
  const categoryPerformance = await Booking.aggregate([
    { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
    {
      $lookup: {
        from: 'services',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'serviceData'
      }
    },
    { $unwind: '$serviceData' },
    {
      $group: {
        _id: '$serviceData.category',
        bookings: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
      counts: {
        totalProviders,
        activeProviders,
        totalServices,
        activeServices,
        totalBookings,
        pendingProviderApprovals
      },
      recentBookings,
      revenueStats,
      topServices,
      monthlyTrends,
      categoryPerformance,
      servicesByCategory,
      recentUsers
    }
  });
}));

/**
 * @route   GET /api/hotel/service-providers
 * @desc    Get all service providers for the hotel
 * @access  Private/HotelAdmin
 */
router.get('/service-providers', protect, restrictToOwnHotel, catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  // Query filters
  const filter = { hotelId };

  if (req.query.status === 'active') {
    filter.isActive = true;
    filter.isVerified = true;
  } else if (req.query.status === 'pending') {
    filter.verificationStatus = 'pending';
  } else if (req.query.status === 'inactive') {
    filter.isActive = false;
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Get service providers with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const [serviceProviders, total] = await Promise.all([
    ServiceProvider.find(filter)
      .populate('adminId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ServiceProvider.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    results: serviceProviders.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: { serviceProviders }
  });
}));

/**
 * @route   GET /api/hotel/service-providers/:id
 * @desc    Get service provider details
 * @access  Private/HotelAdmin
 */
router.get('/service-providers/:id', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;

  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  }).populate('userId', 'firstName lastName email phone avatar');

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Get services offered by this provider
  const services = await Service.find({
    serviceProviderId: providerId,
    hotelId
  });
  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
        hotelId: new mongoose.Types.ObjectId(hotelId)
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        providerEarnings: { $sum: '$providerAmount' },
        hotelCommission: { $sum: '$hotelCommission' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // Get monthly booking trends
  const monthlyBookings = await Booking.aggregate([
    {      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
        hotelId: new mongoose.Types.ObjectId(hotelId)
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$bookingDate' },
          month: { $month: '$bookingDate' }
        },
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        earnings: { $sum: '$providerAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const metrics = bookingStats.length > 0 ? bookingStats[0] : {
    totalBookings: 0,
    totalRevenue: 0,
    providerEarnings: 0,
    hotelCommission: 0,
    avgRating: 0
  };

  res.status(200).json({
    status: 'success',
    data: {
      serviceProvider,
      services,
      metrics,
      monthlyBookings
    }
  });
}));

/**
 * @route   POST /api/hotel/service-providers
 * @desc    Create a new service provider account
 * @access  Private/HotelAdmin
 */
router.post('/service-providers', restrictProviderToHotelAdmin, catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;  const {
    businessName,
    description,
    contactEmail,
    contactPhone,
    address,
    businessLicense,
    taxId,
    insurance,
    capacity,
    staff,
    services,
    userId,
    userCredentials,
    sendEmail = true // Optional: Whether to send credentials via email (default: true)
  } = req.body;

  // Extract user credentials if provided
  let firstName, lastName, email, phone, password;
  if (userCredentials) {
    firstName = userCredentials.firstName;
    lastName = userCredentials.lastName;
    email = userCredentials.email;
    phone = userCredentials.phone;
    password = userCredentials.password;
  }  // Create user and service provider without transaction for better compatibility
  // Note: If you need ACID compliance, ensure your MongoDB setup supports transactions

  try {
    let user;
    // Generate ObjectIds for proper referencing (needed for both existing and new users)
    const serviceProviderId = new mongoose.Types.ObjectId();
    let userId;

    // If userId is provided, check if user exists and has the right role
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (user.role !== 'service') {
        return next(new AppError('User is not a service provider', 400));
      }
    } else {
      // Check if email already exists (only if email is provided for custom credentials)
      if (email) {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return next(new AppError('A user with this email already exists', 400));
        }
      }

      // Create a new user for the service provider
      let userEmail, userPassword, userFirstName, userLastName, userPhone;

      if (email && password && firstName && lastName) {
        // Custom credentials provided
        userEmail = email;
        userPassword = password;
        userFirstName = firstName;
        userLastName = lastName;
        userPhone = phone;

        // Validate custom password
        if (password.length < 6) {
          return next(new AppError('Password must be at least 6 characters long', 400));
        }
      } else {
        // Auto-generate credentials
        const randomId = crypto.randomBytes(8).toString('hex');
        userEmail = `provider-${randomId}@${req.get('host') || 'hotel-platform.com'}`;
        userPassword = crypto.randomBytes(8).toString('hex');
        userFirstName = businessName.split(' ')[0] || 'Service';
        userLastName = 'Provider';
        userPhone = contactPhone; // Use contactPhone for auto-generated users
      }

      // Generate userId for new user creation
      userId = new mongoose.Types.ObjectId();

      try {
        user = await User.create({
          _id: userId,
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          phone: userPhone || contactPhone, // Ensure phone is always provided
          password: userPassword,
          role: 'service',
          hotelId,
          isActive: true,
          serviceProviderId: serviceProviderId // Set the pre-generated ID
        });
      } catch (error) {
        // Handle validation errors specifically
        if (error.name === 'ValidationError') {
          const errors = Object.values(error.errors).map(el => el.message);
          return next(new AppError(`User account creation failed: ${errors.join('. ')}`, 400));
        }
        // Handle duplicate key errors
        if (error.code === 11000) {
          const field = Object.keys(error.keyValue)[0];
          return next(new AppError(`User creation failed: ${field} already exists`, 400));
        }
        // Re-throw other errors to be handled by global error handler
        throw error;
      }

      // Send welcome email with credentials if requested
      if (sendEmail) {
        try {
          const isCustomCredentials = email && password && firstName && lastName;          const emailMessage = isCustomCredentials
            ? `
              Welcome ${user.firstName} ${user.lastName},

              You have been registered as a service provider for ${businessName}.

              Your login credentials are:
              Email: ${user.email}
              Password: ${userPassword}

              Please login to select your service categories and start offering services.

              Best regards,
              Hotel Service Platform Team
            `
            : `
              Welcome ${user.firstName} ${user.lastName},

              You have been registered as a service provider for ${businessName}.

              Your auto-generated login credentials are:
              Email: ${user.email}
              Password: ${userPassword}

              Please login to select your service categories and start offering services.
              Change your password as soon as possible.

              Best regards,
              Hotel Service Platform Team
            `;

          await sendEmail({
            email: contactEmail, // Send to contact email, not user email
            subject: 'Welcome to Hotel Service Platform - Your Service Provider Account',
            message: emailMessage
          });        } catch (err) {
          logger.error('Failed to send service provider welcome email', { error: err });
        }      }    }    // Create service provider with pre-generated ID (no category assignment)
    let serviceProvider;
    try {
      serviceProvider = await ServiceProvider.create({
        _id: serviceProviderId,
        userId: userId,
        hotelId,
        businessName,
        categories: [], // Start with no categories - provider will select them
        serviceTemplates: {}, // Empty templates - will be populated when categories are selected
        description: description || `${businessName} - Multi-service provider`,
        email: contactEmail || user.email,
        phone: contactPhone || user.phone,

        // Address - use structured address data
        address: address || {
          street: 'Not specified',
          city: 'Not specified',
          state: 'Not specified',
          country: 'Not specified',
          zipCode: '00000'
        },

        // Business License - use provided data or defaults
        businessLicense: businessLicense || {
          number: `TEMP-${Date.now()}`,
          issuedBy: 'Pending Documentation',
          issuedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        },

        // Tax ID - use provided or temporary
        taxId: taxId || `TEMP-TAX-${Date.now()}`,

        // Insurance - use provided data or defaults
        insurance: insurance || {
          provider: 'Pending Documentation',
          policyNumber: `TEMP-POL-${Date.now()}`,
          coverage: 50000,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },

        adminId: userId,

        // Capacity - use provided data or defaults
        capacity: capacity || {
          maxOrdersPerDay: 10
        },

        // Staff - use provided data or defaults
        staff: staff || {
          totalEmployees: 1
        },

        // Status fields
        isVerified: req.body.isVerified || false,
        verificationStatus: req.body.isVerified ? 'approved' : 'pending',
        isActive: req.body.isActive !== false // Default to true unless explicitly set to false
      });
    } catch (error) {
      // If service provider creation fails, clean up the user we just created
      if (user && user._id) {
        try {
          await User.findByIdAndDelete(user._id);
        } catch (cleanupError) {
          logger.error('Failed to cleanup user after service provider creation failed:', cleanupError);
        }
      }

      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(el => el.message);
        return next(new AppError(`Service provider creation failed: ${errors.join('. ')}`, 400));
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return next(new AppError(`Service provider creation failed: ${field} already exists`, 400));
      }

      // Re-throw other errors to be handled by global error handler
      throw error;
    }    logger.info(`New service provider created: ${businessName}`, {
      hotelId,
      serviceProviderId: serviceProvider._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        serviceProvider: serviceProvider,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        // Include credentials only if they were auto-generated
        ...((!email || !password) && {
          credentials: {
            email: user.email,
            password: userPassword
          }
        }),
        message: sendEmail
          ? 'Service provider created successfully. Login credentials sent via email.'
          : 'Service provider created successfully. Please provide login credentials manually.'
      }
    });} catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Handle specific MongoDB errors
    if (error.name === 'MongoServerError') {
      logger.error('MongoDB Server Error in service provider creation:', error);
      return next(new AppError(`Database operation failed: ${error.message}. Please try again.`, 500));
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      return next(new AppError(`Validation failed: ${errors.join('. ')}`, 400));
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new AppError(`Duplicate ${field}: ${error.keyValue[field]} already exists`, 400));
    }

    logger.error('Service provider creation error:', error);
    next(error);
  }
}));

/**
 * @route   PUT /api/hotel/service-providers/:id
 * @desc    Update service provider
 * @access  Private/HotelAdmin
 */
router.put('/service-providers/:id', restrictProviderToHotelAdmin, catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;

  // Find service provider and make sure it belongs to this hotel
  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  });

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Update service provider details
  Object.keys(req.body).forEach(key => {
    serviceProvider[key] = req.body[key];
  });

  await serviceProvider.save();

  logger.info(`Service provider updated: ${serviceProvider.businessName}`, {
    hotelId,
    serviceProviderId: serviceProvider._id
  });

  res.status(200).json({
    status: 'success',
    data: { serviceProvider }
  });
}));

/**
 * @route   PUT /api/hotel/service-providers/:id/verify
 * @desc    Verify a service provider
 * @access  Private/HotelAdmin
 */
router.put('/service-providers/:id/verify', restrictProviderToHotelAdmin, catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;
  const { status, verificationNotes } = req.body;

  // Find service provider and make sure it belongs to this hotel
  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  });

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Update verification status
  serviceProvider.isVerified = status === 'approved';
  serviceProvider.verificationStatus = status;
  serviceProvider.verificationNotes = verificationNotes;
  serviceProvider.verifiedAt = status === 'approved' ? Date.now() : undefined;
  serviceProvider.verifiedBy = status === 'approved' ? req.user.id : undefined;

  await serviceProvider.save();

  // If approved, notify the service provider
  if (status === 'approved') {
    try {
      const user = await User.findById(serviceProvider.userId);
      await sendEmail({
        email: user.email,
        subject: 'Your Service Provider Account Has Been Verified',
        message: `
          Dear ${user.firstName} ${user.lastName},

          We are pleased to inform you that your service provider account for ${serviceProvider.businessName} has been verified.

          You can now start adding services and receiving bookings through our platform.

          Best regards,
          Hotel Service Platform Team
        `
      });
    } catch (err) {
      logger.error('Failed to send service provider verification email', { error: err });
    }
  }

  logger.info(`Service provider ${status}: ${serviceProvider.businessName}`, {
    hotelId,
    serviceProviderId: serviceProvider._id,
    status
  });

  res.status(200).json({
    status: 'success',
    data: { serviceProvider }
  });
}));

/**
 * @route   PUT /api/hotel/service-providers/:id/markup
 * @desc    Set markup for a service provider
 * @access  Private/HotelAdmin
 */
router.put('/service-providers/:id/markup', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;
  const { percentage, notes } = req.body;

  // Validate markup percentage
  if (percentage < 0 || percentage > 100) {
    return next(new AppError('Markup percentage must be between 0 and 100', 400));
  }

  // Find service provider and make sure it belongs to this hotel
  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  });

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Update markup
  serviceProvider.markup = {
    percentage: percentage,
    setBy: req.user.id,
    setAt: new Date(),
    notes: notes || ''
  };

  await serviceProvider.save();

  logger.info(`Service provider markup updated: ${serviceProvider.businessName}`, {
    hotelId,
    serviceProviderId: serviceProvider._id,
    markupPercentage: percentage
  });

  res.status(200).json({
    status: 'success',
    data: {
      serviceProvider,
      markup: serviceProvider.markup
    }
  });
}));

/**
 * @route   DELETE /api/hotel/service-providers/:id
 * @desc    Deactivate a service provider (not delete)
 * @access  Private/HotelAdmin
 */
router.delete('/service-providers/:id', restrictProviderToHotelAdmin, catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;

  // Find service provider and make sure it belongs to this hotel
  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  });

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Soft delete - deactivate rather than remove
  serviceProvider.isActive = false;
  await serviceProvider.save();

  // Also deactivate all services from this provider
  await Service.updateMany(
    { serviceProviderId: providerId },
    { isActive: false }
  );

  logger.info(`Service provider deactivated: ${serviceProvider.businessName}`, {
    hotelId,
    serviceProviderId: serviceProvider._id
  });

  res.status(200).json({
    status: 'success',
    data: null
  });
}));

/**
 * @route   GET /api/hotel/users
 * @desc    Get all users/guests associated with this hotel
 * @access  Private/HotelAdmin
 */
router.get('/users', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  // Query filters
  const filter = {
    $or: [
      { role: 'guest', selectedHotelId: hotelId },
      { role: 'guest', 'bookingHistory.hotelId': hotelId }
    ]
  };

  if (req.query.status === 'active') {
    filter.isActive = true;
  } else if (req.query.status === 'inactive') {
    filter.isActive = false;
  }

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }

  // Get users with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: { users }
  });
}));

/**
 * @route   GET /api/hotel/users/:id
 * @desc    Get details for a specific user/guest
 * @access  Private/HotelAdmin
 */
router.get('/users/:id', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const userId = req.params.id;

  const user = await User.findById(userId)
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if this user has any association with this hotel
  const hasHotelAssociation =
    (user.selectedHotelId && user.selectedHotelId.toString() === hotelId.toString()) ||
    (user.bookingHistory && user.bookingHistory.some(b => b.hotelId.toString() === hotelId.toString()));

  if (!hasHotelAssociation) {
    return next(new AppError('User not associated with this hotel', 403));
  }

  // Get user's bookings for this hotel
  const bookings = await Booking.find({
    userId: userId,
    hotelId: hotelId
  })
    .populate('serviceId', 'name category')
    .populate('serviceProviderId', 'businessName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: {
      user,
      bookings
    }
  });
}));

/**
 * @route   GET /api/hotel/markup-settings
 * @desc    Get hotel markup settings
 * @access  Private/HotelAdmin
 */
router.get('/markup-settings', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  const hotel = await Hotel.findById(hotelId).select('markupSettings');

  if (!hotel.markupSettings) {
    hotel.markupSettings = {
      default: 15, // Default 15% markup
      categories: {}
    };
    await hotel.save();
  }

  res.status(200).json({
    status: 'success',
    data: { markupSettings: hotel.markupSettings }
  });
}));

/**
 * @route   PUT /api/hotel/markup-settings
 * @desc    Update hotel markup settings
 * @access  Private/HotelAdmin
 */
router.put('/markup-settings', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { defaultMarkup, categoryMarkups } = req.body;

  if (defaultMarkup < 0 || defaultMarkup > 100) {
    return next(new AppError('Default markup must be between 0 and 100 percent', 400));
  }

  // Validate category markups
  if (categoryMarkups) {
    for (const [category, markup] of Object.entries(categoryMarkups)) {
      if (markup < 0 || markup > 100) {
        return next(new AppError(`Markup for category ${category} must be between 0 and 100 percent`, 400));
      }
    }
  }

  const hotel = await Hotel.findById(hotelId);

  if (!hotel.markupSettings) {
    hotel.markupSettings = { default: 15, categories: {} };
  }

  // Update markup settings
  hotel.markupSettings.default = defaultMarkup || hotel.markupSettings.default;

  if (categoryMarkups) {
    hotel.markupSettings.categories = {
      ...hotel.markupSettings.categories,
      ...categoryMarkups
    };
  }

  await hotel.save();

  logger.info(`Hotel markup settings updated`, {
    hotelId,
    defaultMarkup: hotel.markupSettings.default,
    categoryMarkups: hotel.markupSettings.categories
  });

  res.status(200).json({
    status: 'success',
    data: { markupSettings: hotel.markupSettings }
  });
}));

/**
 * @route   GET /api/hotel/analytics/providers
 * @desc    Get analytics for service providers in the hotel
 * @access  Private/HotelAdmin
 */
router.get('/analytics/providers', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  // Time range filters
  const timeRange = req.query.timeRange || '30days'; // default to last 30 days

  let dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  const now = new Date();

  switch (timeRange) {
    case '7days':
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case '30days':
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      break;
    case '90days':
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 90)) };
      break;
    case '1year':
      dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      break;
    case 'all':
      // No additional date filter
      break;
    default:
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
  }

  // Provider performance analytics
  const providerPerformance = await Booking.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$serviceProviderId',
        totalBookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        providerEarnings: { $sum: '$providerAmount' },
        hotelCommission: { $sum: '$hotelCommission' },
        averageRating: { $avg: '$rating' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: '_id',
        foreignField: '_id',
        as: 'providerDetails'
      }
    },
    { $unwind: '$providerDetails' },
    {
      $project: {
        businessName: '$providerDetails.businessName',
        category: '$providerDetails.category',
        totalBookings: 1,
        revenue: 1,
        providerEarnings: 1,
        hotelCommission: 1,
        averageRating: 1
      }
    }
  ]);

  // Category performance
  const categoryPerformance = await Booking.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: 'services',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    { $unwind: '$serviceDetails' },
    {
      $group: {
        _id: '$serviceDetails.category',
        totalBookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        hotelCommission: { $sum: '$hotelCommission' },
        averageRating: { $avg: '$rating' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // Get provider growth over time
  const providerGrowth = await ServiceProvider.aggregate([
    { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      providerPerformance,      categoryPerformance,
      providerGrowth,
      timeRange
    }
  });
}));

/**
 * @route   GET /api/hotel/service-providers/:id/clients
 * @desc    Get all clients/customers for a specific service provider
 * @access  Private/HotelAdmin
 */
router.get('/service-providers/:id/clients', catchAsync(async (req, res) => {
  const { id: providerId } = req.params;
  const hotelId = req.user.hotelId;
  const { page = 1, limit = 20, status = 'all' } = req.query;

  // Verify service provider belongs to hotel
  const provider = await ServiceProvider.findOne({ _id: providerId, hotelId });
  if (!provider) {
    return res.status(404).json({
      status: 'fail',
      message: 'Service provider not found'
    });
  }

  const skip = (page - 1) * limit;

  // Build query for bookings
  const bookingQuery = { serviceProviderId: providerId };
  if (status && status !== 'all') {
    bookingQuery.status = status;
  }

  // Get unique clients who have used this service provider
  const clientBookings = await Booking.aggregate([
    { $match: bookingQuery },
    {
      $group: {
        _id: '$userId',
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        lastBooking: { $max: '$createdAt' },
        firstBooking: { $min: '$createdAt' },
        averageRating: { $avg: '$rating' },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        _id: 1,
        firstName: '$userInfo.firstName',
        lastName: '$userInfo.lastName',
        email: '$userInfo.email',
        phone: '$userInfo.phone',
        totalBookings: 1,
        totalSpent: 1,
        lastBooking: 1,
        firstBooking: 1,
        averageRating: 1,
        completedBookings: 1,
        cancelledBookings: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completedBookings', '$totalBookings'] },
            100
          ]
        }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) }
  ]);

  // Get total count
  const totalClients = await Booking.aggregate([
    { $match: bookingQuery },
    { $group: { _id: '$userId' } },
    { $count: 'total' }
  ]);

  const total = totalClients[0]?.total || 0;

  res.status(200).json({
    status: 'success',
    data: {
      provider: {
        _id: provider._id,
        businessName: provider.businessName,
        categories: provider.categories
      },
      clients: clientBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        hasNext: skip + clientBookings.length < total,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/service-providers
 * @desc    Get comprehensive service provider analytics for hotel admin
 * @access  Private/HotelAdmin
 */
router.get('/analytics/service-providers', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { timeRange = '30', category = 'all' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeRange));

  // Build provider filter
  const providerFilter = { hotelId, isActive: true };
  if (category && category !== 'all') {
    providerFilter.categories = category;
  }

  // Get provider performance metrics
  const providerPerformance = await ServiceProvider.aggregate([
    { $match: providerFilter },
    {
      $lookup: {
        from: 'bookings',
        let: { providerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$serviceProviderId', '$$providerId'] },
              createdAt: { $gte: startDate }
            }
          }
        ],
        as: 'bookings'
      }
    },
    {
      $addFields: {
        totalRevenue: { $sum: '$bookings.totalAmount' },
        totalBookings: { $size: '$bookings' },
        completedBookings: {
          $size: {
            $filter: {
              input: '$bookings',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        averageRating: { $avg: '$bookings.rating' },
        uniqueClients: {
          $size: {
            $setUnion: ['$bookings.userId', []]
          }
        }
      }
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $eq: ['$totalBookings', 0] },
            0,
            { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] }
          ]
        }
      }
    },
    {
      $project: {
        businessName: 1,
        categories: 1,
        totalRevenue: 1,
        totalBookings: 1,
        completedBookings: 1,
        completionRate: 1,
        averageRating: 1,
        uniqueClients: 1,
        'performance.averageRating': 1,
        isVerified: 1,
        createdAt: 1
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
  // Get category-wise performance
  const categoryPerformance = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'service'
      }
    },
    { $unwind: '$service' },
    {
      $group: {
        _id: '$service.category',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageRating: { $avg: '$rating' },
        uniqueProviders: { $addToSet: '$serviceProviderId' },
        uniqueClients: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        providerCount: { $size: '$uniqueProviders' },
        clientCount: { $size: '$uniqueClients' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Get growth trends
  const growthTrends = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        dailyBookings: { $sum: 1 },
        dailyRevenue: { $sum: '$totalAmount' },
        uniqueProviders: { $addToSet: '$serviceProviderId' }
      }
    },
    {
      $addFields: {
        activeProviders: { $size: '$uniqueProviders' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Get top performing providers
  const topProviders = providerPerformance.slice(0, 5);

  // Calculate summary statistics
  const summary = {
    totalProviders: providerPerformance.length,
    totalRevenue: providerPerformance.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalBookings: providerPerformance.reduce((sum, p) => sum + p.totalBookings, 0),
    averageCompletionRate: providerPerformance.length > 0
      ? providerPerformance.reduce((sum, p) => sum + p.completionRate, 0) / providerPerformance.length
      : 0,
    averageRating: providerPerformance.length > 0
      ? providerPerformance.reduce((sum, p) => sum + (p.averageRating || 0), 0) / providerPerformance.length
      : 0
  };

  res.status(200).json({
    status: 'success',
    data: {
      summary,
      providerPerformance,
      categoryPerformance,
      topProviders,
      growthTrends,
      timeRange: parseInt(timeRange)
    }
  });
}));

/**
 * @route   GET /api/hotel/category-providers
 * @desc    Get current category service provider assignments
 * @access  Private/HotelAdmin
 */
router.get('/category-providers', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  const hotel = await Hotel.findById(hotelId)
    .populate('categoryServiceProviders.laundry', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.transportation', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.tours', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.spa', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.dining', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.entertainment', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.shopping', 'businessName email contactPhone isActive isVerified')
    .populate('categoryServiceProviders.fitness', 'businessName email contactPhone isActive isVerified')
    .select('categoryServiceProviders');

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      categoryProviders: hotel.categoryServiceProviders
    }
  });
}));

/**
 * @route   PUT /api/hotel/category-providers/:category
 * @desc    Assign a service provider to a specific category
 * @access  Private/HotelAdmin
 */
router.put('/category-providers/:category', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { category } = req.params;
  const { serviceProviderId } = req.body;

  // Validate category
  const validCategories = ['laundry', 'transportation', 'tours', 'spa', 'dining', 'entertainment', 'shopping', 'fitness'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Validate service provider exists and belongs to this hotel
  if (serviceProviderId) {
    const serviceProvider = await ServiceProvider.findOne({
      _id: serviceProviderId,
      hotelId: hotelId,
      isActive: true,
      isVerified: true
    });

    if (!serviceProvider) {
      return next(new AppError('Service provider not found or not available', 404));
    }
  }

  // Update the hotel's category service provider assignment
  const updateField = `categoryServiceProviders.${category}`;
  const hotel = await Hotel.findByIdAndUpdate(
    hotelId,
    {
      [updateField]: serviceProviderId || null
    },
    {
      new: true,
      runValidators: true
    }
  ).populate(`categoryServiceProviders.${category}`, 'businessName email contactPhone isActive isVerified');

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  logger.info(`Category service provider assigned: ${category}`, {
    hotelId,
    category,
    serviceProviderId: serviceProviderId || 'unassigned'
  });

  res.status(200).json({
    status: 'success',
    data: {
      category,
      serviceProvider: hotel.categoryServiceProviders[category]
    }
  });
}));

/**
 * @route   GET /api/hotel/available-providers/:category
 * @desc    Get available service providers for a specific category
 * @access  Private/HotelAdmin
 */
router.get('/available-providers/:category', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { category } = req.params;

  // Validate category
  const validCategories = ['laundry', 'transportation', 'tours', 'spa', 'dining', 'entertainment', 'shopping', 'fitness'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Get all active and verified service providers for this hotel
  // who have services in the specified category
  const serviceProviders = await ServiceProvider.find({
    hotelId: hotelId,
    isActive: true,
    isVerified: true
  }).populate({
    path: 'services',
    match: { category: category, isActive: true },
    select: 'name category'
  });

  // Filter providers who have at least one service in this category
  const availableProviders = serviceProviders.filter(provider =>
    provider.services && provider.services.length > 0
  ).map(provider => ({
    _id: provider._id,
    businessName: provider.businessName,
    email: provider.email,
    contactPhone: provider.contactPhone,
    servicesCount: provider.services.length,
    services: provider.services.map(service => ({
      name: service.name,
      category: service.category
    }))
  }));
  res.status(200).json({
    status: 'success',
    data: {
      category,
      providers: availableProviders
    }
  });
}));

/**
 * @route   GET /api/hotel/bookings
 * @desc    Get all bookings for the hotel with filtering options
 * @access  Private/HotelAdmin
 */
router.get('/bookings', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { category, status, page = 1, limit = 50 } = req.query;

  // Build the query object
  const query = { hotelId };

  // Add category filter if provided
  if (category && category !== 'all') {
    // Need to populate service first to filter by category
    // We'll handle this in the aggregation pipeline
  }

  // Add status filter if provided
  if (status) {
    query.status = status;
  }

  try {
    let bookings;

    if (category && category !== 'all') {
      // Use aggregation when filtering by category
      bookings = await Booking.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
        {
          $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'service'
          }
        },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'guestId',
            foreignField: '_id',
            as: 'guestDetails'
          }
        },
        { $unwind: { path: '$guestDetails', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'serviceproviders',
            localField: 'service.providerId',
            foreignField: '_id',
            as: 'provider'
          }
        },
        { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            'service.category': category,
            ...(status && { status })
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
      ]);
    } else {
      // Use regular query when not filtering by category
      bookings = await Booking.find(query)
        .populate({
          path: 'serviceId',
          select: 'name category description pricing images',
          populate: {
            path: 'providerId',
            select: 'businessName contactInfo'
          }
        })
        .populate({
          path: 'guestId',
          select: 'firstName lastName email phone'
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      // Transform to match aggregation structure
      bookings = bookings.map(booking => ({
        ...booking.toObject(),
        service: booking.serviceId,
        guestDetails: booking.guestId,
        provider: booking.serviceId?.providerId
      }));
    }

    // Get total count for pagination
    const totalCount = await Booking.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching hotel bookings:', error);
    throw new AppError('Failed to fetch bookings', 500);
  }
}));

module.exports = router;
