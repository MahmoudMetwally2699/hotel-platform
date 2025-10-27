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
const Feedback = require('../models/Feedback');
const LoyaltyMember = require('../models/LoyaltyMember');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const qrUtils = require('../utils/qr');
const crypto = require('crypto');
const { awardLoyaltyPoints, getOrCreateLoyaltyMember } = require('../utils/loyaltyIntegration');

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

  // Filter by provider type if specified
  if (req.query.providerType) {
    if (['internal', 'external'].includes(req.query.providerType)) {
      filter.providerType = req.query.providerType;
    }
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
    providerType = 'internal', // Provider type: 'internal' or 'external' (default: internal)
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
  }

  // Validate provider type
  if (providerType && !['internal', 'external'].includes(providerType)) {
    return next(new AppError('Provider type must be either "internal" or "external"', 400));
  }

  // Validate provided dates if businessLicense or insurance are provided
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

        // Provider Type Classification
        providerType: providerType || 'internal',

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

        // Markup - initialized based on provider type (pre-save middleware handles internal providers)
        markup: providerType === 'internal' ? {
          percentage: 0,
          setBy: req.user.id,
          setAt: new Date(),
          notes: 'Internal provider - No markup',
          reason: 'Internal provider - All revenue goes directly to hotel'
        } : {
          percentage: 0,
          setAt: new Date(),
          notes: 'Awaiting markup configuration',
          reason: 'External provider - Markup to be configured by hotel admin'
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
      serviceProviderId: serviceProvider._id,
      providerType: serviceProvider.providerType,
      markupPercentage: serviceProvider.markup?.percentage
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

  // Prevent markup changes for internal providers
  if (serviceProvider.providerType === 'internal') {
    logger.warn(`Attempted to set markup on internal provider: ${serviceProvider.businessName}`, {
      hotelId,
      serviceProviderId: serviceProvider._id,
      attemptedBy: req.user.id,
      attemptedMarkup: percentage
    });

    return next(new AppError('Cannot set markup for internal service providers. Internal providers always have 0% markup as all revenue goes directly to the hotel.', 400));
  }

  // Update markup for external providers
  serviceProvider.markup = {
    percentage: percentage,
    setBy: req.user.id,
    setAt: new Date(),
    notes: notes || '',
    reason: 'External provider markup configured by hotel admin'
  };

  await serviceProvider.save();

  logger.info(`Service provider markup updated: ${serviceProvider.businessName}`, {
    hotelId,
    serviceProviderId: serviceProvider._id,
    providerType: serviceProvider.providerType,
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

  // Update service provider using findOneAndUpdate to avoid validation on unchanged fields
  const updatedServiceProvider = await ServiceProvider.findOneAndUpdate(
    { _id: providerId, hotelId },
    {
      $set: {
        categories: validSelectedCategories,
        serviceTemplates: updatedServiceTemplates
      }
    },
    { new: true, runValidators: true }
  );

  logger.info(`Service provider categories updated: ${updatedServiceProvider.businessName}`, {
    hotelId,
    serviceProviderId: updatedServiceProvider._id,
    selectedCategories: validSelectedCategories
  });

  res.status(200).json({
    status: 'success',
    data: {
      serviceProvider: updatedServiceProvider,
      selectedCategories: validSelectedCategories
    }
  });
}));

/**
 * @route   POST /api/hotel/service-providers/:id/reset-password
 * @desc    Reset password for a service provider (Hotel Admin only)
 * @access  Private/HotelAdmin
 */
