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
const TransportationBooking = require('../models/TransportationBooking');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const qrUtils = require('../utils/qr');
const crypto = require('crypto');

const router = express.Router();

// Helper function to get or create hotel's internal service provider
async function getOrCreateHotelProvider(hotelId) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  // Check if hotel already has an internal service provider
  let hotelProvider = await ServiceProvider.findOne({
    hotelId: hotelId,
    businessName: `${hotel.name} - Internal Services`,
    categories: { $in: ['housekeeping', 'dining', 'entertainment'] }
  });

  if (!hotelProvider) {
    // Create internal service provider for the hotel
    hotelProvider = await ServiceProvider.create({
      businessName: `${hotel.name} - Internal Services`,
      description: 'Internal hotel services managed directly by the hotel staff',
      categories: ['housekeeping', 'dining', 'entertainment'],
      hotelId: hotelId,
      adminId: hotel.adminId,
      email: hotel.contactEmail || 'internal@hotel.com',
      phone: hotel.contactPhone || '+1234567890',
      address: {
        street: hotel.address?.street || 'Hotel Address',
        city: hotel.address?.city || 'City',
        state: hotel.address?.state || 'State',
        country: hotel.address?.country || 'Country',
        zipCode: hotel.address?.zipCode || '12345'
      },
      businessLicense: {
        number: hotel.businessLicense?.number || 'INTERNAL-001',
        issuedBy: 'Hotel Management',
        issuedDate: new Date('2024-01-01'),
        expiryDate: new Date('2030-12-31')
      },
      taxId: hotel.taxId || 'INTERNAL-TAX-001',
      insurance: {
        provider: 'Hotel Insurance',
        policyNumber: 'INTERNAL-INS-001',
        coverage: 100000,
        expiryDate: new Date('2030-12-31')
      },
      capacity: {
        maxOrdersPerDay: 100,
        maxOrdersPerHour: 10
      },
      staff: {
        totalEmployees: 5,
        managers: 1,
        operators: 4
      },
      isActive: true,
      isVerified: true,
      verificationStatus: 'approved'
    });

    logger.info(`Created internal service provider for hotel: ${hotel.name}`, {
      hotelId,
      providerId: hotelProvider._id
    });
  }

  return hotelProvider;
}

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('hotel'));
router.use(restrictToOwnHotel);

/**
 * @route   GET /api/hotel/profile
 * @desc    Get hotel profile (for hotel admin)
 * @access  Private/HotelAdmin
 */
router.get('/profile', protect, restrictTo('hotel'), catchAsync(async (req, res, next) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return next(new AppError('Hotel ID not found in user profile', 400));
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: hotel
    });
  } catch (error) {
    logger.error('Error fetching hotel profile:', error);
    return next(new AppError('Failed to fetch hotel profile', 500));
  }
}));

/**
 * @route   PUT /api/hotel/profile
 * @desc    Update hotel profile (for hotel admin)
 * @access  Private/HotelAdmin
 */
router.put('/profile', protect, restrictTo('hotel'), catchAsync(async (req, res, next) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return next(new AppError('Hotel ID not found in user profile', 400));
    }

    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: hotel
    });
  } catch (error) {
    logger.error('Error updating hotel profile:', error);
    return next(new AppError('Failed to update hotel profile', 500));
  }
}));

/**
 * @route   GET /api/hotel/qr/generate
 * @desc    Generate QR code for hotel guest registration
 * @access  Private/HotelAdmin
 */