router.post('/service-providers/:id/reset-password', restrictProviderToHotelAdmin, catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const providerId = req.params.id;
  const { newPassword } = req.body;

  // Validate password input
  if (!newPassword || typeof newPassword !== 'string') {
    return next(new AppError('New password is required', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  // Find the service provider and ensure it belongs to this hotel
  const serviceProvider = await ServiceProvider.findOne({
    _id: providerId,
    hotelId
  });

  if (!serviceProvider) {
    return next(new AppError('No service provider found with that ID in your hotel', 404));
  }

  // Check if the service provider has a user account
  const userAccount = await User.findById(serviceProvider.adminId);
  if (!userAccount) {
    return next(new AppError('Service provider user account not found', 404));
  }

  if (!userAccount.isActive) {
    return next(new AppError('Service provider account is deactivated', 400));
  }

  // Update the user's password directly
  userAccount.password = newPassword;
  userAccount.passwordResetToken = undefined;
  userAccount.passwordResetExpires = undefined;
  await userAccount.save();

  // Get hotel information for logging
  const hotel = await Hotel.findById(hotelId);
  const hotelName = hotel ? hotel.name : 'Hotel';

  logger.logAuth('SERVICE_PROVIDER_PASSWORD_RESET_BY_ADMIN', userAccount, req, {
    hotelId,
    hotelName,
    serviceProviderId: serviceProvider._id,
    businessName: serviceProvider.businessName,
    adminId: req.user._id,
    resetMethod: 'manual_by_admin'
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. The service provider can now use the new password to log in.',
    data: {
      businessName: serviceProvider.businessName,
      email: userAccount.email
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
 * @route   GET /api/hotel/guests
 * @desc    Get all guests associated with this hotel (dedicated guest management endpoint)
 * @access  Private/HotelAdmin
 */
router.get('/guests', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;

  // Build query filter for guests
  const filter = {
    role: 'guest',
    $or: [
      { selectedHotelId: hotelId },
      { 'bookingHistory.hotelId': hotelId }
    ]
  };

  // Status filter
  if (req.query.status === 'ACTIVE') {
    filter.isActive = { $ne: false }; // true or undefined (default active)
  } else if (req.query.status === 'INACTIVE') {
    filter.isActive = false;
  }

  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$and = [
      filter.$or ? { $or: filter.$or } : {},
      {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { fullGuestName: searchRegex },
          { email: searchRegex }
        ]
      }
    ];
    delete filter.$or; // Remove the original $or to avoid conflicts
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [guests, total] = await Promise.all([
      User.find(filter)
        .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Add last booking date and loyalty tier for each guest
    const guestsWithBookings = await Promise.all(
      guests.map(async (guest) => {
        // Check both regular bookings and transportation bookings
        const [lastBooking, lastTransportationBooking, loyaltyMember] = await Promise.all([
          Booking.findOne({
            userId: guest._id,
            hotelId: hotelId
          })
            .sort({ createdAt: -1 })
            .select('createdAt')
            .lean(),

          TransportationBooking.findOne({
            userId: guest._id,
            hotelId: hotelId
          })
            .sort({ createdAt: -1 })
            .select('createdAt')
            .lean(),

          // Fetch loyalty member info
          LoyaltyMember.findOne({
            guest: guest._id,
            hotel: hotelId,
            isActive: true
          })
            .select('currentTier totalPoints availablePoints')
            .lean()
        ]);

        // Find the most recent booking from all types
        let lastBookingDate = null;

        if (lastBooking && lastTransportationBooking) {
          lastBookingDate = lastBooking.createdAt > lastTransportationBooking.createdAt
            ? lastBooking.createdAt
            : lastTransportationBooking.createdAt;
        } else if (lastBooking) {
          lastBookingDate = lastBooking.createdAt;
        } else if (lastTransportationBooking) {
          lastBookingDate = lastTransportationBooking.createdAt;
        }

        return {
          ...guest,
          lastBookingDate,
          loyaltyTier: loyaltyMember?.currentTier || null,
          loyaltyPoints: loyaltyMember?.totalPoints || 0,
          availableLoyaltyPoints: loyaltyMember?.availablePoints || 0
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: guests.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        guests: guestsWithBookings
      }
    });
  } catch (error) {
    logger.error('Error fetching guests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching guests'
    });
  }
}));

/**
 * @route   PATCH /api/hotel/guests/:guestId/status
 * @desc    Update guest active status (enable/disable login)
 * @access  Private/HotelAdmin
 */
router.patch('/guests/:guestId/status', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { guestId } = req.params;
  const { isActive } = req.body;

  // Validate input
  if (typeof isActive !== 'boolean') {
    return next(new AppError('isActive must be a boolean value', 400));
  }

  // Find the guest
  const guest = await User.findById(guestId);
  if (!guest) {
    return next(new AppError('Guest not found', 404));
  }

  if (guest.role !== 'guest') {
    return next(new AppError('User is not a guest', 400));
  }

  // Check if this guest has any association with this hotel
  const hasHotelAssociation = await Booking.findOne({
    userId: guestId,
    hotelId: hotelId
  });

  if (!hasHotelAssociation && guest.selectedHotelId?.toString() !== hotelId.toString()) {
    return next(new AppError('Guest not associated with this hotel', 403));
  }

  // Update guest status
  const updatedGuest = await User.findByIdAndUpdate(
    guestId,
    { isActive },
    { new: true, select: '-password -passwordChangedAt -passwordResetToken -passwordResetExpires' }
  );

  // Log the action
  logger.info(`Hotel admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} guest ${guest.email}`);

  res.status(200).json({
    status: 'success',
    message: `Guest has been ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      guest: updatedGuest
    }
  });
}));

/**
 * @route   PATCH /api/hotel/guests/:guestId
 * @desc    Update guest information (room number, check-in/out dates) and reactivate if needed
 * @access  Private/HotelAdmin
 */
router.patch('/guests/:guestId', catchAsync(async (req, res, next) => {
  const { guestId } = req.params;
  const { roomNumber, checkInDate, checkOutDate, isActive } = req.body;
  const hotelId = req.user.hotelId;

  // Find the guest
  const guest = await User.findById(guestId);

  if (!guest) {
    return next(new AppError('Guest not found', 404));
  }

  if (guest.role !== 'guest') {
    return next(new AppError('User is not a guest', 400));
  }

  // Check if this guest has any association with this hotel
  const hasHotelAssociation = await Booking.findOne({
    userId: guestId,
    hotelId: hotelId
  });

  if (!hasHotelAssociation && guest.selectedHotelId?.toString() !== hotelId.toString()) {
    return next(new AppError('Guest not associated with this hotel', 403));
  }

  // Validate dates if provided
  if (checkInDate && checkOutDate) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return next(new AppError('Check-out date must be after check-in date', 400));
    }
  }

  // Save previous stay to history if dates are being changed and guest had previous dates
  if ((checkInDate || checkOutDate) && guest.checkInDate && guest.checkOutDate) {
    const previousCheckIn = new Date(guest.checkInDate);
    const previousCheckOut = new Date(guest.checkOutDate);
    const diffTime = Math.abs(previousCheckOut - previousCheckIn);
    const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Add to stay history
    await User.findByIdAndUpdate(guestId, {
      $push: {
        stayHistory: {
          checkInDate: guest.checkInDate,
          checkOutDate: guest.checkOutDate,
          roomNumber: guest.roomNumber,
          numberOfNights: numberOfNights,
          createdAt: new Date()
        }
      }
    });

    logger.info(`Saved previous stay to history for guest ${guest.email}: ${numberOfNights} nights`);
  }

  // Build update object
  const updateData = {};
  if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
  if (checkInDate !== undefined) updateData.checkInDate = checkInDate;
  if (checkOutDate !== undefined) updateData.checkOutDate = checkOutDate;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update checkout time if checkout date is changed
  if (checkOutDate) {
    const checkoutDateTime = new Date(checkOutDate);
    checkoutDateTime.setHours(16, 0, 0, 0); // Set to 4:00 PM
    updateData.checkoutTime = checkoutDateTime;

    // Auto-reactivate account if extending checkout and account was deactivated due to checkout expiry
    if (guest.deactivationReason === 'checkout_expired' && !guest.isActive) {
      const now = new Date();
      if (checkoutDateTime > now) {
        updateData.isActive = true;
        updateData.deactivationReason = null;
        updateData.autoDeactivatedAt = null;
        logger.info(`Auto-reactivating guest ${guest.email} due to checkout extension`);
      }
    }
  }

  // Manual activation/deactivation
  if (isActive !== undefined) {
    if (isActive) {
      updateData.deactivationReason = null;
      updateData.autoDeactivatedAt = null;
    } else {
      // When deactivating, save current stay to history if dates exist
      if (guest.checkInDate && guest.checkOutDate) {
        const checkIn = new Date(guest.checkInDate);
        const checkOut = new Date(guest.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Save to stay history before deactivating
        await User.findByIdAndUpdate(guestId, {
          $push: {
            stayHistory: {
              checkInDate: guest.checkInDate,
              checkOutDate: guest.checkOutDate,
              roomNumber: guest.roomNumber,
              numberOfNights: numberOfNights,
              createdAt: new Date()
            }
          }
        });

        logger.info(`Saved stay to history for guest ${guest.email}: ${numberOfNights} nights`);

        // Clear current stay information
        updateData.checkInDate = null;
        updateData.checkOutDate = null;
        updateData.roomNumber = null;
        updateData.checkoutTime = null;
        updateData.hasActiveBooking = false; // Clear active booking flag
      }

      updateData.deactivationReason = 'admin_action';
      updateData.autoDeactivatedAt = new Date();
    }
  }

  // Update guest information
  const updatedGuest = await User.findByIdAndUpdate(
    guestId,
    updateData,
    { new: true, select: '-password -passwordChangedAt -passwordResetToken -passwordResetExpires' }
  );

  // Log the action
  let actionMessage = `Hotel admin ${req.user.email} updated guest ${guest.email} information`;
  let responseMessage = 'Guest information updated successfully';

  if (updateData.isActive === true && guest.deactivationReason === 'checkout_expired') {
    actionMessage += ' and reactivated account due to checkout extension';
    responseMessage = 'Guest information updated and account reactivated successfully';
  } else if (updateData.isActive === true && !guest.isActive) {
    actionMessage += ' and manually reactivated account';
    responseMessage = 'Guest account reactivated successfully';
  } else if (updateData.isActive === false) {
    actionMessage += ' and deactivated account';
    responseMessage = 'Guest account deactivated successfully';
  }

  logger.info(actionMessage, { updates: updateData });

  res.status(200).json({
    status: 'success',
    message: responseMessage,
    data: {
      guest: updatedGuest
    }
  });
}));

/**
 * @route   POST /api/hotel/guests/:guestId/loyalty/activate
 * @desc    Manually activate guest in loyalty program
 * @access  Private/HotelAdmin
 */
router.post('/guests/:guestId/loyalty/activate', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { guestId } = req.params;

  // Find the guest
  const guest = await User.findById(guestId);
  if (!guest) {
    return next(new AppError('Guest not found', 404));
  }

  if (guest.role !== 'guest') {
    return next(new AppError('User is not a guest', 400));
  }

  // Check if guest is associated with this hotel
  const hasHotelAssociation = await Booking.findOne({
    userId: guestId,
    hotelId: hotelId
  });

  if (!hasHotelAssociation && guest.selectedHotelId?.toString() !== hotelId.toString()) {
    return next(new AppError('Guest not associated with this hotel', 403));
  }

  // Check if loyalty program exists and is active
  const program = await LoyaltyProgram.findOne({
    hotel: hotelId,
    isActive: true
  });

  if (!program) {
    return next(new AppError('No active loyalty program found for this hotel', 404));
  }

  // Check if member already exists
  let member = await LoyaltyMember.findOne({
    guest: guestId,
    hotel: hotelId
  });

  if (member) {
    if (member.isActive) {
      return next(new AppError('Guest is already enrolled in the loyalty program', 400));
    }

    // Reactivate existing membership
    member.isActive = true;
    member.lastActivity = new Date();
    await member.save();

    logger.info(`Hotel admin ${req.user.email} reactivated loyalty membership for guest ${guest.email}`);

    return res.status(200).json({
      status: 'success',
      message: 'Guest loyalty membership reactivated successfully',
      data: {
        member: {
          currentTier: member.currentTier,
          totalPoints: member.totalPoints,
          availablePoints: member.availablePoints,
          isActive: member.isActive
        }
      }
    });
  }

  // Create new loyalty member
  member = new LoyaltyMember({
    guest: guestId,
    hotel: hotelId,
    currentTier: 'BRONZE',
    totalPoints: 0,
    availablePoints: 0,
    lifetimeSpending: 0,
    tierHistory: [{
      tier: 'BRONZE',
      date: new Date(),
      reason: 'Manual enrollment by hotel admin'
    }],
    isActive: true
  });

  // Calculate tier progress
  member.calculateTierProgress(program.tierConfiguration);
  await member.save();

  // Update program statistics
  program.statistics.totalMembers += 1;
  await program.save();

  // Send welcome email
  if (guest.email) {
    try {
      await sendEmail({
        to: guest.email,
        subject: 'Welcome to Our Loyalty Program!',
        template: 'loyaltyWelcome',
        context: {
          guestName: guest.name || guest.firstName || 'Guest',
          currentTier: 'BRONZE',
          benefits: program.tierConfiguration[0]?.benefits || []
        }
      });
    } catch (emailError) {
      logger.error('Error sending loyalty welcome email:', emailError);
    }
  }

  logger.info(`Hotel admin ${req.user.email} enrolled guest ${guest.email} in loyalty program`);

  res.status(201).json({
    status: 'success',
    message: 'Guest successfully enrolled in loyalty program',
    data: {
      member: {
        currentTier: member.currentTier,
        totalPoints: member.totalPoints,
        availablePoints: member.availablePoints,
        isActive: member.isActive,
        joinDate: member.joinDate
      }
    }
  });
}));

/**
 * @route   DELETE /api/hotel/guests/:guestId/loyalty/deactivate
 * @desc    Deactivate guest from loyalty program
 * @access  Private/HotelAdmin
 */
router.delete('/guests/:guestId/loyalty/deactivate', catchAsync(async (req, res, next) => {
  const hotelId = req.user.hotelId;
  const { guestId } = req.params;

  // Find the guest
  const guest = await User.findById(guestId);
  if (!guest) {
    return next(new AppError('Guest not found', 404));
  }

  if (guest.role !== 'guest') {
    return next(new AppError('User is not a guest', 400));
  }

  // Find loyalty member
  const member = await LoyaltyMember.findOne({
    guest: guestId,
    hotel: hotelId
  });

  if (!member) {
    return next(new AppError('Guest is not enrolled in the loyalty program', 404));
  }

  if (!member.isActive) {
    return next(new AppError('Guest loyalty membership is already inactive', 400));
  }

  // Deactivate membership
  member.isActive = false;
  member.lastActivity = new Date();
  await member.save();

  // Update program statistics
  const program = await LoyaltyProgram.findOne({ hotel: hotelId });
  if (program) {
    program.statistics.totalMembers = Math.max(0, program.statistics.totalMembers - 1);
    await program.save();
  }

  logger.info(`Hotel admin ${req.user.email} deactivated loyalty membership for guest ${guest.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Guest loyalty membership deactivated successfully',
    data: {
      member: {
        isActive: member.isActive
      }
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
 * @route   GET /api/hotel/analytics/revenue-by-provider-type
 * @desc    Get revenue analytics separated by provider type (internal vs external)
 * @access  Private/HotelAdmin
 */
router.get('/analytics/revenue-by-provider-type', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId) };

  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.createdAt.$lte = new Date(endDate);
    }
  }

  // Get revenue analytics separated by provider type
  const revenueByProviderType = await Booking.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: '$provider' },
    {
      $group: {
        _id: '$provider.providerType',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        providerEarnings: { $sum: '$pricing.providerAmount' },
        hotelCommission: { $sum: '$pricing.hotelMarkupAmount' },
        avgOrderValue: { $avg: '$pricing.totalAmount' },
        providers: { $addToSet: '$provider._id' }
      }
    },
    {
      $project: {
        providerType: '$_id',
        totalBookings: 1,
        totalRevenue: 1,
        providerEarnings: 1,
        hotelCommission: 1,
        avgOrderValue: 1,
        uniqueProvidersCount: { $size: '$providers' }
      }
    }
  ]);

  // Format results to ensure both internal and external are present
  const results = {
    internal: {
      providerType: 'internal',
      totalBookings: 0,
      totalRevenue: 0,
      providerEarnings: 0,
      hotelCommission: 0,
      avgOrderValue: 0,
      uniqueProvidersCount: 0
    },
    external: {
      providerType: 'external',
      totalBookings: 0,
      totalRevenue: 0,
      providerEarnings: 0,
      hotelCommission: 0,
      avgOrderValue: 0,
      uniqueProvidersCount: 0
    }
  };

  // Populate with actual data
  revenueByProviderType.forEach(item => {
    const type = item.providerType || 'internal'; // Default to internal if not specified
    if (results[type]) {
      results[type] = {
        providerType: type,
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
        providerEarnings: item.providerEarnings,
        hotelCommission: item.hotelCommission,
        avgOrderValue: item.avgOrderValue,
        uniqueProvidersCount: item.uniqueProvidersCount
      };
    }
  });

  // Calculate overall totals
  const totalRevenue = results.internal.totalRevenue + results.external.totalRevenue;
  const totalBookings = results.internal.totalBookings + results.external.totalBookings;
  const totalHotelCommission = results.internal.hotelCommission + results.external.hotelCommission;

  // Calculate percentages
  const internalPercentage = totalRevenue > 0 ? (results.internal.totalRevenue / totalRevenue) * 100 : 0;
  const externalPercentage = totalRevenue > 0 ? (results.external.totalRevenue / totalRevenue) * 100 : 0;

  logger.info('Revenue analytics by provider type retrieved', {
    hotelId,
    totalRevenue,
    totalBookings,
    internalRevenue: results.internal.totalRevenue,
    externalRevenue: results.external.totalRevenue
  });

  res.status(200).json({
    status: 'success',
    data: {
      internal: results.internal,
      external: results.external,
      summary: {
        totalRevenue,
        totalBookings,
        totalHotelCommission,
        internalPercentage: Math.round(internalPercentage * 100) / 100,
        externalPercentage: Math.round(externalPercentage * 100) / 100
      },
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
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
          .populate({ path: 'guestId', select: 'firstName lastName email phone roomNumber' })
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
        .populate({ path: 'guestId', select: 'firstName lastName email phone roomNumber' })
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

    // Sort all bookings by createdAt descending (most recent first)
    allBookings.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });

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

    // Add loyalty tier information to paginated bookings
    const bookingsWithLoyalty = await Promise.all(
      paginated.map(async (booking) => {
        if (booking.guestDetails && booking.guestDetails._id) {
          const loyaltyMember = await LoyaltyMember.findOne({
            guest: booking.guestDetails._id,
            hotel: hotelId,
            isActive: true
          }).select('currentTier totalPoints availablePoints').lean();

          return {
            ...booking,
            guestDetails: {
              ...booking.guestDetails,
              loyaltyTier: loyaltyMember?.currentTier || null,
              loyaltyPoints: loyaltyMember?.totalPoints || 0,
              availableLoyaltyPoints: loyaltyMember?.availablePoints || 0
            }
          };
        }
        return booking;
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        bookings: bookingsWithLoyalty,
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
        currency: 'USD'
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

/**
 * @route   PUT /api/hotel/bookings/:id/payment-status
 * @desc    Update payment status for a booking (cash payments)
 * @access  Private/HotelAdmin
 */
router.put('/bookings/:id/payment-status', catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  const hotelId = req.user.hotelId;

  // Validate payment status
  if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
    return next(new AppError('Invalid payment status. Must be pending, paid, or failed.', 400));
  }

  // Find the booking and verify it belongs to this hotel
  const booking = await Booking.findOne({
    _id: id,
    hotelId: hotelId
  });

  if (!booking) {
    return next(new AppError('Booking not found or access denied', 404));
  }

  // Only allow updating cash payment status
  if (booking.payment.paymentMethod !== 'cash') {
    return next(new AppError('Payment status can only be updated for cash payments', 400));
  }

  // Update payment status
  booking.payment.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid') {
    booking.payment.paymentDate = new Date();
    booking.payment.status = 'completed';
    // Update overall booking status if payment is complete
    if (booking.status === 'pending_payment') {
      booking.status = 'confirmed';
    }
  } else if (paymentStatus === 'failed') {
    booking.payment.status = 'failed';
  }

  await booking.save();

  // Log the payment status update
  logger.info('Payment status updated by hotel admin', {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    paymentStatus,
    hotelId,
    adminId: req.user.id
  });

  // Send notification email to guest about payment status update
  try {
    const user = await User.findById(booking.guestId);
    if (user && user.email) {
      let emailSubject, emailMessage;

      if (paymentStatus === 'paid') {
        emailSubject = `Payment Confirmed - ${booking.bookingNumber}`;
        emailMessage = `
          Dear ${user.firstName},

          Your cash payment for booking ${booking.bookingNumber} has been confirmed by the hotel.

          Booking Details:
          - Booking Number: ${booking.bookingNumber}
          - Service: ${booking.serviceDetails.name}
          - Total Amount: $${booking.pricing.totalAmount} ${booking.pricing.currency}
          - Payment Date: ${new Date().toLocaleDateString()}

          Your service is now confirmed and ready to proceed.

          Thank you for your business!
          Hotel Service Platform
        `;
      } else if (paymentStatus === 'failed') {
        emailSubject = `Payment Issue - ${booking.bookingNumber}`;
        emailMessage = `
          Dear ${user.firstName},

          There was an issue with your cash payment for booking ${booking.bookingNumber}.

          Please contact the hotel reception to resolve this payment issue.

          Booking Number: ${booking.bookingNumber}
          Service: ${booking.serviceDetails.name}
          Total Amount: $${booking.pricing.totalAmount} ${booking.pricing.currency}

          Hotel Service Platform
        `;
      }

      if (emailSubject && emailMessage) {
        await sendEmail({
          email: user.email,
          subject: emailSubject,
          message: emailMessage
        });
      }
    }
  } catch (emailError) {
    logger.error('Failed to send payment status notification email', {
      error: emailError,
      bookingId: booking._id
    });
    // Don't fail the request if email fails
  }

  res.status(200).json({
    status: 'success',
    message: `Payment status updated to ${paymentStatus}`,
    data: {
      booking: {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        paymentStatus: booking.payment.paymentStatus,
        paymentMethod: booking.payment.paymentMethod,
        paymentDate: booking.payment.paymentDate,
        status: booking.status
      }
    }
  });
}));

/**
 * @desc    Update booking status
 * @route   PATCH /api/hotel/bookings/:id/status
 * @access  Private (Hotel Admin only)
 */
router.patch('/bookings/:id/status', protect, restrictTo('hotel'), restrictToOwnHotel, catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  const bookingId = req.params.id;

  // Validate status
  const validStatuses = [
    'pending', 'confirmed', 'assigned', 'in-progress',
    'pickup-scheduled', 'picked-up', 'in-service',
    'delivery-scheduled', 'completed', 'cancelled',
    'refunded', 'disputed'
  ];

  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  // Find the booking and verify it belongs to the hotel
  const booking = await Booking.findOne({
    _id: bookingId,
    hotelId: req.user.hotelId
  }).populate('serviceId', 'type');

  if (!booking) {
    return next(new AppError('Booking not found or access denied', 404));
  }

  // Store old status for logging
  const oldStatus = booking.status;

  // Update booking status using the model method
  await booking.updateStatus(status, req.user._id, notes);

  // Award loyalty points if booking is completed
  if (status === 'completed') {
    try {
      // Determine the service type for loyalty points calculation
      let serviceType = 'laundry'; // Default to laundry

      if (booking.serviceId) {
        if (typeof booking.serviceId === 'object' && booking.serviceId.type) {
          serviceType = booking.serviceId.type;
        } else if (typeof booking.serviceId === 'string') {
          // If not populated, we'll use laundry as default
          serviceType = 'laundry';
        }
      }

      // Get the final price - use totalAmount from pricing
      const finalPrice = booking.pricing?.totalAmount || 0;

      // Calculate number of nights if applicable
      let numberOfNights = 0;

      // First, try to get from booking schedule
      if (booking.schedule?.checkIn && booking.schedule?.checkOut) {
        const checkIn = new Date(booking.schedule.checkIn);
        const checkOut = new Date(booking.schedule.checkOut);
        const timeDiff = checkOut - checkIn;
        numberOfNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        numberOfNights = Math.max(0, numberOfNights);
      }
      // If not in booking, try to get from guest's user profile
      else {
        try {
          const User = require('../models/User');
          const guest = await User.findById(booking.guestId).select('checkInDate checkOutDate');

          if (guest && guest.checkInDate && guest.checkOutDate) {
            const checkIn = new Date(guest.checkInDate);
            const checkOut = new Date(guest.checkOutDate);
            const timeDiff = checkOut - checkIn;
            numberOfNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            numberOfNights = Math.max(0, numberOfNights);

            logger.info(`Using check-in/check-out from guest profile for nights calculation`, {
              guestId: booking.guestId,
              checkInDate: guest.checkInDate,
              checkOutDate: guest.checkOutDate,
              nights: numberOfNights
            });
          }
        } catch (userError) {
          logger.error(`Error fetching guest check-in/check-out dates:`, {
            error: userError.message,
            guestId: booking.guestId
          });
        }
      }

      const result = await awardLoyaltyPoints(
        booking._id,
        booking.guestId,
        booking.hotelId,
        finalPrice,
        serviceType,
        'regular',
        numberOfNights
      );

      if (result.success) {
        logger.info(`Loyalty points awarded for completed booking ${bookingId}`, {
          hotelId: req.user.hotelId,
          bookingId,
          pointsAwarded: result.pointsAwarded,
          pointsFromSpending: result.pointsFromSpending,
          pointsFromNights: result.pointsFromNights,
          numberOfNights,
          guestId: booking.guestId,
          finalPrice,
          serviceType
        });
      } else {
        logger.warn(`Loyalty points not awarded for booking ${bookingId}: ${result.message}`, {
          hotelId: req.user.hotelId,
          bookingId,
          finalPrice,
          serviceType
        });
      }
    } catch (loyaltyError) {
      // Log error but don't fail the booking status update
      logger.error(`Failed to award loyalty points for booking ${bookingId}:`, {
        error: loyaltyError.message,
        stack: loyaltyError.stack,
        hotelId: req.user.hotelId,
        bookingId
      });
    }
  }  logger.info(`Booking ${bookingId} status updated from ${oldStatus} to ${status}`, {
    hotelId: req.user.hotelId,
    userId: req.user._id,
    bookingId,
    oldStatus,
    newStatus: status,
    notes
  });

  res.status(200).json({
    status: 'success',
    message: `Booking status updated to ${status}`,
    data: {
      booking: {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        statusHistory: booking.statusHistory
      }
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/ratings/summary
 * @desc    Get rating summary metrics for hotel (average rating, total reviews, highest rated service)
 * @access  Private/HotelAdmin
 */
router.get('/analytics/ratings/summary', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate, serviceType } = req.query;

  // Build date filter
  const dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'active' };
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Add service type filter
  if (serviceType) {
    // Handle housekeeping subcategories
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      dateFilter.serviceType = 'housekeeping';
      dateFilter.housekeepingType = serviceType;
    } else {
      dateFilter.serviceType = serviceType;
    }
  }

  // Calculate current period metrics
  const currentPeriodStats = await Feedback.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  // Calculate previous period for trend comparison
  let previousPeriodStats = [];
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periodLength = end - start;
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start);

    const prevFilter = {
      hotelId: new mongoose.Types.ObjectId(hotelId),
      status: 'active',
      createdAt: { $gte: prevStart, $lt: prevEnd }
    };

    // Apply service type filter to previous period too
    if (serviceType) {
      if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
        prevFilter.serviceType = 'housekeeping';
        prevFilter.housekeepingType = serviceType;
      } else {
        prevFilter.serviceType = serviceType;
      }
    }

    previousPeriodStats = await Feedback.aggregate([
      {
        $match: prevFilter
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
  }

  // Calculate highest rated service
  const highestRatedService = await Feedback.aggregate([
    { $match: { ...dateFilter, serviceType: { $ne: null } } },
    {
      $group: {
        _id: {
          serviceType: '$serviceType',
          housekeepingType: '$housekeepingType'
        },
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    },
    { $sort: { avgRating: -1, totalReviews: -1 } },
    { $limit: 1 }
  ]);

  const current = currentPeriodStats[0] || { avgRating: 0, totalReviews: 0 };
  const previous = previousPeriodStats[0] || { avgRating: 0, totalReviews: 0 };

  // Calculate trends
  const ratingTrend = previous.avgRating > 0
    ? ((current.avgRating - previous.avgRating) / previous.avgRating) * 100
    : 0;
  const reviewsTrend = previous.totalReviews > 0
    ? ((current.totalReviews - previous.totalReviews) / previous.totalReviews) * 100
    : 0;

  // Format highest rated service name
  let highestRatedName = 'N/A';
  if (highestRatedService.length > 0) {
    const service = highestRatedService[0]._id;
    if (service.serviceType === 'housekeeping' && service.housekeepingType) {
      highestRatedName = `Housekeeping - ${service.housekeepingType.charAt(0).toUpperCase() + service.housekeepingType.slice(1)}`;
    } else {
      highestRatedName = service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1);
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      avgRating: Math.round(current.avgRating * 10) / 10,
      totalReviews: current.totalReviews,
      ratingTrend: Math.round(ratingTrend * 10) / 10,
      reviewsTrend: Math.round(reviewsTrend * 10) / 10,
      highestRatedService: {
        name: highestRatedName,
        rating: highestRatedService.length > 0 ? Math.round(highestRatedService[0].avgRating * 10) / 10 : 0,
        totalReviews: highestRatedService.length > 0 ? highestRatedService[0].totalReviews : 0
      }
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/ratings/breakdown
 * @desc    Get detailed ratings breakdown by service type with star distribution
 * @access  Private/HotelAdmin
 */
router.get('/analytics/ratings/breakdown', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate, serviceType } = req.query;

  // Build date filter
  const dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'active' };
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Add service type filter
  if (serviceType) {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      dateFilter.serviceType = 'housekeeping';
      dateFilter.housekeepingType = serviceType;
    } else {
      dateFilter.serviceType = serviceType;
    }
  }

  let breakdownData = [];

  // If a specific service is selected
  if (serviceType) {
    // Query for the specific service
    breakdownData = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$serviceType',
          totalRequests: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratings: { $push: '$rating' }
        }
      },
      {
        $project: {
          serviceType: '$_id',
          totalRequests: 1,
          avgRating: 1,
          star5: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 5] }
              }
            }
          },
          star4: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 4] }
              }
            }
          },
          star3: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 3] }
              }
            }
          },
          star1_2: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $lte: ['$$rating', 2] }
              }
            }
          }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    // If it's a housekeeping subcategory, also get the sub-breakdown
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      const housekeepingSubBreakdown = await Feedback.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$housekeepingType',
            totalRequests: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            ratings: { $push: '$rating' }
          }
        },
        {
          $project: {
            housekeepingType: '$_id',
            totalRequests: 1,
            avgRating: 1,
            star5: {
              $size: {
                $filter: {
                  input: '$ratings',
                  as: 'rating',
                  cond: { $eq: ['$$rating', 5] }
                }
              }
            },
            star4: {
              $size: {
                $filter: {
                  input: '$ratings',
                  as: 'rating',
                  cond: { $eq: ['$$rating', 4] }
                }
              }
            },
            star3: {
              $size: {
                $filter: {
                  input: '$ratings',
                  as: 'rating',
                  cond: { $eq: ['$$rating', 3] }
                }
              }
            },
            star1_2: {
              $size: {
                $filter: {
                  input: '$ratings',
                  as: 'rating',
                  cond: { $lte: ['$$rating', 2] }
                }
              }
            }
          }
        }
      ]);

      if (breakdownData.length > 0) {
        breakdownData[0].subCategories = housekeepingSubBreakdown;
      }
    }
  } else {
    // Get all services when no filter is applied
    // Get breakdown by service type (excluding housekeeping)
    const serviceTypeBreakdown = await Feedback.aggregate([
      { $match: { ...dateFilter, serviceType: { $ne: 'housekeeping' } } },
      {
        $group: {
          _id: '$serviceType',
          totalRequests: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratings: { $push: '$rating' }
        }
      },
      {
        $project: {
          serviceType: '$_id',
          totalRequests: 1,
          avgRating: 1,
          star5: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 5] }
              }
            }
          },
          star4: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 4] }
              }
            }
          },
          star3: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 3] }
              }
            }
          },
          star1_2: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $lte: ['$$rating', 2] }
              }
            }
          }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    // Get housekeeping breakdown with sub-categories
    const housekeepingBreakdown = await Feedback.aggregate([
      { $match: { ...dateFilter, serviceType: 'housekeeping' } },
      {
        $group: {
          _id: '$housekeepingType',
          totalRequests: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratings: { $push: '$rating' }
        }
      },
      {
        $project: {
          housekeepingType: '$_id',
          totalRequests: 1,
          avgRating: 1,
          star5: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 5] }
              }
            }
          },
          star4: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 4] }
              }
            }
          },
          star3: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 3] }
              }
            }
          },
          star1_2: {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $lte: ['$$rating', 2] }
              }
            }
          }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    // Calculate housekeeping overall stats
    const housekeepingOverall = {
      serviceType: 'housekeeping',
      totalRequests: housekeepingBreakdown.reduce((sum, item) => sum + item.totalRequests, 0),
      avgRating: housekeepingBreakdown.length > 0
        ? housekeepingBreakdown.reduce((sum, item) => sum + (item.avgRating * item.totalRequests), 0) /
          housekeepingBreakdown.reduce((sum, item) => sum + item.totalRequests, 0)
        : 0,
      star5: housekeepingBreakdown.reduce((sum, item) => sum + item.star5, 0),
      star4: housekeepingBreakdown.reduce((sum, item) => sum + item.star4, 0),
      star3: housekeepingBreakdown.reduce((sum, item) => sum + item.star3, 0),
      star1_2: housekeepingBreakdown.reduce((sum, item) => sum + item.star1_2, 0),
      subCategories: housekeepingBreakdown
    };

    breakdownData = [...serviceTypeBreakdown, housekeepingOverall];
  }

  res.status(200).json({
    status: 'success',
    data: {
      breakdown: breakdownData
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/ratings/by-type
 * @desc    Get ratings grouped by service type for chart visualization
 * @access  Private/HotelAdmin
 */
router.get('/analytics/ratings/by-type', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate, serviceType } = req.query;

  // Build date filter
  const dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'active' };
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Add service type filter
  if (serviceType) {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      dateFilter.serviceType = 'housekeeping';
      dateFilter.housekeepingType = serviceType;
    } else {
      dateFilter.serviceType = serviceType;
    }
  }

  let chartData = [];

  // If a specific service is selected, only query that service
  if (serviceType) {
    // Query for the specific service type
    const specificServiceData = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: serviceType === 'housekeeping'
            ? { $ifNull: ['$housekeepingType', 'housekeeping'] }
            : '$serviceType',
          avgRating: { $avg: '$rating' },
          requestCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          avgRating: { $round: ['$avgRating', 2] },
          requestCount: 1
        }
      }
    ]);

    chartData = specificServiceData;
  } else {
    // Get all service types when no filter is applied
    // Get service types (excluding housekeeping)
    const serviceTypes = await Feedback.aggregate([
      { $match: { ...dateFilter, serviceType: { $nin: ['housekeeping', null] } } },
      {
        $group: {
          _id: '$serviceType',
          avgRating: { $avg: '$rating' },
          requestCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          avgRating: { $round: ['$avgRating', 2] },
          requestCount: 1
        }
      }
    ]);

    // Get housekeeping sub-types
    const housekeepingTypes = await Feedback.aggregate([
      { $match: { ...dateFilter, serviceType: 'housekeeping' } },
      {
        $group: {
          _id: { $ifNull: ['$housekeepingType', 'housekeeping'] },
          avgRating: { $avg: '$rating' },
          requestCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          avgRating: { $round: ['$avgRating', 2] },
          requestCount: 1
        }
      }
    ]);

    chartData = [...serviceTypes, ...housekeepingTypes];
  }

  res.status(200).json({
    status: 'success',
    data: {
      chartData
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/ratings/trend
 * @desc    Get rating trends over time by service type
 * @access  Private/HotelAdmin
 */
router.get('/analytics/ratings/trend', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate, period = 'week', serviceType } = req.query;

  // Build date filter
  const dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'active' };

  // Default to last 4 weeks if no dates provided
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    start.setDate(start.getDate() - 28); // 4 weeks back
  }

  dateFilter.createdAt = { $gte: start, $lte: end };

  // Add service type filter
  if (serviceType) {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      dateFilter.serviceType = 'housekeeping';
      dateFilter.housekeepingType = serviceType;
    } else {
      dateFilter.serviceType = serviceType;
    }
  }

  // Determine grouping based on period
  let groupBy;
  if (period === 'week') {
    groupBy = {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' }
    };
  } else if (period === 'month') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' }
    };
  } else {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' }
    };
  }

  // Get trends based on service filter
  let serviceTrends = [];
  let housekeepingTrends = [];

  if (serviceType) {
    // If specific service type is selected, query only that service
    if (serviceType === 'housekeeping') {
      // Query all housekeeping sub-categories
      housekeepingTrends = await Feedback.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              ...groupBy,
              housekeepingType: '$housekeepingType'
            },
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    } else if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      // Query specific housekeeping sub-category
      housekeepingTrends = await Feedback.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              ...groupBy,
              housekeepingType: '$housekeepingType'
            },
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    } else {
      // Query other specific service type (laundry, transportation, etc.)
      serviceTrends = await Feedback.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              ...groupBy,
              serviceType: '$serviceType'
            },
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    }
  } else {
    // No filter - query all services
    serviceTrends = await Feedback.aggregate([
      { $match: { ...dateFilter, serviceType: { $nin: ['housekeeping', null] } } },
      {
        $group: {
          _id: {
            ...groupBy,
            serviceType: '$serviceType'
          },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    housekeepingTrends = await Feedback.aggregate([
      { $match: { ...dateFilter, serviceType: 'housekeeping' } },
      {
        $group: {
          _id: {
            ...groupBy,
            housekeepingType: '$housekeepingType'
          },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  // Format the data for frontend consumption
  const formatTrendData = (trends, typeField) => {
    const periodMap = new Map();

    trends.forEach(trend => {
      let periodLabel;
      if (period === 'week') {
        periodLabel = `Week ${trend._id.week}, ${trend._id.year}`;
      } else if (period === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodLabel = `${monthNames[trend._id.month - 1]} ${trend._id.year}`;
      } else {
        periodLabel = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`;
      }

      if (!periodMap.has(periodLabel)) {
        periodMap.set(periodLabel, {});
      }

      const typeName = trend._id[typeField];
      if (typeName) {
        periodMap.get(periodLabel)[typeName] = Math.round(trend.avgRating * 10) / 10;
      }
    });

    return Array.from(periodMap.entries()).map(([period, ratings]) => ({
      period,
      ...ratings
    }));
  };

  const serviceData = formatTrendData(serviceTrends, 'serviceType');
  const housekeepingData = formatTrendData(housekeepingTrends, 'housekeepingType');

  // Merge the data
  const mergedData = [...serviceData];
  housekeepingData.forEach(hkData => {
    const existingPeriod = mergedData.find(d => d.period === hkData.period);
    if (existingPeriod) {
      Object.assign(existingPeriod, hkData);
    } else {
      mergedData.push(hkData);
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      trendData: mergedData.sort((a, b) => a.period.localeCompare(b.period))
    }
  });
}));

// ==================== OPERATIONAL EFFICIENCY ANALYTICS ENDPOINTS ====================

/**
 * @route   GET /api/hotel/analytics/operational/summary
 * @desc    Get operational efficiency summary metrics
 * @access  Private (Hotel Admin)
 */
router.get('/analytics/operational/summary', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId || req.user._id;
  const { startDate, endDate, serviceType } = req.query;

  // Build date filter
  const dateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId) };

  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Add service type filter
  if (serviceType && serviceType !== 'all') {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      dateFilter.serviceType = 'housekeeping';
      dateFilter['serviceDetails.housekeepingType'] = serviceType;
    } else {
      dateFilter.serviceType = serviceType;
    }
  }

  // Query both Booking and TransportationBooking collections
  const [regularBookings, transportationBookings] = await Promise.all([
    Booking.find({
      ...dateFilter,
      status: { $in: ['completed', 'in-progress', 'confirmed', 'assigned'] }
    }).lean(),
    TransportationBooking.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      bookingStatus: { $in: ['completed', 'service_active', 'confirmed', 'payment_completed'] },
      ...(startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {})
    }).lean()
  ]);

  // Combine bookings
  const allBookings = [...regularBookings, ...transportationBookings];

  // Calculate metrics
  let totalResponseTime = 0;
  let responseCount = 0;
  let totalCompletionTime = 0;
  let completionCount = 0;
  let totalDelayed = 0;
  let slaCompliantCount = 0;
  let slaTotal = 0;

  allBookings.forEach(booking => {
    // Response time calculation
    if (booking.sla?.actualResponseTime != null) {
      totalResponseTime += booking.sla.actualResponseTime;
      responseCount++;
    }

    // Completion time calculation
    if (booking.sla?.actualCompletionTime != null) {
      totalCompletionTime += booking.sla.actualCompletionTime;
      completionCount++;

      // SLA compliance
      slaTotal++;
      if (booking.sla.isCompletionOnTime === true) {
        slaCompliantCount++;
      }
    }

    // Delayed requests
    if (booking.sla?.isCompletionOnTime === false) {
      totalDelayed++;
    }
  });

  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
  const avgCompletionTime = completionCount > 0 ? Math.round(totalCompletionTime / completionCount) : 0;
  const slaComplianceRate = slaTotal > 0 ? ((slaCompliantCount / slaTotal) * 100).toFixed(1) : 0;

  // Calculate trends (compare with previous period)
  const periodLength = startDate && endDate
    ? new Date(endDate).getTime() - new Date(startDate).getTime()
    : 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const previousDateFilter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (startDate && endDate) {
    const previousStart = new Date(new Date(startDate).getTime() - periodLength);
    const previousEnd = new Date(startDate);
    previousDateFilter.createdAt = {
      $gte: previousStart,
      $lte: previousEnd
    };
  }

  const [previousRegular, previousTransportation] = await Promise.all([
    Booking.find({
      ...previousDateFilter,
      status: { $in: ['completed', 'in-progress', 'confirmed', 'assigned'] }
    }).lean(),
    TransportationBooking.find({
      ...previousDateFilter,
      bookingStatus: { $in: ['completed', 'service_active', 'confirmed', 'payment_completed'] }
    }).lean()
  ]);

  const previousBookings = [...previousRegular, ...previousTransportation];

  // Calculate previous period metrics
  let prevResponseTime = 0;
  let prevResponseCount = 0;
  let prevCompletionTime = 0;
  let prevCompletionCount = 0;
  let prevSlaCompliant = 0;
  let prevSlaTotal = 0;

  previousBookings.forEach(booking => {
    if (booking.sla?.actualResponseTime != null) {
      prevResponseTime += booking.sla.actualResponseTime;
      prevResponseCount++;
    }
    if (booking.sla?.actualCompletionTime != null) {
      prevCompletionTime += booking.sla.actualCompletionTime;
      prevCompletionCount++;
      prevSlaTotal++;
      if (booking.sla.isCompletionOnTime === true) {
        prevSlaCompliant++;
      }
    }
  });

  const prevAvgResponse = prevResponseCount > 0 ? prevResponseTime / prevResponseCount : avgResponseTime;
  const prevAvgCompletion = prevCompletionCount > 0 ? prevCompletionTime / prevCompletionCount : avgCompletionTime;
  const prevSlaRate = prevSlaTotal > 0 ? (prevSlaCompliant / prevSlaTotal) * 100 : parseFloat(slaComplianceRate);

  // Calculate percentage changes
  const responseTrend = prevAvgResponse > 0
    ? (((prevAvgResponse - avgResponseTime) / prevAvgResponse) * 100).toFixed(1)
    : 0;
  const completionTrend = prevAvgCompletion > 0
    ? (((prevAvgCompletion - avgCompletionTime) / prevAvgCompletion) * 100).toFixed(1)
    : 0;
  const slaTrend = prevSlaRate > 0
    ? ((parseFloat(slaComplianceRate) - prevSlaRate) / prevSlaRate * 100).toFixed(1)
    : 0;

  res.status(200).json({
    status: 'success',
    data: {
      avgResponseTime,
      responseTrend: parseFloat(responseTrend),
      avgCompletionTime,
      completionTrend: parseFloat(completionTrend),
      slaComplianceRate: parseFloat(slaComplianceRate),
      slaTrend: parseFloat(slaTrend),
      delayedRequests: totalDelayed,
      totalRequests: allBookings.length
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/operational/completion-by-service
 * @desc    Get average completion time by service type
 * @access  Private (Hotel Admin)
 */
router.get('/analytics/operational/completion-by-service', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId || req.user._id;
  const { startDate, endDate, serviceType } = req.query;

  // Build match stage
  const matchStage = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    status: { $in: ['completed', 'in-progress', 'confirmed', 'assigned'] },
    'sla.actualCompletionTime': { $exists: true, $ne: null }
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (serviceType && serviceType !== 'all') {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      matchStage.serviceType = 'housekeeping';
      matchStage['serviceDetails.housekeepingType'] = serviceType;
    } else {
      matchStage.serviceType = serviceType;
    }
  }

  // Aggregate by service type
  const completionData = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$serviceType', 'housekeeping'] },
            then: { $ifNull: ['$serviceDetails.housekeepingType', 'housekeeping'] },
            else: '$serviceType'
          }
        },
        avgCompletionTime: { $avg: '$sla.actualCompletionTime' },
        minCompletionTime: { $min: '$sla.actualCompletionTime' },
        maxCompletionTime: { $max: '$sla.actualCompletionTime' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        serviceType: '$_id',
        avgCompletionTime: { $round: ['$avgCompletionTime', 0] },
        minCompletionTime: { $round: ['$minCompletionTime', 0] },
        maxCompletionTime: { $round: ['$maxCompletionTime', 0] },
        count: 1
      }
    },
    { $sort: { avgCompletionTime: -1 } }
  ]);

  // Also get transportation bookings
  const transportationMatch = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    bookingStatus: { $in: ['completed', 'service_active', 'confirmed', 'payment_completed'] },
    'sla.actualCompletionTime': { $exists: true, $ne: null }
  };

  if (startDate && endDate) {
    transportationMatch.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (!serviceType || serviceType === 'all' || serviceType === 'transportation') {
    const transportationData = await TransportationBooking.aggregate([
      { $match: transportationMatch },
      {
        $group: {
          _id: 'transportation',
          avgCompletionTime: { $avg: '$sla.actualCompletionTime' },
          minCompletionTime: { $min: '$sla.actualCompletionTime' },
          maxCompletionTime: { $max: '$sla.actualCompletionTime' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          serviceType: '$_id',
          avgCompletionTime: { $round: ['$avgCompletionTime', 0] },
          minCompletionTime: { $round: ['$minCompletionTime', 0] },
          maxCompletionTime: { $round: ['$maxCompletionTime', 0] },
          count: 1
        }
      }
    ]);

    completionData.push(...transportationData);
  }

  res.status(200).json({
    status: 'success',
    data: {
      completionByService: completionData
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/operational/sla-by-service
 * @desc    Get SLA performance by service type (on-time vs delayed)
 * @access  Private (Hotel Admin)
 */
router.get('/analytics/operational/sla-by-service', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId || req.user._id;
  const { startDate, endDate, serviceType } = req.query;

  const matchStage = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    status: 'completed',
    'sla.isCompletionOnTime': { $ne: null }
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (serviceType && serviceType !== 'all') {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      matchStage.serviceType = 'housekeeping';
      matchStage['serviceDetails.housekeepingType'] = serviceType;
    } else {
      matchStage.serviceType = serviceType;
    }
  }

  const slaData = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$serviceType', 'housekeeping'] },
            then: { $ifNull: ['$serviceDetails.housekeepingType', 'housekeeping'] },
            else: '$serviceType'
          }
        },
        totalBookings: { $sum: 1 },
        onTimeBookings: {
          $sum: {
            $cond: [{ $eq: ['$sla.isCompletionOnTime', true] }, 1, 0]
          }
        },
        delayedBookings: {
          $sum: {
            $cond: [{ $eq: ['$sla.isCompletionOnTime', false] }, 1, 0]
          }
        },
        avgDelay: {
          $avg: {
            $cond: [
              { $gt: ['$sla.completionDelay', 0] },
              '$sla.completionDelay',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        serviceType: '$_id',
        totalBookings: 1,
        onTimeBookings: 1,
        delayedBookings: 1,
        onTimePercentage: {
          $multiply: [
            { $divide: ['$onTimeBookings', '$totalBookings'] },
            100
          ]
        },
        avgDelay: { $round: ['$avgDelay', 0] }
      }
    },
    { $sort: { onTimePercentage: -1 } }
  ]);

  // Transportation bookings
  const transportationMatch = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    bookingStatus: 'completed',
    'sla.isCompletionOnTime': { $ne: null }
  };

  if (startDate && endDate) {
    transportationMatch.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (!serviceType || serviceType === 'all' || serviceType === 'transportation') {
    const transportationSLA = await TransportationBooking.aggregate([
      { $match: transportationMatch },
      {
        $group: {
          _id: 'transportation',
          totalBookings: { $sum: 1 },
          onTimeBookings: {
            $sum: {
              $cond: [{ $eq: ['$sla.isCompletionOnTime', true] }, 1, 0]
            }
          },
          delayedBookings: {
            $sum: {
              $cond: [{ $eq: ['$sla.isCompletionOnTime', false] }, 1, 0]
            }
          },
          avgDelay: {
            $avg: {
              $cond: [
                { $gt: ['$sla.completionDelay', 0] },
                '$sla.completionDelay',
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          serviceType: '$_id',
          totalBookings: 1,
          onTimeBookings: 1,
          delayedBookings: 1,
          onTimePercentage: {
            $multiply: [
              { $divide: ['$onTimeBookings', '$totalBookings'] },
              100
            ]
          },
          avgDelay: { $round: ['$avgDelay', 0] }
        }
      }
    ]);

    slaData.push(...transportationSLA);
  }

  res.status(200).json({
    status: 'success',
    data: {
      slaByService: slaData
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/operational/sla-distribution
 * @desc    Get overall SLA distribution (on-time, delayed, pending)
 * @access  Private (Hotel Admin)
 */
router.get('/analytics/operational/sla-distribution', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId || req.user._id;
  const { startDate, endDate, serviceType } = req.query;

  const matchStage = {
    hotelId: new mongoose.Types.ObjectId(hotelId)
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (serviceType && serviceType !== 'all') {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      matchStage.serviceType = 'housekeeping';
      matchStage['serviceDetails.housekeepingType'] = serviceType;
    } else {
      matchStage.serviceType = serviceType;
    }
  }

  const [regularBookings, transportationBookings] = await Promise.all([
    Booking.find(matchStage).lean(),
    TransportationBooking.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      ...(startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {})
    }).lean()
  ]);

  const allBookings = [...regularBookings, ...transportationBookings];

  let onTime = 0;
  let delayed = 0;
  let pending = 0;
  let atRisk = 0;

  allBookings.forEach(booking => {
    if (booking.sla?.slaStatus === 'met' || booking.sla?.isCompletionOnTime === true) {
      onTime++;
    } else if (booking.sla?.slaStatus === 'missed' || booking.sla?.isCompletionOnTime === false) {
      delayed++;
    } else if (booking.sla?.slaStatus === 'at-risk') {
      atRisk++;
    } else {
      pending++;
    }
  });

  const total = allBookings.length;

  res.status(200).json({
    status: 'success',
    data: {
      distribution: [
        {
          name: 'On Time',
          value: onTime,
          percentage: total > 0 ? ((onTime / total) * 100).toFixed(1) : 0
        },
        {
          name: 'Delayed',
          value: delayed,
          percentage: total > 0 ? ((delayed / total) * 100).toFixed(1) : 0
        },
        {
          name: 'At Risk',
          value: atRisk,
          percentage: total > 0 ? ((atRisk / total) * 100).toFixed(1) : 0
        },
        {
          name: 'Pending',
          value: pending,
          percentage: total > 0 ? ((pending / total) * 100).toFixed(1) : 0
        }
      ],
      total
    }
  });
}));

/**
 * @route   GET /api/hotel/analytics/operational/service-details
 * @desc    Get detailed timing analysis for all service requests
 * @access  Private (Hotel Admin)
 */
router.get('/analytics/operational/service-details', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId || req.user._id;
  const { startDate, endDate, serviceType } = req.query;

  const matchStage = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    status: { $in: ['completed', 'in-progress', 'confirmed', 'assigned'] }
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (serviceType && serviceType !== 'all') {
    if (['maintenance', 'cleaning', 'amenities'].includes(serviceType)) {
      matchStage.serviceType = 'housekeeping';
      matchStage['serviceDetails.housekeepingType'] = serviceType;
    } else {
      matchStage.serviceType = serviceType;
    }
  }

  const serviceDetails = await Booking.aggregate([
    { $match: matchStage },
    {
      $project: {
        serviceType: {
          $cond: {
            if: { $eq: ['$serviceType', 'housekeeping'] },
            then: { $ifNull: ['$serviceDetails.housekeepingType', 'housekeeping'] },
            else: '$serviceType'
          }
        },
        serviceName: '$serviceDetails.name',
        bookingNumber: 1,
        guestName: {
          $concat: ['$guestDetails.firstName', ' ', '$guestDetails.lastName']
        },
        status: 1,
        createdAt: 1,
        targetResponseTime: '$sla.targetResponseTime',
        actualResponseTime: '$sla.actualResponseTime',
        targetCompletionTime: '$sla.targetCompletionTime',
        actualCompletionTime: '$sla.actualCompletionTime',
        actualServiceTime: '$sla.actualServiceTime',
        isResponseOnTime: '$sla.isResponseOnTime',
        isCompletionOnTime: '$sla.isCompletionOnTime',
        responseDelay: '$sla.responseDelay',
        completionDelay: '$sla.completionDelay',
        slaStatus: '$sla.slaStatus'
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 100 } // Limit to most recent 100 for performance
  ]);

  // Get transportation bookings
  const transportationMatch = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    bookingStatus: { $in: ['completed', 'service_active', 'confirmed', 'payment_completed'] }
  };

  if (startDate && endDate) {
    transportationMatch.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (!serviceType || serviceType === 'all' || serviceType === 'transportation') {
    const transportationDetails = await TransportationBooking.aggregate([
      { $match: transportationMatch },
      {
        $project: {
          serviceType: { $literal: 'transportation' },
          serviceName: '$vehicleDetails.vehicleType',
          bookingNumber: '$bookingReference',
          guestName: {
            $concat: ['$guestDetails.firstName', ' ', '$guestDetails.lastName']
          },
          status: '$bookingStatus',
          createdAt: 1,
          targetResponseTime: '$sla.targetResponseTime',
          actualResponseTime: '$sla.actualResponseTime',
          targetCompletionTime: '$sla.targetCompletionTime',
          actualCompletionTime: '$sla.actualCompletionTime',
          actualServiceTime: '$sla.actualServiceTime',
          isResponseOnTime: '$sla.isResponseOnTime',
          isCompletionOnTime: '$sla.isCompletionOnTime',
          responseDelay: '$sla.responseDelay',
          completionDelay: '$sla.completionDelay',
          slaStatus: '$sla.slaStatus'
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 100 }
    ]);

    serviceDetails.push(...transportationDetails);
  }

  // Sort combined results by date
  serviceDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    status: 'success',
    data: {
      serviceDetails: serviceDetails.slice(0, 100) // Ensure max 100
    }
  });
}));

// ============================================================================
// REVENUE ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/hotel/analytics/revenue/summary
 * Get revenue summary with internal vs external breakdown
 */
router.get('/analytics/revenue/summary', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Aggregate regular bookings with provider type
  const regularBookings = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$provider.providerType',
        totalRevenue: { $sum: '$pricing.totalAmount' },
        basePrice: { $sum: '$pricing.providerEarnings' },
        markupAmount: { $sum: '$pricing.hotelEarnings' },
        bookingCount: { $sum: 1 }
      }
    }
  ]);

  // Aggregate transportation bookings with provider type
  const transportationBookings = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$provider.providerType',
        totalRevenue: { $sum: '$quote.finalPrice' },
        basePrice: { $sum: '$quote.basePrice' },
        markupAmount: { $sum: '$hotelMarkup.amount' },
        bookingCount: { $sum: 1 }
      }
    }
  ]);

  // Calculate totals
  let totalRevenue = 0;
  let internalRevenue = 0;
  let externalRevenue = 0;
  let externalCommission = 0;

  // Process regular bookings by provider type
  regularBookings.forEach(provider => {
    totalRevenue += provider.totalRevenue || 0;

    if (provider._id === 'internal') {
      internalRevenue += provider.totalRevenue || 0;
    } else if (provider._id === 'external') {
      externalRevenue += provider.basePrice || 0;
      externalCommission += provider.markupAmount || 0;
    }
  });

  // Process transportation by provider type
  transportationBookings.forEach(provider => {
    totalRevenue += provider.totalRevenue || 0;

    if (provider._id === 'internal') {
      internalRevenue += provider.totalRevenue || 0;
    } else if (provider._id === 'external') {
      externalRevenue += provider.basePrice || 0;
      externalCommission += provider.markupAmount || 0;
    }
  });

  // Calculate previous period for comparison
  const previousPeriodFilter = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end - start;

    previousPeriodFilter.createdAt = {
      $gte: new Date(start - duration),
      $lt: start
    };
  }

  // Get previous period totals
  let previousTotalRevenue = 0;
  if (Object.keys(previousPeriodFilter).length > 0) {
    const prevRegular = await Booking.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: 'completed',
          ...previousPeriodFilter
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    const prevTransport = await TransportationBooking.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          bookingStatus: 'completed',
          ...previousPeriodFilter
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quote.finalPrice' }
        }
      }
    ]);

    previousTotalRevenue = (prevRegular[0]?.total || 0) + (prevTransport[0]?.total || 0);
  }

  // Calculate trend
  const trend = previousTotalRevenue > 0
    ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
    : 0;

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue,
      internalRevenue,
      externalRevenue,
      externalCommission,
      trend: Math.round(trend * 10) / 10
    }
  });
}));

/**
 * GET /api/hotel/analytics/revenue/comparison
 * Get revenue comparison between internal and external services over time
 */
router.get('/analytics/revenue/comparison', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Aggregate by day with provider type
  const regularRevenue = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          providerType: '$provider.providerType'
        },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  const transportRevenue = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          providerType: '$provider.providerType'
        },
        revenue: { $sum: '$quote.finalPrice' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // Combine and format data
  const revenueByDate = {};

  regularRevenue.forEach(item => {
    const date = item._id.date;
    if (!revenueByDate[date]) {
      revenueByDate[date] = { date, internal: 0, external: 0 };
    }

    if (item._id.providerType === 'internal') {
      revenueByDate[date].internal += item.revenue;
    } else if (item._id.providerType === 'external') {
      revenueByDate[date].external += item.revenue;
    }
  });

  transportRevenue.forEach(item => {
    const date = item._id.date;
    if (!revenueByDate[date]) {
      revenueByDate[date] = { date, internal: 0, external: 0 };
    }

    if (item._id.providerType === 'internal') {
      revenueByDate[date].internal += item.revenue;
    } else if (item._id.providerType === 'external') {
      revenueByDate[date].external += item.revenue;
    }
  });

  const comparisonData = Object.values(revenueByDate).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  res.status(200).json({
    status: 'success',
    data: { comparisonData }
  });
}));

/**
 * GET /api/hotel/analytics/revenue/by-category
 * Get revenue distribution by service category
 */
router.get('/analytics/revenue/by-category', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Regular bookings by category
  const categoryRevenue = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$serviceType',
        totalRevenue: { $sum: '$pricing.totalAmount' },
        bookingCount: { $sum: 1 },
        avgRevenue: { $avg: '$pricing.totalAmount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Transportation revenue
  const transportationRevenue = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: 'transportation',
        totalRevenue: { $sum: '$quote.finalPrice' },
        bookingCount: { $sum: 1 },
        avgRevenue: { $avg: '$quote.finalPrice' }
      }
    }
  ]);

  const allCategories = [...categoryRevenue, ...transportationRevenue];

  // Calculate total for percentages
  const totalRevenue = allCategories.reduce((sum, cat) => sum + cat.totalRevenue, 0);

  const categoryData = allCategories.map(cat => ({
    category: cat._id,
    revenue: Math.round(cat.totalRevenue * 100) / 100,
    bookingCount: cat.bookingCount,
    avgRevenue: Math.round(cat.avgRevenue * 100) / 100,
    percentage: totalRevenue > 0 ? Math.round((cat.totalRevenue / totalRevenue) * 1000) / 10 : 0
  }));

  res.status(200).json({
    status: 'success',
    data: { categoryData }
  });
}));

/**
 * GET /api/hotel/analytics/revenue/internal-services
 * Get detailed revenue breakdown for internal (hotel-operated) services
 */
router.get('/analytics/revenue/internal-services', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Get internal services (provider type = internal)
  const internalRegularBookings = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'provider.providerType': 'internal'
      }
    },
    {
      $group: {
        _id: '$serviceType',
        totalRevenue: { $sum: '$pricing.totalAmount' },
        bookingCount: { $sum: 1 },
        avgRevenue: { $avg: '$pricing.totalAmount' },
        minRevenue: { $min: '$pricing.totalAmount' },
        maxRevenue: { $max: '$pricing.totalAmount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Get internal transportation bookings
  const internalTransportBookings = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'provider.providerType': 'internal'
      }
    },
    {
      $group: {
        _id: 'transportation',
        totalRevenue: { $sum: '$quote.finalPrice' },
        bookingCount: { $sum: 1 },
        avgRevenue: { $avg: '$quote.finalPrice' },
        minRevenue: { $min: '$quote.finalPrice' },
        maxRevenue: { $max: '$quote.finalPrice' }
      }
    }
  ]);

  const internalServices = [...internalRegularBookings, ...internalTransportBookings];

  const totalInternalRevenue = internalServices.reduce((sum, service) =>
    sum + service.totalRevenue, 0
  );

  const serviceData = internalServices.map(service => ({
    serviceType: service._id,
    totalRevenue: Math.round(service.totalRevenue * 100) / 100,
    bookingCount: service.bookingCount,
    avgRevenue: Math.round(service.avgRevenue * 100) / 100,
    minRevenue: Math.round(service.minRevenue * 100) / 100,
    maxRevenue: Math.round(service.maxRevenue * 100) / 100,
    percentage: totalInternalRevenue > 0
      ? Math.round((service.totalRevenue / totalInternalRevenue) * 1000) / 10
      : 0
  }));

  res.status(200).json({
    status: 'success',
    data: {
      totalInternalRevenue: Math.round(totalInternalRevenue * 100) / 100,
      services: serviceData
    }
  });
}));

/**
 * GET /api/hotel/analytics/revenue/external-providers
 * Get detailed analysis of external service providers and hotel profit margins
 */
router.get('/analytics/revenue/external-providers', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // External regular services (provider type = external)
  const externalServices = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'provider.providerType': 'external'
      }
    },
    {
      $group: {
        _id: {
          providerId: '$serviceProviderId',
          providerName: '$provider.businessName',
          serviceType: '$serviceType'
        },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        basePrice: { $sum: '$pricing.providerEarnings' },
        hotelCommission: { $sum: '$pricing.hotelEarnings' },
        bookingCount: { $sum: 1 },
        avgMarkup: { $avg: '$pricing.markup.percentage' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // External transportation services
  const transportationServices = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'provider.providerType': 'external'
      }
    },
    {
      $group: {
        _id: {
          providerId: '$serviceProviderId',
          providerName: '$provider.businessName',
          serviceType: 'transportation'
        },
        totalRevenue: { $sum: '$quote.finalPrice' },
        basePrice: { $sum: '$quote.basePrice' },
        hotelCommission: { $sum: '$hotelMarkup.amount' },
        bookingCount: { $sum: 1 },
        avgMarkup: { $avg: '$hotelMarkup.percentage' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  const allProviders = [...externalServices, ...transportationServices];

  const providerData = allProviders.map(provider => ({
    providerId: provider._id.providerId,
    providerName: provider._id.providerName || 'Unknown Provider',
    serviceType: provider._id.serviceType,
    totalRevenue: Math.round(provider.totalRevenue * 100) / 100,
    providerEarnings: Math.round(provider.basePrice * 100) / 100,
    hotelCommission: Math.round(provider.hotelCommission * 100) / 100,
    bookingCount: provider.bookingCount,
    avgMarkupPercentage: Math.round((provider.avgMarkup || 0) * 10) / 10,
    profitMargin: provider.totalRevenue > 0
      ? Math.round((provider.hotelCommission / provider.totalRevenue) * 1000) / 10
      : 0
  }));

  // Calculate totals
  const totals = {
    totalRevenue: providerData.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalProviderEarnings: providerData.reduce((sum, p) => sum + p.providerEarnings, 0),
    totalHotelCommission: providerData.reduce((sum, p) => sum + p.hotelCommission, 0),
    totalBookings: providerData.reduce((sum, p) => sum + p.bookingCount, 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      providers: providerData,
      totals: {
        totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
        totalProviderEarnings: Math.round(totals.totalProviderEarnings * 100) / 100,
        totalHotelCommission: Math.round(totals.totalHotelCommission * 100) / 100,
        totalBookings: totals.totalBookings,
        avgProfitMargin: totals.totalRevenue > 0
          ? Math.round((totals.totalHotelCommission / totals.totalRevenue) * 1000) / 10
          : 0
      }
    }
  });
}));

/**
 * GET /api/hotel/analytics/revenue/complete-summary
 * Get complete revenue summary with all services and comparative analysis
 */
router.get('/analytics/revenue/complete-summary', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Get all regular bookings with provider type
  const regularBookings = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          serviceType: '$serviceType',
          providerType: '$provider.providerType'
        },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        basePrice: { $sum: '$pricing.providerEarnings' },
        markupAmount: { $sum: '$pricing.hotelEarnings' },
        bookingCount: { $sum: 1 },
        avgRevenue: { $avg: '$pricing.totalAmount' },
        avgMarkup: { $avg: '$pricing.markup.percentage' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Get transportation bookings with provider type
  const transportationBookings = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $lookup: {
        from: 'serviceproviders',
        localField: 'serviceProviderId',
        foreignField: '_id',
        as: 'provider'
      }
    },
    { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          serviceType: 'transportation',
          providerType: '$provider.providerType'
        },
        totalRevenue: { $sum: '$quote.finalPrice' },
        basePrice: { $sum: '$quote.basePrice' },
        markupAmount: { $sum: '$hotelMarkup.amount' },
        bookingCount: { $sum: 1 },
        avgRevenue: { $avg: '$quote.finalPrice' },
        avgMarkup: { $avg: '$hotelMarkup.percentage' }
      }
    }
  ]);

  const allServices = [...regularBookings, ...transportationBookings];

  // Calculate grand totals
  const grandTotal = allServices.reduce((sum, service) => sum + service.totalRevenue, 0);
  const totalBasePrice = allServices.reduce((sum, service) => sum + (service.basePrice || 0), 0);
  const totalMarkup = allServices.reduce((sum, service) => sum + (service.markupAmount || 0), 0);

  const summaryData = allServices.map(service => {
    const providerType = service._id.providerType || 'unknown';
    const category = providerType === 'internal' ? 'Internal' : 'External';

    return {
      serviceType: service._id.serviceType,
      category: category,
      providerType: providerType,
      totalRevenue: Math.round(service.totalRevenue * 100) / 100,
      basePrice: Math.round((service.basePrice || service.totalRevenue) * 100) / 100,
      hotelProfit: Math.round((service.markupAmount || 0) * 100) / 100,
      bookingCount: service.bookingCount,
      avgRevenue: Math.round(service.avgRevenue * 100) / 100,
      avgMarkupPercentage: Math.round((service.avgMarkup || 0) * 10) / 10,
      revenueShare: grandTotal > 0
        ? Math.round((service.totalRevenue / grandTotal) * 1000) / 10
        : 0,
      profitMargin: service.totalRevenue > 0 && service.markupAmount
        ? Math.round((service.markupAmount / service.totalRevenue) * 1000) / 10
        : 0
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      services: summaryData,
      totals: {
        grandTotalRevenue: Math.round(grandTotal * 100) / 100,
        totalBasePrice: Math.round(totalBasePrice * 100) / 100,
        totalHotelProfit: Math.round(totalMarkup * 100) / 100,
        totalBookings: allServices.reduce((sum, s) => sum + s.bookingCount, 0),
        overallProfitMargin: grandTotal > 0
          ? Math.round((totalMarkup / grandTotal) * 1000) / 10
          : 0
      }
    }
  });
}));

// ============================================================================
// CUSTOMER SPENDING ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/hotel/analytics/spending/summary
 * Get customer spending summary with key metrics
 */
router.get('/analytics/spending/summary', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate, serviceType } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const serviceFilter = serviceType && serviceType !== 'all' ? { serviceType } : {};

  // Regular bookings analytics
  const regularStats = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter,
        ...serviceFilter
      }
    },
    {
      $group: {
        _id: null,
        totalSpending: { $sum: '$pricing.totalAmount' },
        totalBookings: { $sum: 1 },
        uniqueCustomers: { $addToSet: '$guestId' },
        avgSpending: { $avg: '$pricing.totalAmount' }
      }
    }
  ]);

  // Transportation bookings analytics
  const transportStats = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: null,
        totalSpending: { $sum: '$quote.finalPrice' },
        totalBookings: { $sum: 1 },
        uniqueCustomers: { $addToSet: '$guestId' }
      }
    }
  ]);

  // Most popular service
  const popularService = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$serviceType',
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const regular = regularStats[0] || { totalSpending: 0, totalBookings: 0, uniqueCustomers: [], avgSpending: 0 };
  const transport = transportStats[0] || { totalSpending: 0, totalBookings: 0, uniqueCustomers: [] };

  const totalSpending = regular.totalSpending + transport.totalSpending;
  const totalBookings = regular.totalBookings + transport.totalBookings;
  const uniqueCustomerIds = [...new Set([...regular.uniqueCustomers, ...transport.uniqueCustomers])];
  const avgCustomerSpending = uniqueCustomerIds.length > 0 ? totalSpending / uniqueCustomerIds.length : 0;

  res.status(200).json({
    status: 'success',
    data: {
      avgCustomerSpending: Math.round(avgCustomerSpending * 100) / 100,
      totalCustomers: uniqueCustomerIds.length,
      totalServiceRequests: totalBookings,
      mostPopularService: popularService[0]?._id || 'N/A',
      mostPopularServiceCount: popularService[0]?.count || 0,
      mostPopularServiceRevenue: popularService[0]?.revenue || 0
    }
  });
}));

/**
 * GET /api/hotel/analytics/spending/trend
 * Get spending trends over time with customer count
 */
router.get('/analytics/spending/trend', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate, period = 'week' } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Determine grouping format based on period
  let dateFormat, sortField;
  switch (period) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      sortField = '_id';
      break;
    case 'week':
      dateFormat = '%Y-W%V';
      sortField = '_id';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      sortField = '_id';
      break;
    case 'year':
      dateFormat = '%Y';
      sortField = '_id';
      break;
    default:
      dateFormat = '%Y-W%V';
      sortField = '_id';
  }

  // Regular bookings trend
  const regularTrend = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalSpending: { $sum: '$pricing.totalAmount' },
        avgSpending: { $avg: '$pricing.totalAmount' },
        customerCount: { $addToSet: '$guestId' },
        bookingCount: { $sum: 1 }
      }
    },
    { $sort: { [sortField]: 1 } }
  ]);

  // Transportation trend
  const transportTrend = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalSpending: { $sum: '$quote.finalPrice' },
        customerCount: { $addToSet: '$guestId' },
        bookingCount: { $sum: 1 }
      }
    }
  ]);

  // Combine trends
  const trendMap = {};
  regularTrend.forEach(item => {
    trendMap[item._id] = {
      period: item._id,
      totalSpending: item.totalSpending,
      avgSpending: item.avgSpending,
      customerCount: item.customerCount.length,
      bookingCount: item.bookingCount
    };
  });

  transportTrend.forEach(item => {
    if (trendMap[item._id]) {
      trendMap[item._id].totalSpending += item.totalSpending;
      trendMap[item._id].bookingCount += item.bookingCount;
      trendMap[item._id].customerCount += item.customerCount.length;
    } else {
      trendMap[item._id] = {
        period: item._id,
        totalSpending: item.totalSpending,
        avgSpending: 0,
        customerCount: item.customerCount.length,
        bookingCount: item.bookingCount
      };
    }
  });

  const trendData = Object.values(trendMap).map(item => ({
    ...item,
    totalSpending: Math.round(item.totalSpending * 100) / 100,
    avgSpending: Math.round((item.totalSpending / item.bookingCount) * 100) / 100
  }));

  res.status(200).json({
    status: 'success',
    data: {
      trendData,
      period
    }
  });
}));

/**
 * GET /api/hotel/analytics/spending/service-requests
 * Get service request volume by service type over time
 */
router.get('/analytics/spending/service-requests', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const serviceRequests = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          serviceType: '$serviceType'
        },
        requestCount: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    { $sort: { '_id.date': 1, '_id.serviceType': 1 } }
  ]);

  const transportRequests = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          serviceType: 'transportation'
        },
        requestCount: { $sum: 1 },
        revenue: { $sum: '$quote.finalPrice' }
      }
    }
  ]);

  const allRequests = [...serviceRequests, ...transportRequests];

  res.status(200).json({
    status: 'success',
    data: {
      requestData: allRequests
    }
  });
}));

/**
 * GET /api/hotel/analytics/spending/service-popularity
 * Get service popularity with revenue analysis
 */
router.get('/analytics/spending/service-popularity', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Regular services
  const regularServices = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$serviceType',
        totalRequests: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        avgSpending: { $avg: '$pricing.totalAmount' },
        uniqueCustomers: { $addToSet: '$guestId' }
      }
    },
    { $sort: { totalRequests: -1 } }
  ]);

  // Transportation
  const transportService = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: 'transportation',
        totalRequests: { $sum: 1 },
        totalRevenue: { $sum: '$quote.finalPrice' },
        avgSpending: { $avg: '$quote.finalPrice' },
        uniqueCustomers: { $addToSet: '$guestId' }
      }
    }
  ]);

  const allServices = [...regularServices, ...transportService];
  const totalRequests = allServices.reduce((sum, s) => sum + s.totalRequests, 0);

  const popularityData = allServices.map(service => ({
    serviceType: service._id,
    totalRequests: service.totalRequests,
    totalRevenue: Math.round(service.totalRevenue * 100) / 100,
    avgSpending: Math.round(service.avgSpending * 100) / 100,
    uniqueCustomers: service.uniqueCustomers.length,
    popularityPercentage: totalRequests > 0
      ? Math.round((service.totalRequests / totalRequests) * 1000) / 10
      : 0
  }));

  res.status(200).json({
    status: 'success',
    data: {
      services: popularityData,
      totalRequests
    }
  });
}));

/**
 * GET /api/hotel/analytics/spending/comprehensive
 * Get comprehensive service performance with growth trends
 */
router.get('/analytics/spending/comprehensive', catchAsync(async (req, res) => {
  const hotelId = req.user.hotelId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Calculate previous period for growth comparison
  let prevDateFilter = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end - start;

    prevDateFilter.createdAt = {
      $gte: new Date(start - duration),
      $lt: start
    };
  }

  // Current period data
  const currentRegular = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$serviceType',
        totalRequests: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        avgSpending: { $avg: '$pricing.totalAmount' },
        uniqueCustomers: { $addToSet: '$guestId' }
      }
    }
  ]);

  const currentTransport = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: 'transportation',
        totalRequests: { $sum: 1 },
        totalRevenue: { $sum: '$quote.finalPrice' },
        avgSpending: { $avg: '$quote.finalPrice' },
        uniqueCustomers: { $addToSet: '$guestId' }
      }
    }
  ]);

  // Previous period data for growth calculation
  const prevRegular = await Booking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: 'completed',
        ...prevDateFilter
      }
    },
    {
      $group: {
        _id: '$serviceType',
        totalRequests: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' }
      }
    }
  ]);

  const prevTransport = await TransportationBooking.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        bookingStatus: 'completed',
        ...prevDateFilter
      }
    },
    {
      $group: {
        _id: 'transportation',
        totalRequests: { $sum: 1 },
        totalRevenue: { $sum: '$quote.finalPrice' }
      }
    }
  ]);

  // Create previous period map
  const prevMap = {};
  [...prevRegular, ...prevTransport].forEach(service => {
    prevMap[service._id] = service;
  });

  // Combine current data with growth metrics
  const allServices = [...currentRegular, ...currentTransport];

  const comprehensiveData = allServices.map(service => {
    const prev = prevMap[service._id];
    const requestGrowth = prev
      ? ((service.totalRequests - prev.totalRequests) / prev.totalRequests) * 100
      : 0;
    const revenueGrowth = prev
      ? ((service.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100
      : 0;

    return {
      serviceType: service._id,
      totalRequests: service.totalRequests,
      totalRevenue: Math.round(service.totalRevenue * 100) / 100,
      avgSpending: Math.round(service.avgSpending * 100) / 100,
      uniqueCustomers: service.uniqueCustomers.length,
      requestGrowth: Math.round(requestGrowth * 10) / 10,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      repeatCustomerRate: service.uniqueCustomers.length > 0
        ? Math.round((service.totalRequests / service.uniqueCustomers.length) * 100) / 100
        : 0
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      services: comprehensiveData
    }
  });
}));

// Import and use feedback routes for hotel
const feedbackRoutes = require('./feedback');
router.use('/', feedbackRoutes);

module.exports = router;