router.get('/qr/generate', catchAsync(async (req, res, next) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return next(new AppError('Hotel ID not found in user profile', 400));
    }

    // Get hotel information
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }

    if (!hotel.isActive) {
      return next(new AppError('Cannot generate QR code for inactive hotel', 400));
    }

    // Prepare hotel data for QR generation
    const hotelData = {
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address ? `${hotel.address.street}, ${hotel.address.city}` : null
    };

    // Generate QR code with display size (300px)
    const qrResult = await qrUtils.generateQRCode(hotelData, { size: 300 });

    // Get QR metadata
    const metadata = qrUtils.getQRMetadata(hotelId);

    logger.info('QR code generated for hotel admin', {
      hotelId,
      hotelName: hotel.name,
      adminId: req.user._id
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...qrResult,
        metadata,
        hotelInfo: {
          id: hotel._id,
          name: hotel.name,
          address: hotel.address
        }
      }
    });

  } catch (error) {
    logger.error('Error generating QR code:', error);
    return next(new AppError('Failed to generate QR code', 500));
  }
}));

/**
 * @route   GET /api/hotel/qr/download
 * @desc    Download QR code as PNG file for printing
 * @access  Private/HotelAdmin
 */
router.get('/qr/download', catchAsync(async (req, res, next) => {
  try {
    const hotelId = req.user.hotelId;
    const { size = 600 } = req.query; // Default print size

    if (!hotelId) {
      return next(new AppError('Hotel ID not found in user profile', 400));
    }

    // Get hotel information
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }

    if (!hotel.isActive) {
      return next(new AppError('Cannot generate QR code for inactive hotel', 400));
    }

    // Prepare hotel data for QR generation
    const hotelData = {
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address ? `${hotel.address.street}, ${hotel.address.city}` : null
    };

    // Generate QR code buffer for download
    const qrBuffer = await qrUtils.generateQRCodeBuffer(hotelData, { size: parseInt(size) });

    // Set appropriate headers for download
    const filename = `${hotel.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', qrBuffer.length);

    logger.info('QR code downloaded by hotel admin', {
      hotelId,
      hotelName: hotel.name,
      adminId: req.user._id,
      size: parseInt(size)
    });

    res.send(qrBuffer);

  } catch (error) {
    logger.error('Error downloading QR code:', error);
    return next(new AppError('Failed to download QR code', 500));
  }
}));

/**
 * @route   POST /api/hotel/qr/regenerate
 * @desc    Regenerate QR code with new token (for security)
 * @access  Private/HotelAdmin
 */
router.post('/qr/regenerate', catchAsync(async (req, res, next) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return next(new AppError('Hotel ID not found in user profile', 400));
    }

    // Get hotel information
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }

    if (!hotel.isActive) {
      return next(new AppError('Cannot regenerate QR code for inactive hotel', 400));
    }

    // Prepare hotel data for QR generation
    const hotelData = {
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address ? `${hotel.address.street}, ${hotel.address.city}` : null
    };

    // Generate new QR code
    const qrResult = await qrUtils.generateQRCode(hotelData, { size: 300 });

    // Get QR metadata
    const metadata = qrUtils.getQRMetadata(hotelId);

    logger.logSecurity('QR_CODE_REGENERATED', req.user, req, {
      hotelId,
      hotelName: hotel.name,
      reason: 'Admin requested regeneration'
    });

    res.status(200).json({
      status: 'success',
      message: 'QR code regenerated successfully',
      data: {
        ...qrResult,
        metadata,
        hotelInfo: {
          id: hotel._id,
          name: hotel.name,
          address: hotel.address
        }
      }
    });

  } catch (error) {
    logger.error('Error regenerating QR code:', error);
    return next(new AppError('Failed to regenerate QR code', 500));
  }
}));

/**
 * @route   GET /api/hotel/qr/info
 * @desc    Get QR code information and metadata
 * @access  Private/HotelAdmin
 */
router.get('/qr/info', catchAsync(async (req, res, next) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return next(new AppError('Hotel ID not found in user profile', 400));
    }

    // Get hotel information
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }

    // Get QR metadata
    const metadata = qrUtils.getQRMetadata(hotelId);

    res.status(200).json({
      status: 'success',
      data: {
        hotelInfo: {
          id: hotel._id,
          name: hotel.name,
          address: hotel.address,
          isActive: hotel.isActive
        },
        metadata,
        registrationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register`
      }
    });

  } catch (error) {
    logger.error('Error getting QR info:', error);
    return next(new AppError('Failed to get QR code information', 500));
  }
}));

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
    // Count both regular bookings and transportation bookings
    Promise.all([
      Booking.countDocuments({ hotelId }),
      TransportationBooking.countDocuments({ hotelId })
    ]).then(([regularCount, transportationCount]) => regularCount + transportationCount),
    // Fetch both regular bookings and transportation bookings, then merge them
    Promise.all([
      Booking.find({ hotelId })
        .sort({ createdAt: -1 })
        .populate('serviceProviderId', 'businessName categories')
        .populate('serviceId', 'name category')
        .populate('guestId', 'firstName lastName'),
      TransportationBooking.find({ hotelId })
        .sort({ createdAt: -1 })
        .populate('serviceProviderId', 'businessName categories')
        .populate('serviceId', 'name category')
        .populate('guestId', 'firstName lastName')
    ]).then(([regularBookings, transportationBookings]) => {
      // Add booking type identifier and merge the arrays
      const allBookings = [
        ...regularBookings.map(booking => ({ ...booking.toObject(), bookingType: 'regular' })),
        ...transportationBookings.map(booking => ({ ...booking.toObject(), bookingType: 'transportation' }))
      ];
      // Sort by creation date and limit to 10
      return allBookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    }),
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
  // Get monthly booking trends from both regular and transportation bookings
  const monthlyTrends = await Promise.all([
    Booking.aggregate([
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
      }
    ]),
    TransportationBooking.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$payment.totalAmount' }
        }
      }
    ])
  ]).then(([regularTrends, transportationTrends]) => {
    // Merge and combine trends by month/year
    const trendsMap = new Map();

    [...regularTrends, ...transportationTrends].forEach(trend => {
      const key = `${trend._id.year}-${trend._id.month}`;
      if (trendsMap.has(key)) {
        const existing = trendsMap.get(key);
        existing.count += trend.count;
        existing.revenue += trend.revenue;
      } else {
        trendsMap.set(key, trend);
      }
    });

    return Array.from(trendsMap.values()).sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });
  });
  // Get category performance from both regular and transportation bookings
  const categoryPerformance = await Promise.all([
    Booking.aggregate([
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
      }
    ]),
    TransportationBooking.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
      {
        $group: {
          _id: 'transportation', // Transportation bookings are always in the transportation category
          bookings: { $sum: 1 },
          revenue: { $sum: '$payment.totalAmount' }
        }
      }
    ])
  ]).then(([regularPerformance, transportationPerformance]) => {
    // Merge category performance data
    const performanceMap = new Map();

    [...regularPerformance, ...transportationPerformance].forEach(category => {
      if (performanceMap.has(category._id)) {
        const existing = performanceMap.get(category._id);
        existing.bookings += category.bookings;
        existing.revenue += category.revenue;
      } else {
        performanceMap.set(category._id, category);
      }
    });

    return Array.from(performanceMap.values()).sort((a, b) => b.revenue - a.revenue);
  });

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
  const hotelId = req.user.hotelId;

  // Helper function to ensure future dates
  const getFutureDate = (days = 366) => {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  };

  const {
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
    selectedCategories = [], // Array of service categories to activate
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
  }  // Validate provided dates if businessLicense or insurance are provided
  if (businessLicense && businessLicense.expiryDate) {
    const licenseExpiryDate = new Date(businessLicense.expiryDate);
    if (licenseExpiryDate <= new Date()) {
      return next(new AppError('Business license expiry date must be in the future', 400));
    }
  }

  if (insurance && insurance.expiryDate) {
    const insuranceExpiryDate = new Date(insurance.expiryDate);
    if (insuranceExpiryDate <= new Date()) {
      return next(new AppError('Insurance expiry date must be in the future', 400));
    }
  }

  // Create user and service provider without transaction for better compatibility
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
        }      }    }    // Create service provider with pre-generated ID and selected categories
    let serviceProvider;
    try {
      // Initialize service templates for selected categories
      const initialServiceTemplates = {};

      // Available categories with their default structure
      const availableCategories = [
        'laundry', 'transportation', 'tours', 'spa',
        'dining', 'entertainment', 'shopping', 'fitness', 'housekeeping'
      ];

      // Only include selected categories, validate they exist
      const validSelectedCategories = selectedCategories.filter(cat =>
        availableCategories.includes(cat)
      );

      // Initialize service templates for selected categories
      validSelectedCategories.forEach(category => {
        switch(category) {
          case 'laundry':
            initialServiceTemplates.laundry = {
              isActive: true,
              services: []
            };
            break;
          case 'transportation':
            initialServiceTemplates.transportation = {
              isActive: true,
              services: []
            };
            break;
          case 'tours':
            initialServiceTemplates.tours = {
              isActive: true,
              services: []
            };
            break;
          case 'spa':
            initialServiceTemplates.spa = {
              isActive: true,
              services: []
            };
            break;
          case 'dining':
            initialServiceTemplates.dining = {
              isActive: true,
              services: []
            };
            break;
          case 'entertainment':
            initialServiceTemplates.entertainment = {
              isActive: true,
              services: []
            };
            break;
          case 'shopping':
            initialServiceTemplates.shopping = {
              isActive: true,
              services: []
            };
            break;
          case 'fitness':
            initialServiceTemplates.fitness = {
              isActive: true,
              services: []
            };
            break;
          case 'housekeeping':
            initialServiceTemplates.housekeeping = {
              isActive: true,
              services: []
            };
            break;
        }
      });

      serviceProvider = await ServiceProvider.create({
        _id: serviceProviderId,
        userId: userId,
        hotelId,
        businessName,
        categories: validSelectedCategories, // Set selected categories
        serviceTemplates: initialServiceTemplates, // Initialize templates for selected categories
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
        },        // Business License - use provided data or defaults with validation
        businessLicense: businessLicense ? {
          ...businessLicense,
          // Ensure expiry date is in the future if provided
          expiryDate: businessLicense.expiryDate ?
            new Date(businessLicense.expiryDate) :
            getFutureDate(366)
        } : {
          number: `TEMP-${Date.now()}`,
          issuedBy: 'Pending Documentation',
          issuedDate: new Date(),
          expiryDate: getFutureDate(366) // 366 days from now to ensure future date
        },

        // Tax ID - use provided or temporary
        taxId: taxId || `TEMP-TAX-${Date.now()}`,

        // Insurance - use provided data or defaults with validation
        insurance: insurance ? {
          ...insurance,
          // Ensure expiry date is in the future if provided
          expiryDate: insurance.expiryDate ?
            new Date(insurance.expiryDate) :
            getFutureDate(366)
        } : {
          provider: 'Pending Documentation',
          policyNumber: `TEMP-POL-${Date.now()}`,
          coverage: 50000,
          expiryDate: getFutureDate(366) // 366 days from now to ensure future date
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
      }    });
  } catch (error) {
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
 * @route   PUT /api/hotel/service-providers/:id/categories
 * @desc    Update service categories for a service provider
 * @access  Private/HotelAdmin
 */
router.put('/service-providers/:id/categories', restrictProviderToHotelAdmin, catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;
  const { selectedCategories = [] } = req.body;

  // Available categories with their default structure
  const availableCategories = [
    'laundry', 'transportation', 'tours', 'spa',
    'dining', 'entertainment', 'shopping', 'fitness', 'housekeeping'
  ];

  // Validate selected categories
  const validSelectedCategories = selectedCategories.filter(cat =>
    availableCategories.includes(cat)
  );

  // Find service provider and make sure it belongs to this hotel
  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  });

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Initialize service templates for selected categories
  const updatedServiceTemplates = {};

  // Keep existing templates for categories that are still selected
  validSelectedCategories.forEach(category => {
    if (serviceProvider.serviceTemplates && serviceProvider.serviceTemplates[category]) {
      // Keep existing template but ensure it's active
      updatedServiceTemplates[category] = {
        ...serviceProvider.serviceTemplates[category],
        isActive: true
      };
    } else {
      // Create new template for newly selected category
      updatedServiceTemplates[category] = {
        isActive: true,
        services: []
      };
    }
  });

  // Deactivate templates for categories that are no longer selected
  if (serviceProvider.serviceTemplates) {
    Object.keys(serviceProvider.serviceTemplates).forEach(category => {
      if (!validSelectedCategories.includes(category)) {
        updatedServiceTemplates[category] = {
          ...serviceProvider.serviceTemplates[category],
          isActive: false
        };
      }
    });
  }

  // Update service provider
  serviceProvider.categories = validSelectedCategories;
  serviceProvider.serviceTemplates = updatedServiceTemplates;
  await serviceProvider.save();

  logger.info(`Service provider categories updated: ${serviceProvider.businessName}`, {
    hotelId,
    serviceProviderId: serviceProvider._id,
    selectedCategories: validSelectedCategories
  });

  res.status(200).json({
    status: 'success',
    data: {
      serviceProvider,
      selectedCategories: validSelectedCategories
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
 * @desc    Get ALL bookings (regular + transportation) for the hotel with filtering, search & pagination
 *          Mirrors dashboard recentBookings logic but returns full paginated list
 * @query   category (optional) - service category or 'transportation' or 'all'
 *          status (optional)   - generic status (pending|processing|confirmed|completed|cancelled)
 *          search (optional)   - guest name / email / booking id / service name
 *          page (default 1)
 *          limit (default 50)
 * @access  Private/HotelAdmin
 */
router.get('/bookings', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { category = 'all', status, search, page = 1, limit = 50 } = req.query;

  const numericPage = parseInt(page) || 1;
  const numericLimit = parseInt(limit) || 50;

  // Helper to normalize transportation booking statuses to generic ones used in UI
  const mapTransportationStatus = (bookingStatus) => {
    switch (bookingStatus) {
      case 'pending_quote':
      case 'quote_sent':
      case 'payment_pending':
        return 'pending';
      case 'quote_accepted':
      case 'payment_completed':
        return 'confirmed';
      case 'service_active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'cancelled':
      case 'quote_rejected':
      case 'quote_expired':
        return 'cancelled';
      default:
        return 'processing';
    }
  };

  try {
    // ---------- Regular Bookings ---------- //
    const regularQuery = { hotelId };
    if (status) regularQuery.status = status; // status already matches regular booking status values

    let regularBookings = [];

    // Fetch regular bookings only if category isn't strictly 'transportation'
    if (category !== 'transportation') {
      if (category && category !== 'all') {
        // Need service.category; use aggregation
        const matchStage = { hotelId: new mongoose.Types.ObjectId(hotelId) };
        if (status) matchStage.status = status;
        regularBookings = await Booking.aggregate([
          { $match: matchStage },
          { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
          { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
          {
            $match: {
              $or: [
                { 'service.category': category },
                { 'serviceType': category }
              ]
            }
          },
          { $lookup: { from: 'users', localField: 'guestId', foreignField: '_id', as: 'guestDetails' } },
          { $unwind: { path: '$guestDetails', preserveNullAndEmptyArrays: true } },
          { $lookup: { from: 'serviceproviders', localField: 'serviceProviderId', foreignField: '_id', as: 'serviceProvider' } },
          { $unwind: { path: '$serviceProvider', preserveNullAndEmptyArrays: true } },
          { $sort: { createdAt: -1 } }
        ]);
      } else {
        // Simpler populate path when no category filter
        const docs = await Booking.find(regularQuery)
          .populate({
            path: 'serviceId',
            select: 'name category description pricing images providerId',
            populate: { path: 'providerId', select: 'businessName contactInfo' }
          })
          .populate({ path: 'serviceProviderId', select: 'businessName contactInfo categories' })
          .populate({ path: 'guestId', select: 'firstName lastName email phone' })
          .sort({ createdAt: -1 });
        regularBookings = docs.map(b => ({
          ...b.toObject(),
            service: b.serviceId,
            guestDetails: b.guestId,
            serviceProvider: b.serviceProviderId || b.serviceId?.providerId,
            bookingType: 'regular'
        }));
      }
    }

    // ---------- Transportation Bookings ---------- //
    let transportationBookings = [];
    if (category === 'all' || category === 'transportation') {
      const transportMatch = { hotelId: new mongoose.Types.ObjectId(hotelId) };
      // Map generic status filter -> underlying bookingStatus possibilities
      if (status) {
        // We'll later map; for filtering keep broad to reduce data returned.
        // Simple approach: fetch all and filter after mapping.
      }
      transportationBookings = await TransportationBooking.find(transportMatch)
        .populate({ path: 'serviceId', select: 'name category description pricing images', populate: { path: 'providerId', select: 'businessName contactInfo' } })
        .populate({ path: 'serviceProviderId', select: 'businessName contactInfo categories' })
        .populate({ path: 'guestId', select: 'firstName lastName email phone' })
        .sort({ createdAt: -1 })
        .lean();

      transportationBookings = transportationBookings.map(t => ({
        ...t,
        service: t.serviceId,
        guestDetails: t.guestId || t.guestDetails,
        serviceProvider: t.serviceProviderId || t.serviceId?.providerId,
        bookingType: 'transportation',
        status: mapTransportationStatus(t.bookingStatus)
      }));
    }

    // Combine & initial filter
    let allBookings = [...regularBookings, ...transportationBookings];

    // Ensure uniform status for regular bookings (alias remains)
    allBookings = allBookings.map(b => ({
      ...b,
      status: b.status || b.bookingStatus || b.status || 'processing'
    }));

    // Search filtering (in-memory for now)
    if (search) {
      const term = search.toLowerCase();
      allBookings = allBookings.filter(b => {
        const guestName = `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.toLowerCase();
        const serviceName = (b.service?.name || '').toLowerCase();
        const providerName = (b.serviceProvider?.businessName || '').toLowerCase();
        const idStr = (b.bookingId || b.bookingReference || b._id?.toString() || '').toLowerCase();
        const email = (b.guestDetails?.email || '').toLowerCase();
        return [guestName, serviceName, providerName, idStr, email].some(v => v.includes(term));
      });
    }

    // After combining, apply status filter for transportation mapped statuses (if not already applied)
    if (status) {
      allBookings = allBookings.filter(b => b.status === status);
    }

    // Total count BEFORE pagination
    const totalCount = allBookings.length;

    // Pagination slice
    const start = (numericPage - 1) * numericLimit;
    const paginated = allBookings.slice(start, start + numericLimit);

    res.status(200).json({
      status: 'success',
      data: {
        bookings: paginated,
        pagination: {
          page: numericPage,
          limit: numericLimit,
          total: totalCount,
          pages: Math.ceil(totalCount / numericLimit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching hotel bookings (merged):', error);
    throw new AppError('Failed to fetch bookings', 500);
  }
}));

/**
 * @route   GET /api/hotel/inside-services
 * @desc    Get hotel's inside services (services provided directly by the hotel)
 * @access  Private/HotelAdmin
 */
router.get('/inside-services', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  // Get or create hotel's internal service provider
  const hotelProvider = await getOrCreateHotelProvider(hotelId);

  // Get all services provided by the hotel's internal provider
  const hotelServices = await Service.find({
    hotelId: hotelId,
    providerId: hotelProvider._id
  }).populate('providerId', 'businessName');

  // Default inside service templates if none exist
  const defaultServiceTemplates = [
    {
      id: 'room-service',
      name: 'Room Service',
      description: 'In-room dining and service requests',
      category: 'dining',
      subcategory: 'in_room',
      serviceType: 'room_dining'
    },
    {
      id: 'hotel-restaurant',
      name: 'Hotel Restaurant',
      description: 'Main dining facilities and reservations',
      category: 'dining',
      subcategory: 'restaurant',
      serviceType: 'restaurant'
    },
    {
      id: 'housekeeping-requests',
      name: 'Housekeeping Services',
      description: 'Room cleaning and maintenance requests',
      category: 'housekeeping',
      subcategory: 'cleaning',
      serviceType: 'housekeeping'
    },
    {
      id: 'concierge-services',
      name: 'Concierge Services',
      description: 'Guest assistance and recommendations',
      category: 'assistance',
      subcategory: 'concierge',
      serviceType: 'assistance'
    }
  ];

  // If no services exist, return templates for creation
  if (hotelServices.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: defaultServiceTemplates.map(template => ({
        ...template,
        isActive: false,
        providerId: hotelProvider._id,
        providerName: hotelProvider.businessName
      }))
    });
  }

  res.status(200).json({
    status: 'success',
    data: hotelServices
  });
}));

/**
 * @route   POST /api/hotel/inside-services/:serviceId/activate
 * @desc    Activate an inside hotel service (create if doesn't exist)
 * @access  Private/HotelAdmin
 */
router.post('/inside-services/:serviceId/activate', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { serviceId } = req.params;

  // Get or create hotel's internal service provider
  const hotelProvider = await getOrCreateHotelProvider(hotelId);

  // Check if service already exists
  let service = await Service.findOne({
    hotelId: hotelId,
    providerId: hotelProvider._id,
    $or: [
      { _id: serviceId },
      { 'metadata.templateId': serviceId }
    ]
  });

  if (service) {
    // Activate existing service
    service.isActive = true;
    service.isApproved = true;
    service.moderationStatus = 'approved';
    await service.save();
  } else {
    // Create new service based on template
    const serviceTemplates = {
      'room-service': {
        name: 'Room Service',
        description: 'In-room dining and service requests',
        category: 'dining',
        subcategory: 'in_room',
        serviceType: 'room_dining'
      },
      'hotel-restaurant': {
        name: 'Hotel Restaurant',
        description: 'Main dining facilities and reservations',
        category: 'dining',
        subcategory: 'restaurant',
        serviceType: 'restaurant'
      },
      'housekeeping-requests': {
        name: 'Housekeeping Services',
        description: 'Room cleaning and maintenance requests',
        category: 'housekeeping',
        subcategory: 'cleaning',
        serviceType: 'housekeeping'
      },
      'concierge-services': {
        name: 'Concierge Services',
        description: 'Guest assistance and recommendations',
        category: 'assistance',
        subcategory: 'concierge',
        serviceType: 'assistance'
      }
    };

    const template = serviceTemplates[serviceId];
    if (!template) {
      throw new AppError('Invalid service template', 400);
    }

    service = await Service.create({
      ...template,
      providerId: hotelProvider._id,
      hotelId: hotelId,
      isActive: true,
      isApproved: true,
      moderationStatus: 'approved',
      pricing: {
        basePrice: 0,
        pricingType: 'variable',
        currency: 'EGP'
      },
      availability: {
        isAvailable: true,
        schedule: {
          monday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] },
          tuesday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] },
          wednesday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] },
          thursday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] },
          friday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] },
          saturday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] },
          sunday: { isAvailable: true, timeSlots: [{ startTime: '00:00', endTime: '23:59', maxBookings: 100 }] }
        }
      },
      metadata: {
        templateId: serviceId,
        isHotelManaged: true
      }
    });

    logger.info(`Created and activated hotel service: ${service.name}`, {
      hotelId,
      serviceId: service._id,
      providerId: hotelProvider._id
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Service activated successfully',
    data: { service }
  });
}));

/**
 * @route   POST /api/hotel/inside-services/:serviceId/deactivate
 * @desc    Deactivate an inside hotel service
 * @access  Private/HotelAdmin
 */
router.post('/inside-services/:serviceId/deactivate', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { serviceId } = req.params;

  // Get hotel's internal service provider
  const hotelProvider = await getOrCreateHotelProvider(hotelId);

  // Find and deactivate the service
  const service = await Service.findOne({
    hotelId: hotelId,
    providerId: hotelProvider._id,
    $or: [
      { _id: serviceId },
      { 'metadata.templateId': serviceId }
    ]
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  service.isActive = false;
  await service.save();

  logger.info(`Deactivated hotel service: ${service.name}`, {
    hotelId,
    serviceId: service._id,
    providerId: hotelProvider._id
  });

  res.status(200).json({
    status: 'success',
    message: 'Service deactivated successfully',
    data: { service }
  });
}));

/**
 * @route   POST /api/hotel/inside-services
 * @desc    Create a new inside hotel service
 * @access  Private/HotelAdmin
 */
router.post('/inside-services', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { name, description, category, operatingHours, features } = req.body;

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  // Initialize insideServices if it doesn't exist
  if (!hotel.insideServices) {
    hotel.insideServices = [];
  }

  const newService = {
    id: `custom-${Date.now()}`,
    name,
    description,
    category,
    operatingHours,
    features,
    isActive: false,
    isCustom: true
  };

  hotel.insideServices.push(newService);
  await hotel.save();

  res.status(201).json({
    status: 'success',
    data: newService,
    message: 'Service created successfully'
  });
}));

/**
 * @route   GET /api/hotel/qr/generate
 * @desc    Generate QR code for hotel guest registration
 * @access  Private/HotelAdmin
 */
router.get('/qr/generate', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;

  // Get hotel information
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  try {
    // Generate QR code with hotel information
    const qrData = await qrUtils.generateQRCode({
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address
    });

    // Get QR metadata
    const metadata = qrUtils.getQRMetadata(hotelId);

    res.status(200).json({
      status: 'success',
      data: {
        ...qrData,
        hotelInfo: {
          name: hotel.name,
          address: hotel.address
        },
        metadata
      }
    });

  } catch (error) {
    logger.error('QR code generation failed:', error);
    return next(new AppError('Failed to generate QR code', 500));
  }
}));

/**
 * @route   POST /api/hotel/qr/regenerate
 * @desc    Regenerate QR code with new token for security
 * @access  Private/HotelAdmin
 */
router.post('/qr/regenerate', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;

  // Get hotel information
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  try {
    // Generate new QR code
    const qrData = await qrUtils.generateQRCode({
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address
    });

    // Log QR regeneration for security
    logger.logSecurity('QR_CODE_REGENERATED', req.user, req, {
      hotelId,
      hotelName: hotel.name
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...qrData,
        hotelInfo: {
          name: hotel.name,
          address: hotel.address
        },
        message: 'QR code regenerated successfully'
      }
    });

  } catch (error) {
    logger.error('QR code regeneration failed:', error);
    return next(new AppError('Failed to regenerate QR code', 500));
  }
}));

/**
 * @route   GET /api/hotel/qr/download
 * @desc    Download QR code as PNG file
 * @access  Private/HotelAdmin
 */
router.get('/qr/download', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { size } = req.query;

  // Get hotel information
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  try {
    // Generate QR code buffer for download
    const buffer = await qrUtils.generateQRCodeBuffer({
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address
    }, { size: parseInt(size) || 600 });

    // Set headers for file download
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${hotel.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);

  } catch (error) {
    logger.error('QR code download failed:', error);
    return next(new AppError('Failed to download QR code', 500));
  }
}));

/**
 * @route   GET /api/hotel/qr/info
 * @desc    Get QR code information and metadata
 * @access  Private/HotelAdmin
 */
router.get('/qr/info', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;

  // Get hotel information
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  try {
    // Get QR metadata
    const metadata = qrUtils.getQRMetadata(hotelId);

    res.status(200).json({
      status: 'success',
      data: {
        hotelInfo: {
          id: hotel._id,
          name: hotel.name,
          address: hotel.address
        },
        metadata
      }
    });

  } catch (error) {
    logger.error('QR info retrieval failed:', error);
    return next(new AppError('Failed to get QR information', 500));
  }
}));

module.exports = router;
