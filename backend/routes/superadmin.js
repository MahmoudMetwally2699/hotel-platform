/**
 * Super Admin Routes
 *
 * Routes accessible only by super admin users
 * Handles hotel management, hotel admin accounts, and cross-hotel analytics
 * No direct management of service providers or users (delegated to hotel admins)
 */

const express = require('express');
const { catchAsync, AppError } = require('../middleware/error');
const { protect, restrictTo } = require('../middleware/auth');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const SuperHotel = require('../models/SuperHotel');
const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const TransportationBooking = require('../models/TransportationBooking');
const HotelPayment = require('../models/HotelPayment');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');
const mongoose = require('mongoose');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('superadmin'));

/**
 * @route   GET /api/superadmin/dashboard
 * @desc    Get super admin dashboard data (enhanced with cross-hotel analytics)
 * @access  Private/SuperAdmin
 */
router.get('/dashboard', catchAsync(async (req, res) => {
  // Get platform statistics
  const [
    totalHotels,
    activeHotels,
    totalServices,
    activeServices,
    totalBookings,
    recentBookings,
    revenueStats,
    hotelAdminCount,
    serviceProviderCount,
    guestCount
  ] = await Promise.all([
    Hotel.countDocuments(),
    Hotel.countDocuments({ isActive: true, isPublished: true }),
    Service.countDocuments(),
    Service.countDocuments({ isActive: true, isApproved: true }),
    Booking.countDocuments(),
    Booking.find().sort({ createdAt: -1 }).limit(10)
      .populate('hotelId serviceId', 'name category')
      .select('-paymentDetails.cardDetails'),
    Booking.getRevenueStats(),
    User.countDocuments({ role: 'hotel', isActive: true }),
    User.countDocuments({ role: 'service', isActive: true }),
    User.countDocuments({ role: 'guest', isActive: true })
  ]);

  // Get monthly growth data
  const monthlyGrowth = await Hotel.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        hotelsAdded: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);

  // Get top performing hotels
  const topHotels = await Hotel.find({ isActive: true })
    .sort({ 'stats.totalRevenue': -1 })
    .limit(5)
    .select('name stats.totalRevenue stats.totalBookings stats.averageRating');

  // Get service category distribution across all hotels
  const serviceCategoryDistribution = await Service.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalBookings: { $sum: '$performance.totalBookings' },
        averageRating: { $avg: '$quality.averageRating' }
      }
    }
  ]);

  // Get geographical distribution of hotels
  const hotelGeographicDistribution = await Hotel.aggregate([
    {
      $group: {
        _id: '$address.country',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Platform health metrics
  const platformHealth = {
    userGrowthRate: ((guestCount / (await User.countDocuments({ role: 'guest' }))) * 100).toFixed(2),
    averageBookingsPerDay: (totalBookings / 30).toFixed(2), // Assuming last 30 days
    serviceUtilizationRate: ((activeServices / totalServices) * 100).toFixed(2)
  };

  res.status(200).json({
    status: 'success',
    data: {
      counts: {
        totalHotels,
        activeHotels,
        totalServices,
        activeServices,
        totalBookings,
        hotelAdminCount,
        serviceProviderCount,
        guestCount
      },
      recentBookings,
      revenueStats,
      monthlyGrowth,
      topHotels,
      serviceCategoryDistribution,
      hotelGeographicDistribution,
      platformHealth
    }
  });
}));

/**
 * @route   GET /api/superadmin/hotels
 * @desc    Get all hotels
 * @access  Private/SuperAdmin
 */
router.get('/hotels', catchAsync(async (req, res) => {
  const hotels = await Hotel.find()
    .populate('adminId', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: hotels.length,
    data: { hotels }
  });
}));

/**
 * @route   GET /api/superadmin/hotels/:id
 * @desc    Get hotel by ID
 * @access  Private/SuperAdmin
 */
router.get('/hotels/:id', catchAsync(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id)
    .populate('adminId', 'firstName lastName email phone')
    .populate({
      path: 'serviceProviders',
      select: 'businessName category isVerified isActive rating totalBookings'
    });

  if (!hotel) {
    return next(new AppError('No hotel found with that ID', 404));
  }

  // Get hotel performance metrics
  const bookingStats = await Booking.aggregate([
    { $match: { hotelId: new mongoose.Types.ObjectId(req.params.id) } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageBookingValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Get monthly booking trends for this hotel
  const monthlyBookings = await Booking.aggregate([
    { $match: { hotelId: new mongoose.Types.ObjectId(req.params.id) } },
    {
      $group: {
        _id: {
          year: { $year: '$bookingDate' },
          month: { $month: '$bookingDate' }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const metrics = bookingStats.length > 0 ? bookingStats[0] : {
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0
  };

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
      metrics,
      monthlyBookings
    }
  });
}));

/**
 * @route   POST /api/superadmin/hotels
 * @desc    Create new hotel with admin account
 * @access  Private/SuperAdmin
 */
router.post('/hotels', catchAsync(async (req, res, next) => {
  const { adminData, ...hotelData } = req.body;

  // Validate admin data if provided
  if (adminData) {
    if (!adminData.firstName || !adminData.lastName || !adminData.email || !adminData.password) {
      return next(new AppError('Hotel admin credentials are required', 400));
    }

    // Check if admin email already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      return next(new AppError('Admin email already exists', 400));
    }
  }  // Create hotel first without admin
  let hotel;
  try {
    hotel = await Hotel.create({
      name: hotelData.name,
      description: hotelData.description,
      email: hotelData.contactEmail,
      phone: hotelData.contactPhone,
      address: hotelData.address,
      category: hotelData.category || 'mid-range',
      starRating: hotelData.starRating || 3,
      totalRooms: hotelData.totalRooms || 50,
      totalFloors: hotelData.totalFloors || 5,
      taxId: hotelData.taxId || 'TEMP-' + Date.now(),
      businessLicense: hotelData.businessLicense || {
        number: 'TEMP-BL-' + Date.now(),
        issuedBy: 'System Generated',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      facilities: hotelData.facilities,
      images: hotelData.images || [],
      isActive: hotelData.isActive || true,
      isPublished: hotelData.isPublished || false,
      // Payment settings
      paymentSettings: {
        enableOnlinePayment: hotelData.paymentSettings?.enableOnlinePayment || false,
        currency: hotelData.paymentSettings?.currency || 'USD',
        acceptedMethods: hotelData.paymentSettings?.acceptedMethods || ['cash']
      },
      metadata: {
        createdBy: req.user._id,
        source: 'admin'
      }
    });
  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      return next(new AppError(errors.join('. '), 400));
    }
    // Re-throw other errors to be handled by global error handler
    throw error;
  }

  let hotelAdmin = null;
  // Create hotel admin after hotel is created
  if (adminData) {
    try {
      hotelAdmin = await User.create({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        phone: adminData.phone,
        password: adminData.password,
        role: 'hotel',
        hotelId: hotel._id, // Now we have the hotel ID
        isActive: true
      });
    } catch (error) {
      // If user creation fails, we should clean up the hotel we just created
      await Hotel.findByIdAndDelete(hotel._id);

      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(el => el.message);
        return next(new AppError(`Admin account creation failed: ${errors.join('. ')}`, 400));
      }
      // Re-throw other errors to be handled by global error handler
      throw error;
    }

    // Update hotel with admin ID
    hotel.adminId = hotelAdmin._id;
    await hotel.save();

    // Send welcome email to hotel admin
    try {
      await sendEmail({
        email: hotelAdmin.email,
        subject: 'Welcome to Hotel Service Platform - Your Admin Account',
        message: `
          Welcome ${hotelAdmin.firstName} ${hotelAdmin.lastName},

          You have been assigned as an administrator for ${hotel.name}.

          Your login credentials are:
          Email: ${hotelAdmin.email}
          Password: ${adminData.password}

          Please login and change your password as soon as possible.

          Best regards,
          Hotel Service Platform Team
        `
      });
    } catch (err) {
      logger.error('Failed to send hotel admin welcome email', { error: err });
    }
  }

  logger.info(`New hotel created: ${hotel.name}`, {
    hotelId: hotel._id,
    adminId: hotelAdmin?._id
  });

  res.status(201).json({
    status: 'success',
    data: {
      hotel,
      admin: hotelAdmin ? {
        id: hotelAdmin._id,
        name: `${hotelAdmin.firstName} ${hotelAdmin.lastName}`,
        email: hotelAdmin.email
      } : null
    }
  });
}));

/**
 * @route   POST /api/superadmin/hotels/:hotelId/assign-admin
 * @desc    Assign an admin to a hotel (create hotel admin account if needed)
 * @access  Private/SuperAdmin
 */
router.post('/hotels/:hotelId/assign-admin', catchAsync(async (req, res, next) => {
  const { hotelId } = req.params;
  const { adminId, email, firstName, lastName, phone } = req.body;

  // Check if hotel exists
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('No hotel found with that ID', 404));
  }

  let hotelAdmin;

  // If adminId is provided, assign existing admin
  if (adminId) {
    hotelAdmin = await User.findById(adminId);
    if (!hotelAdmin || hotelAdmin.role !== 'hotel') {
      return next(new AppError('Invalid hotel admin ID', 400));
    }
  } else {
    // Create new hotel admin user
    const password = crypto.randomBytes(10).toString('hex');

    hotelAdmin = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'hotel',
      hotelId: hotel._id,
      isActive: true
    });

    // Send welcome email with temporary password
    try {
      await sendEmail({
        email: hotelAdmin.email,
        subject: 'Welcome to Hotel Service Platform - Your Admin Account',
        message: `
          Welcome ${hotelAdmin.firstName} ${hotelAdmin.lastName},

          You have been assigned as an administrator for ${hotel.name}.

          Your temporary password is: ${password}

          Please login and change your password as soon as possible.

          Best regards,
          Hotel Service Platform Team
        `
      });
    } catch (err) {
      logger.error('Failed to send hotel admin welcome email', { error: err });
    }
  }

  // Update hotel with admin ID
  hotel.adminId = hotelAdmin._id;
  await hotel.save();

  logger.info(`Admin assigned to hotel: ${hotel.name}`, {
    hotelId: hotel._id,
    adminId: hotelAdmin._id
  });

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
      admin: {
        id: hotelAdmin._id,
        name: `${hotelAdmin.firstName} ${hotelAdmin.lastName}`,
        email: hotelAdmin.email
      }
    }
  });
}));

/**
 * @route   PUT /api/superadmin/hotels/:id
 * @desc    Update hotel
 * @access  Private/SuperAdmin
 */
router.put('/hotels/:id', catchAsync(async (req, res, next) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!hotel) {
    return next(new AppError('No hotel found with that ID', 404));
  }

  logger.info(`Hotel updated: ${hotel.name}`, { hotelId: hotel._id });

  res.status(200).json({
    status: 'success',
    data: { hotel }
  });
}));

/**
 * @route   DELETE /api/superadmin/hotels/:id
 * @desc    Delete hotel (deactivate)
 * @access  Private/SuperAdmin
 */
router.delete('/hotels/:id', catchAsync(async (req, res, next) => {
  // Soft delete by marking as inactive instead of removing from database
  const hotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    { isActive: false, isPublished: false },
    { new: true }
  );

  if (!hotel) {
    return next(new AppError('No hotel found with that ID', 404));
  }

  logger.info(`Hotel deactivated: ${hotel.name}`, { hotelId: hotel._id });

  res.status(200).json({
    status: 'success',
    data: null
  });
}));

/**
 * @route   GET /api/superadmin/hotel-admins
 * @desc    Get all hotel admin users
 * @access  Private/SuperAdmin
 */
router.get('/hotel-admins', catchAsync(async (req, res) => {
  const hotelAdmins = await User.find({ role: 'hotel' })
    .populate('hotelId', 'name')
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: hotelAdmins.length,
    data: { hotelAdmins }
  });
}));

/**
 * @route   GET /api/superadmin/analytics/platform
 * @desc    Get comprehensive platform analytics
 * @access  Private/SuperAdmin
 */
router.get('/analytics/platform', catchAsync(async (req, res) => {
  // Time range filters
  const timeRange = req.query.timeRange || '30days'; // default to last 30 days

  let dateFilter = {};
  const now = new Date();

  switch (timeRange) {
    case '7days':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
      break;
    case '30days':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
      break;
    case '90days':
      dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
      break;
    case '1year':
      dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
      break;
    case 'all':
      dateFilter = {}; // no filter
      break;
    default:
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
  }

  // Comprehensive analytics aggregation
  const [
    revenueSummary,
    bookingTrends,
    userGrowth,
    hotelPerformance,
    categoryPerformance
  ] = await Promise.all([
    // Revenue summary
    Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          platformFees: { $sum: '$platformFee' },
          hotelCommissions: { $sum: '$hotelCommission' },
          providerEarnings: { $sum: '$providerAmount' },
          averageBookingValue: { $avg: '$totalAmount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]),

    // Booking trends by day
    Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),

    // User growth
    User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            role: '$role',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Hotel performance comparison
    Hotel.aggregate([
      { $match: { ...dateFilter, isActive: true } },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'hotelId',
          as: 'bookings'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          totalBookings: { $size: '$bookings' },
          totalRevenue: { $sum: '$bookings.totalAmount' },
          averageBookingValue: { $avg: '$bookings.totalAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]),

    // Service category performance
    Booking.aggregate([
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
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { revenue: -1 } }
    ])
  ]);

  // Format response
  res.status(200).json({
    status: 'success',
    data: {
      revenueSummary: revenueSummary.length > 0 ? revenueSummary[0] : {
        totalRevenue: 0,
        platformFees: 0,
        hotelCommissions: 0,
        providerEarnings: 0,
        averageBookingValue: 0,
        transactionCount: 0
      },
      bookingTrends,
      userGrowth,
      hotelPerformance,
      categoryPerformance,
      timeRange
    }
  });
}));

// ===========================================
// SUPER HOTEL MANAGEMENT ROUTES
// ===========================================

/**
 * @route   GET /api/superadmin/superhotels
 * @desc    Get all super hotels
 * @access  Private/SuperAdmin
 */
router.get('/superhotels', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;

  // Build filter
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'contactPerson.name': { $regex: search, $options: 'i' } }
    ];
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  const [superHotels, total] = await Promise.all([
    SuperHotel.find(filter)
      .populate('assignedHotels', 'name address location isActive isPublished')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    SuperHotel.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      superHotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * @route   POST /api/superadmin/superhotels
 * @desc    Create a new super hotel
 * @access  Private/SuperAdmin
 */
router.post('/superhotels', catchAsync(async (req, res) => {
  const {
    name,
    description,
    email,
    password,
    assignedHotels,
    contactPerson,
    permissions
  } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Name, email, and password are required'
    });
  }

  // Check if email already exists
  const existingSuperHotel = await SuperHotel.findOne({ email });
  if (existingSuperHotel) {
    return res.status(400).json({
      status: 'error',
      message: 'A super hotel with this email already exists'
    });
  }

  // Validate assigned hotels exist
  if (assignedHotels && assignedHotels.length > 0) {
    const hotelCount = await Hotel.countDocuments({
      _id: { $in: assignedHotels },
      isActive: true
    });

    if (hotelCount !== assignedHotels.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more assigned hotels do not exist or are inactive'
      });
    }
  }

  // Create super hotel
  const superHotel = await SuperHotel.create({
    name,
    description,
    email,
    password,
    assignedHotels: assignedHotels || [],
    contactPerson,
    permissions,
    createdBy: req.user._id
  });

  // Populate for response
  await superHotel.populate('assignedHotels', 'name address location');
  await superHotel.populate('createdBy', 'firstName lastName email');

  logger.info('Super hotel created successfully', {
    superHotelId: superHotel._id,
    name: superHotel.name,
    createdBy: req.user.email
  });

  res.status(201).json({
    status: 'success',
    data: {
      superHotel
    }
  });
}));

/**
 * @route   GET /api/superadmin/superhotels/:id
 * @desc    Get super hotel by ID
 * @access  Private/SuperAdmin
 */
router.get('/superhotels/:id', catchAsync(async (req, res) => {
  const superHotel = await SuperHotel.findById(req.params.id)
    .populate('assignedHotels', 'name address location contactInfo isActive isPublished')
    .populate('createdBy', 'firstName lastName email');

  if (!superHotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Super hotel not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      superHotel
    }
  });
}));

/**
 * @route   PUT /api/superadmin/superhotels/:id
 * @desc    Update super hotel
 * @access  Private/SuperAdmin
 */
router.put('/superhotels/:id', catchAsync(async (req, res) => {
  const { name, description, contactPerson, permissions, isActive, assignedHotels } = req.body;

  // Validate assigned hotels if provided
  if (assignedHotels && assignedHotels.length > 0) {
    const hotelCount = await Hotel.countDocuments({
      _id: { $in: assignedHotels },
      isActive: true
    });

    if (hotelCount !== assignedHotels.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more assigned hotels do not exist or are inactive'
      });
    }
  }

  const superHotel = await SuperHotel.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      contactPerson,
      permissions,
      isActive,
      assignedHotels,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('assignedHotels', 'name address location')
   .populate('createdBy', 'firstName lastName email');

  if (!superHotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Super hotel not found'
    });
  }

  logger.info('Super hotel updated successfully', {
    superHotelId: superHotel._id,
    updatedBy: req.user.email
  });

  res.status(200).json({
    status: 'success',
    data: {
      superHotel
    }
  });
}));

/**
 * @route   DELETE /api/superadmin/superhotels/:id
 * @desc    Delete super hotel
 * @access  Private/SuperAdmin
 */
router.delete('/superhotels/:id', catchAsync(async (req, res) => {
  const superHotel = await SuperHotel.findByIdAndDelete(req.params.id);

  if (!superHotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Super hotel not found'
    });
  }

  logger.info('Super hotel deleted successfully', {
    superHotelId: req.params.id,
    deletedBy: req.user.email
  });

  res.status(204).json({
    status: 'success',
    data: null
  });
}));

/**
 * @route   PUT /api/superadmin/superhotels/:id/assign-hotels
 * @desc    Assign hotels to super hotel
 * @access  Private/SuperAdmin
 */
router.put('/superhotels/:id/assign-hotels', catchAsync(async (req, res) => {
  const { hotelIds } = req.body;

  if (!hotelIds || !Array.isArray(hotelIds)) {
    return res.status(400).json({
      status: 'error',
      message: 'Hotel IDs array is required'
    });
  }

  // Validate hotels exist
  const hotels = await Hotel.find({
    _id: { $in: hotelIds },
    isActive: true
  }).select('_id name');

  if (hotels.length !== hotelIds.length) {
    return res.status(400).json({
      status: 'error',
      message: 'One or more hotels do not exist or are inactive'
    });
  }

  const superHotel = await SuperHotel.findByIdAndUpdate(
    req.params.id,
    {
      assignedHotels: hotelIds,
      updatedAt: Date.now()
    },
    { new: true }
  ).populate('assignedHotels', 'name address location');

  if (!superHotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Super hotel not found'
    });
  }

  logger.info('Hotels assigned to super hotel', {
    superHotelId: superHotel._id,
    hotelCount: hotelIds.length,
    assignedBy: req.user.email
  });

  res.status(200).json({
    status: 'success',
    data: {
      superHotel
    }
  });
}));

/**
 * @route   PUT /api/superadmin/superhotels/:id/reset-password
 * @desc    Reset super hotel password
 * @access  Private/SuperAdmin
 */
router.put('/superhotels/:id/reset-password', catchAsync(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      status: 'error',
      message: 'New password must be at least 6 characters long'
    });
  }

  const superHotel = await SuperHotel.findById(req.params.id);

  if (!superHotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Super hotel not found'
    });
  }

  // Update password (will be hashed by pre-save middleware)
  superHotel.password = newPassword;
  superHotel.passwordChangedAt = Date.now();
  await superHotel.save();

  logger.info('Super hotel password reset', {
    superHotelId: superHotel._id,
    resetBy: req.user.email
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully'
  });
}));

/**
 * @route   GET /api/superadmin/superhotels/stats
 * @desc    Get super hotels statistics
 * @access  Private/SuperAdmin
 */
router.get('/superhotels/stats', catchAsync(async (req, res) => {
  const [
    totalSuperHotels,
    activeSuperHotels,
    totalAssignedHotels,
    recentSuperHotels
  ] = await Promise.all([
    SuperHotel.countDocuments(),
    SuperHotel.countDocuments({ isActive: true }),
    SuperHotel.aggregate([
      { $unwind: '$assignedHotels' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]),
    SuperHotel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedHotels', 'name')
      .select('name email assignedHotels createdAt isActive')
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalSuperHotels,
      activeSuperHotels,
      totalAssignedHotels: totalAssignedHotels[0]?.count || 0,
      recentSuperHotels
    }
  });
}));

/**
 * @route   GET /api/superadmin/payment-analytics
 * @desc    Get payment analytics for all hotels or specific hotel
 * @access  Private/SuperAdmin
 */
router.get('/payment-analytics', catchAsync(async (req, res) => {
  const { hotelId, startDate, endDate, timeRange = '30' } = req.query;

  // Calculate date range
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    const days = parseInt(timeRange);
    end = new Date();
    start = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  }

  const HotelPayment = require('../models/HotelPayment');

  // Get all hotels first to ensure we show all hotels even with zero payments
  const allHotelsFilter = hotelId && hotelId !== 'all'
    ? { _id: new mongoose.Types.ObjectId(hotelId) }
    : {};

  const allHotels = await Hotel.find(allHotelsFilter).select('_id name');

  let matchFilter = {
    createdAt: { $gte: start, $lte: end }
    // No payment status filter - include ALL bookings regardless of completion status
  };

  if (hotelId && hotelId !== 'all') {
    matchFilter.hotelId = new mongoose.Types.ObjectId(hotelId);
  }

  console.log('Debug - Match filter for all bookings:', matchFilter);

  // Helper function to get unified payment analytics from both regular bookings and transportation bookings
  const getUnifiedPaymentAnalytics = async (matchFilter) => {
    // Get regular bookings analytics
    const regularBookingsAnalytics = await Booking.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          serviceType: 'regular',
          paymentMethod: '$payment.paymentMethod',
          totalAmount: '$pricing.totalAmount',
          hotelEarnings: '$pricing.hotelEarnings',
          guestName: '$fullGuestName',
          bookingReference: '$bookingNumber'
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            paymentMethod: '$paymentMethod'
          },
          totalAmount: { $sum: '$totalAmount' },
          hotelEarnings: { $sum: '$hotelEarnings' },
          count: { $sum: 1 },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$totalAmount', 0]
            }
          },
          paidHotelEarnings: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$hotelEarnings', 0]
            }
          },
          bookings: {
            $push: {
              id: '$_id',
              serviceType: '$serviceType',
              guestName: '$guestName',
              bookingReference: '$bookingReference',
              totalAmount: '$totalAmount'
            }
          }
        }
      }
    ]);

    // Get transportation bookings analytics
    const transportationBookingsAnalytics = await TransportationBooking.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          serviceType: 'transportation',
          paymentMethod: '$payment.paymentMethod',
          totalAmount: '$quote.finalPrice',
          hotelEarnings: '$hotelMarkup.amount',
          guestName: '$guestDetails.firstName',
          bookingReference: '$bookingReference'
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            paymentMethod: '$paymentMethod'
          },
          totalAmount: { $sum: '$totalAmount' },
          hotelEarnings: { $sum: '$hotelEarnings' },
          count: { $sum: 1 },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$totalAmount', 0]
            }
          },
          paidHotelEarnings: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$hotelEarnings', 0]
            }
          },
          bookings: {
            $push: {
              id: '$_id',
              serviceType: '$serviceType',
              guestName: '$guestName',
              bookingReference: '$bookingReference',
              totalAmount: '$totalAmount'
            }
          }
        }
      }
    ]);

    // Combine the results from both collections
    const combined = [...regularBookingsAnalytics, ...transportationBookingsAnalytics];

    // Group by hotel and payment method, combining data from both collections
    const grouped = combined.reduce((acc, item) => {
      const key = `${item._id.hotelId}-${item._id.paymentMethod}`;

      if (acc[key]) {
        // Combine the data
        acc[key].totalAmount += item.totalAmount;
        acc[key].hotelEarnings += item.hotelEarnings;
        acc[key].count += item.count;
        acc[key].paidCount += item.paidCount;
        acc[key].paidAmount += item.paidAmount;
        acc[key].paidHotelEarnings += item.paidHotelEarnings;
        acc[key].bookings.push(...item.bookings);
      } else {
        acc[key] = item;
      }

      return acc;
    }, {});

    // Convert back to array format similar to original aggregation
    return Object.values(grouped);
  };

  // Helper function to get unified payment analytics with proper payment filtering per hotel
  const getUnifiedPaymentAnalyticsWithPaymentFiltering = async (baseMatchFilter, hotelId) => {
    if (hotelId && hotelId !== 'all') {
      // For specific hotel: apply payment filtering as before
      let bookingMatchFilter = { ...baseMatchFilter };

      const lastPayment = await HotelPayment.findOne({
        hotelId: new mongoose.Types.ObjectId(hotelId),
        paymentStatus: 'completed'
      }).sort({ 'paymentDetails.paymentDate': -1 });

      console.log('Debug - Last payment date for specific hotel:', lastPayment?.paymentDetails?.paymentDate);

      if (lastPayment && lastPayment.paymentDetails?.paymentDate) {
        bookingMatchFilter.createdAt = {
          ...baseMatchFilter.createdAt,
          $gte: new Date(lastPayment.paymentDetails.paymentDate)
        };
      }

      return await getUnifiedPaymentAnalytics(bookingMatchFilter);
    } else {
      // For all hotels: get last payment for each hotel and filter accordingly
      console.log('Debug - Using all hotels mode: checking each hotel\'s last payment individually');

      const allHotelsFilter = {};
      const allHotels = await Hotel.find(allHotelsFilter).select('_id name');

      let allResults = [];

      for (const hotel of allHotels) {
        // Get last payment for this specific hotel
        const lastPayment = await HotelPayment.findOne({
          hotelId: hotel._id,
          paymentStatus: 'completed'
        }).sort({ 'paymentDetails.paymentDate': -1 });

        // Create hotel-specific match filter
        let hotelBookingMatchFilter = {
          ...baseMatchFilter,
          hotelId: hotel._id
        };

        if (lastPayment && lastPayment.paymentDetails?.paymentDate) {
          hotelBookingMatchFilter.createdAt = {
            ...baseMatchFilter.createdAt,
            $gte: new Date(lastPayment.paymentDetails.paymentDate)
          };
        }

        console.log(`Debug - Hotel ${hotel.name}: last payment ${lastPayment?.paymentDetails?.paymentDate}`);

        // Get analytics for this hotel
        const hotelResults = await getUnifiedPaymentAnalytics(hotelBookingMatchFilter);
        allResults.push(...hotelResults);
      }

      return allResults;
    }
  };

  // Get payment analytics using the new filtering approach
  const paymentAnalyticsRaw = await getUnifiedPaymentAnalyticsWithPaymentFiltering(matchFilter, hotelId);

  console.log('Debug - Payment analytics raw results:', paymentAnalyticsRaw.length, 'groups');

  // Group by hotel (similar to the original second grouping stage)
  const paymentAnalytics = paymentAnalyticsRaw.reduce((acc, item) => {
    const hotelId = item._id.hotelId.toString();

    if (!acc[hotelId]) {
      acc[hotelId] = {
        _id: item._id.hotelId,
        payments: [],
        totalEarnings: 0,
        totalTransactions: 0
      };
    }

    acc[hotelId].payments.push({
      paymentMethod: item._id.paymentMethod,
      totalAmount: item.totalAmount,
      hotelEarnings: item.hotelEarnings,
      count: item.count,
      paidCount: item.paidCount,
      paidAmount: item.paidAmount,
      paidHotelEarnings: item.paidHotelEarnings,
      bookings: item.bookings
    });

    acc[hotelId].totalEarnings += item.hotelEarnings;
    acc[hotelId].totalTransactions += item.count;

    return acc;
  }, {});

  // Convert to array and add hotel information
  const analyticsArray = await Promise.all(
    Object.values(paymentAnalytics).map(async (hotelData) => {
      const hotel = await Hotel.findById(hotelData._id).select('name');
      return {
        hotelId: hotelData._id,
        hotelName: hotel ? hotel.name : 'Unknown Hotel',
        payments: hotelData.payments,
        totalEarnings: hotelData.totalEarnings,
        totalTransactions: hotelData.totalTransactions
      };
    })
  );

  console.log('Debug - Combined payment analytics (regular + transportation):', JSON.stringify(analyticsArray.slice(0, 1), null, 2));

  // Ensure all hotels are represented with both online and cash payment methods
  const completeAnalytics = allHotels.map(hotel => {
    const existingHotel = analyticsArray.find(p => p.hotelId.toString() === hotel._id.toString());

    if (!existingHotel) {
      return {
        hotelId: hotel._id,
        hotelName: hotel.name,
        payments: [
          {
            paymentMethod: 'online',
            totalAmount: 0,
            hotelEarnings: 0,
            count: 0,
            paidCount: 0,
            paidAmount: 0,
            paidHotelEarnings: 0,
            bookings: []
          },
          {
            paymentMethod: 'cash',
            totalAmount: 0,
            hotelEarnings: 0,
            count: 0,
            paidCount: 0,
            paidAmount: 0,
            paidHotelEarnings: 0,
            bookings: []
          }
        ],
        totalEarnings: 0,
        totalTransactions: 0
      };
    }

    // Ensure both online and cash methods are present
    const onlinePayment = existingHotel.payments.find(p => p.paymentMethod === 'online') ||
      {
        paymentMethod: 'online',
        totalAmount: 0,
        hotelEarnings: 0,
        count: 0,
        paidCount: 0,
        paidAmount: 0,
        paidHotelEarnings: 0,
        bookings: []
      };

    const cashPayment = existingHotel.payments.find(p => p.paymentMethod === 'cash') ||
      {
        paymentMethod: 'cash',
        totalAmount: 0,
        hotelEarnings: 0,
        count: 0,
        paidCount: 0,
        paidAmount: 0,
        paidHotelEarnings: 0,
        bookings: []
      };

    return {
      ...existingHotel,
      payments: [onlinePayment, cashPayment]
    };
  });

  // Get outstanding payments (not needed for display but kept for API compatibility)
  const outstandingPayments = await HotelPayment.find({
    paymentStatus: 'pending',
    ...(hotelId && hotelId !== 'all' ? { hotelId: new mongoose.Types.ObjectId(hotelId) } : {})
  }).populate('hotelId', 'name');

  // Get completed payments for the same time period as the booking analytics
  // Use overlapping date ranges to catch payments made for this period
  const completedPayments = await HotelPayment.find({
    paymentStatus: 'completed',
    // Find payments where the payment period overlaps with our analytics period
    $or: [
      {
        // Payment period overlaps with analytics period
        'paymentPeriod.startDate': { $lte: end },
        'paymentPeriod.endDate': { $gte: start }
      },
      {
        // Or recent payments (within last 24 hours) to catch immediate payments
        'paymentDetails.paymentDate': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    ],
    ...(hotelId && hotelId !== 'all' ? { hotelId: new mongoose.Types.ObjectId(hotelId) } : {})
  }).populate('hotelId', 'name');

  // Calculate raw totals from bookings (no reductions)
  const rawTotals = completeAnalytics.reduce((acc, hotel) => {
    hotel.payments.forEach(payment => {
      const method = payment.paymentMethod === 'online' ? 'online' : 'cash';
      if (!acc[method]) {
        acc[method] = { totalAmount: 0, hotelEarnings: 0, count: 0 };
      }
      acc[method].totalAmount += payment.totalAmount || 0;
      acc[method].hotelEarnings += payment.hotelEarnings || 0;
      acc[method].count += payment.count || 0;
    });
    return acc;
  }, { online: { totalAmount: 0, hotelEarnings: 0, count: 0 }, cash: { totalAmount: 0, hotelEarnings: 0, count: 0 } });

  console.log('Debug - Found completed payments:', completedPayments.length);
  console.log('Debug - Completed payment amounts:', completedPayments.map(p => p.paymentDetails?.paidAmount));
  console.log('Debug - Payment periods:', completedPayments.map(p => ({
    start: p.paymentPeriod?.startDate,
    end: p.paymentPeriod?.endDate,
    hotel: p.hotelId?.name
  })));
  console.log('Debug - Analytics date range:', { start, end });

  // Calculate total amount paid to reduce from Online Total Amount
  const totalPaidAmount = completedPayments.reduce((sum, payment) => {
    return sum + (payment.paymentDetails?.paidAmount || 0);
  }, 0);

  // Since we're only showing bookings since the last payment, no need to reduce by paid amounts
  const totals = {
    online: {
      totalAmount: rawTotals.online.totalAmount, // Show actual unpaid booking amounts
      hotelEarnings: rawTotals.online.hotelEarnings,
      count: rawTotals.online.count
    },
    cash: {
      totalAmount: rawTotals.cash.totalAmount, // Show actual unpaid booking amounts
      hotelEarnings: rawTotals.cash.hotelEarnings,
      count: rawTotals.cash.count
    }
  };

  console.log('Debug - Raw Online Total Amount:', rawTotals.online.totalAmount);
  console.log('Debug - Raw Cash Total Amount:', rawTotals.cash.totalAmount);
  console.log('Debug - Total Paid Amount:', totalPaidAmount);
  console.log('Debug - Final Online Total Amount (after reduction):', totals.online.totalAmount);
  console.log('Debug - Final Cash Total Amount:', totals.cash.totalAmount);

  res.status(200).json({
    status: 'success',
    data: {
      analytics: completeAnalytics,
      outstandingPayments,
      completedPayments,
      totals,
      period: { start, end }
    }
  });
}));

/**
 * @route   POST /api/superadmin/mark-hotel-payment
 * @desc    Mark hotel payment as completed
 * @access  Private/SuperAdmin
 */
router.post('/mark-hotel-payment', catchAsync(async (req, res) => {
  const {
    hotelId,
    amount,
    paymentMethod,
    transactionReference,
    notes,
    startDate,
    endDate
  } = req.body;

  if (!hotelId || !amount) {
    return res.status(400).json({
      status: 'error',
      message: 'Hotel ID and amount are required'
    });
  }

  const HotelPayment = require('../models/HotelPayment');

  // Calculate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get the most recent completed payment for this hotel to determine what has been paid
  const lastPayment = await HotelPayment.findOne({
    hotelId: new mongoose.Types.ObjectId(hotelId),
    paymentStatus: 'completed'
  }).sort({ 'paymentDetails.paymentDate': -1 });

  // Only include bookings created AFTER the last payment
  let bookingMatchFilter = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    createdAt: { $gte: start, $lte: end }
  };

  if (lastPayment && lastPayment.paymentDetails?.paymentDate) {
    bookingMatchFilter.createdAt = {
      ...bookingMatchFilter.createdAt,
      $gte: new Date(lastPayment.paymentDetails.paymentDate) // Only bookings since last payment
    };
  }

  console.log('Debug - Payment recording booking filter:', bookingMatchFilter);

  // Helper function to get unified booking analytics for payment recording
  const getUnifiedBookingAnalyticsForPayment = async (matchFilter) => {
    // Get regular bookings analytics
    const regularBookingsAnalytics = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$payment.paymentMethod',
          totalAmount: { $sum: '$pricing.totalAmount' },
          hotelEarnings: { $sum: '$pricing.hotelEarnings' },
          count: { $sum: 1 },
          bookingIds: { $push: '$_id' },
          bookingNumbers: { $push: '$bookingNumber' },
          serviceTypes: { $push: '$serviceType' },
          bookingDetails: {
            $push: {
              bookingId: '$_id',
              bookingNumber: '$bookingNumber',
              serviceType: '$serviceType',
              totalAmount: '$pricing.totalAmount',
              hotelEarnings: '$pricing.hotelEarnings',
              createdAt: '$createdAt',
              guestName: {
                $ifNull: [
                  { $concat: ['$guestDetails.firstName', ' ', '$guestDetails.lastName'] },
                  '$fullGuestName'
                ]
              }
            }
          }
        }
      }
    ]);

    // Get transportation bookings analytics
    const transportationBookingsAnalytics = await TransportationBooking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$payment.paymentMethod',
          totalAmount: { $sum: '$quote.finalPrice' },
          hotelEarnings: { $sum: '$hotelMarkup.amount' },
          count: { $sum: 1 },
          bookingIds: { $push: '$_id' },
          bookingNumbers: { $push: '$bookingReference' },
          serviceTypes: { $push: 'transportation' },
          bookingDetails: {
            $push: {
              bookingId: '$_id',
              bookingNumber: '$bookingReference',
              serviceType: 'transportation',
              totalAmount: '$quote.finalPrice',
              hotelEarnings: '$hotelMarkup.amount',
              createdAt: '$createdAt',
              guestName: '$guestDetails.firstName'
            }
          }
        }
      }
    ]);

    // Combine the results from both collections
    const combined = [...regularBookingsAnalytics, ...transportationBookingsAnalytics];

    // Group by payment method, combining data from both collections
    const grouped = combined.reduce((acc, item) => {
      const key = item._id; // payment method (online/cash)

      if (acc[key]) {
        // Combine the data
        acc[key].totalAmount += item.totalAmount;
        acc[key].hotelEarnings += item.hotelEarnings;
        acc[key].count += item.count;
        acc[key].bookingIds.push(...item.bookingIds);
        acc[key].bookingNumbers.push(...item.bookingNumbers);
        acc[key].serviceTypes.push(...item.serviceTypes);
        acc[key].bookingDetails.push(...item.bookingDetails);
      } else {
        acc[key] = item;
      }

      return acc;
    }, {});

    // Convert back to array format similar to original aggregation
    return Object.values(grouped);
  };

  // Get current booking analytics for unpaid bookings from both collections
  const bookingAnalytics = await getUnifiedBookingAnalyticsForPayment(bookingMatchFilter);

  console.log('Debug - Booking Analytics Result:', JSON.stringify(bookingAnalytics, null, 2));

  // Create payment breakdown
  const paymentBreakdown = {
    onlinePayments: { count: 0, totalAmount: 0, hotelEarnings: 0, bookingDetails: [] },
    cashPayments: { count: 0, totalAmount: 0, hotelEarnings: 0, bookingDetails: [] }
  };

  let totalEarnings = 0;
  let totalTransactions = 0;
  const allBookingIds = [];

  bookingAnalytics.forEach(group => {
    const method = group._id === 'online' ? 'onlinePayments' : 'cashPayments';
    paymentBreakdown[method] = {
      count: group.count,
      totalAmount: group.totalAmount,
      hotelEarnings: group.hotelEarnings,
      bookingDetails: group.bookingDetails
    };
    totalEarnings += group.hotelEarnings;
    totalTransactions += group.count;
    allBookingIds.push(...group.bookingIds);
  });

  console.log('Debug - Payment Breakdown for new payment:', JSON.stringify(paymentBreakdown.onlinePayments.bookingDetails?.slice(0, 2), null, 2));

  console.log('Debug - Final payment breakdown before saving:', {
    onlineCount: paymentBreakdown.onlinePayments.count,
    onlineAmount: paymentBreakdown.onlinePayments.totalAmount,
    onlineBookingsCount: paymentBreakdown.onlinePayments.bookingDetails?.length,
    cashCount: paymentBreakdown.cashPayments.count,
    cashAmount: paymentBreakdown.cashPayments.totalAmount,
    cashBookingsCount: paymentBreakdown.cashPayments.bookingDetails?.length
  });

  // Create or update hotel payment record
  const paymentRecord = await HotelPayment.findOneAndUpdate(
    {
      hotelId: new mongoose.Types.ObjectId(hotelId),
      paymentStatus: 'pending',
      'paymentPeriod.startDate': new Date(startDate),
      'paymentPeriod.endDate': new Date(endDate)
    },
    {
      $set: {
        paymentStatus: 'completed',
        paymentBreakdown: paymentBreakdown,
        totalEarnings: totalEarnings,
        totalTransactions: totalTransactions,
        'paymentDetails.paidAmount': amount,
        'paymentDetails.paymentDate': new Date(),
        'paymentDetails.paymentMethod': paymentMethod,
        'paymentDetails.transactionReference': transactionReference,
        'paymentDetails.notes': notes,
        'paymentDetails.processedBy': req.user._id,
        'invoice.generatedAt': new Date(),
        'invoice.generatedBy': req.user._id,
        'invoice.invoiceNumber': 'INV-' + Date.now().toString().slice(-8).toUpperCase(),
        'metadata.bookingIds': allBookingIds,
        'metadata.totalBookings': totalTransactions,
        'metadata.lastCalculatedAt': new Date()
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).populate('hotelId', 'name');

  // Log the payment action
  logger.info(`Hotel payment marked as completed`, {
    hotelId,
    amount,
    processedBy: req.user._id,
    transactionReference
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment marked as completed successfully',
    data: { paymentRecord }
  });
}));

/**
 * @route   GET /api/superadmin/payment-history
 * @desc    Get payment history for all hotels
 * @access  Private/SuperAdmin
 */
router.get('/payment-history', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, hotelId, status } = req.query;

  const HotelPayment = require('../models/HotelPayment');

  let filter = {};
  if (hotelId && hotelId !== 'all') {
    filter.hotelId = new mongoose.Types.ObjectId(hotelId);
  }
  if (status) {
    filter.paymentStatus = status;
  }

  const payments = await HotelPayment.find(filter)
    .populate('hotelId', 'name email')
    .populate('paymentDetails.processedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await HotelPayment.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: {
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    }
  });
}));

/**
 * @route   GET /api/superadmin/generate-invoice/:paymentId
 * @desc    Generate and download invoice for hotel payment
 * @access  Private/SuperAdmin
 */
router.get('/generate-invoice/:paymentId', catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const { format = 'pdf' } = req.query;

  const HotelPayment = require('../models/HotelPayment');

  const payment = await HotelPayment.findById(paymentId)
    .populate('hotelId', 'name email address phone')
    .populate('paymentDetails.processedBy', 'name email');

  if (!payment) {
    return res.status(404).json({
      status: 'error',
      message: 'Payment record not found'
    });
  }

  // Update download count
  payment.invoice.downloadCount += 1;
  await payment.save();

  if (format === 'csv') {
    // Generate CSV format
    const csvData = [
      ['Invoice Number', payment.invoice.invoiceNumber],
      ['Hotel Name', payment.hotelId.name],
      ['Payment Period', `${payment.paymentPeriod.startDate.toDateString()} - ${payment.paymentPeriod.endDate.toDateString()}`],
      ['Total Earnings', payment.totalEarnings],
      ['Payment Date', payment.paymentDetails.paymentDate?.toDateString() || 'N/A'],
      ['Transaction Reference', payment.paymentDetails.transactionReference || 'N/A'],
      ['Online Payments Count', payment.paymentBreakdown.onlinePayments.count],
      ['Online Payments Amount', payment.paymentBreakdown.onlinePayments.totalAmount],
      ['Cash Payments Count', payment.paymentBreakdown.cashPayments.count],
      ['Cash Payments Amount', payment.paymentBreakdown.cashPayments.totalAmount]
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.invoice.invoiceNumber}.csv`);

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return res.send(csvContent);
  } else {
    // Return PDF data (will be handled by frontend)
    res.status(200).json({
      status: 'success',
      data: {
        invoice: {
          invoiceNumber: payment.invoice.invoiceNumber,
          generatedAt: payment.invoice.generatedAt,
          hotel: payment.hotelId,
          paymentPeriod: payment.paymentPeriod,
          paymentBreakdown: payment.paymentBreakdown,
          totalEarnings: payment.totalEarnings,
          totalTransactions: payment.totalTransactions,
          paymentDetails: payment.paymentDetails,
          currency: payment.currency
        }
      }
    });
  }
}));

/**
 * @route   POST /api/superadmin/generate-invoice
 * @desc    Generate and download invoice for hotel payment (POST version)
 * @access  Private/SuperAdmin
 */
router.post('/generate-invoice', catchAsync(async (req, res) => {
  const { paymentId, format = 'pdf' } = req.body;

  const HotelPayment = require('../models/HotelPayment');

  const payment = await HotelPayment.findById(paymentId)
    .populate('hotelId', 'name email address phone')
    .populate('paymentDetails.processedBy', 'name email');

  console.log('Debug - CSV Payment ID:', paymentId);
  console.log('Debug - CSV Payment Amount:', payment?.paymentDetails?.paidAmount);
  console.log('Debug - Full Payment Record:', JSON.stringify({
    paymentBreakdown: payment?.paymentBreakdown,
    totalEarnings: payment?.totalEarnings,
    totalTransactions: payment?.totalTransactions
  }, null, 2));
  console.log('Debug - CSV Payment Breakdown:', {
    online: payment?.paymentBreakdown?.onlinePayments?.totalAmount,
    cash: payment?.paymentBreakdown?.cashPayments?.totalAmount,
    onlineBookingDetails: payment?.paymentBreakdown?.onlinePayments?.bookingDetails?.length,
    cashBookingDetails: payment?.paymentBreakdown?.cashPayments?.bookingDetails?.length
  });

  if (!payment) {
    return res.status(404).json({
      status: 'error',
      message: 'Payment record not found'
    });
  }

  // Update download count
  payment.invoice.downloadCount += 1;
  await payment.save();

  if (format === 'csv') {
    // Generate CSV format with booking details
    const csvData = [
      ['Invoice Number', payment.invoice.invoiceNumber || 'INV-' + payment._id.toString().slice(-8).toUpperCase()],
      ['Hotel Name', payment.hotelId.name],
      ['Payment Period', `${payment.paymentPeriod.startDate.toDateString()} - ${payment.paymentPeriod.endDate.toDateString()}`],
      ['Total Earnings', payment.totalEarnings || 0],
      ['Payment Date', payment.paymentDetails.paymentDate?.toDateString() || 'N/A'],
      ['Transaction Reference', payment.paymentDetails.transactionReference || 'N/A'],
      ['Online Payments Count', payment.paymentBreakdown?.onlinePayments?.count || 0],
      ['Online Payments Amount', payment.paymentBreakdown?.onlinePayments?.totalAmount || 0],
      ['Cash Payments Count', payment.paymentBreakdown?.cashPayments?.count || 0],
      ['Cash Payments Amount', payment.paymentBreakdown?.cashPayments?.totalAmount || 0],
      [''], // Empty row
      ['BOOKING DETAILS'], // Section header
      ['Booking Number', 'Service Type', 'Guest Name', 'Total Amount', 'Hotel Earnings', 'Payment Method', 'Date']
    ];

    // Add online booking details
    if (payment.paymentBreakdown?.onlinePayments?.bookingDetails?.length > 0) {
      csvData.push(['ONLINE PAYMENTS:']);
      payment.paymentBreakdown.onlinePayments.bookingDetails.forEach(booking => {
        csvData.push([
          booking.bookingNumber || booking.bookingId,
          booking.serviceType || 'N/A',
          booking.guestName || 'N/A',
          booking.totalAmount || 0,
          booking.hotelEarnings || 0,
          'online',
          booking.createdAt ? new Date(booking.createdAt).toDateString() : 'N/A'
        ]);
      });
    }

    // Add cash booking details
    if (payment.paymentBreakdown?.cashPayments?.bookingDetails?.length > 0) {
      csvData.push(['CASH PAYMENTS:']);
      payment.paymentBreakdown.cashPayments.bookingDetails.forEach(booking => {
        csvData.push([
          booking.bookingNumber || booking.bookingId,
          booking.serviceType || 'N/A',
          booking.guestName || 'N/A',
          booking.totalAmount || 0,
          booking.hotelEarnings || 0,
          'cash',
          booking.createdAt ? new Date(booking.createdAt).toDateString() : 'N/A'
        ]);
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.invoice.invoiceNumber || payment._id}.csv`);

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return res.send(csvContent);
  } else {
    // Generate PDF content as JSON (frontend will handle PDF generation)
    const invoiceData = {
      invoiceNumber: payment.invoice.invoiceNumber || 'INV-' + payment._id.toString().slice(-8).toUpperCase(),
      generatedAt: payment.invoice.generatedAt || new Date(),
      hotel: payment.hotelId,
      paymentPeriod: payment.paymentPeriod,
      paymentBreakdown: payment.paymentBreakdown,
      totalEarnings: payment.totalEarnings,
      totalTransactions: payment.totalTransactions,
      paymentDetails: payment.paymentDetails,
      currency: payment.currency
    };

    // For PDF, we return the data and let the frontend handle PDF generation
    res.status(200).json({
      status: 'success',
      data: { invoice: invoiceData }
    });
  }
}));

/**
 * @route   POST /api/superadmin/reset-outstanding-payments
 * @desc    Reset outstanding payments counter for a hotel
 * @access  Private/SuperAdmin
 */
router.post('/reset-outstanding-payments', catchAsync(async (req, res) => {
  const { hotelId } = req.body;

  if (!hotelId) {
    return res.status(400).json({
      status: 'error',
      message: 'Hotel ID is required'
    });
  }

  const HotelPayment = require('../models/HotelPayment');

  // Mark all pending payments for this hotel as completed
  const result = await HotelPayment.updateMany(
    {
      hotelId: new mongoose.Types.ObjectId(hotelId),
      paymentStatus: 'pending'
    },
    {
      $set: {
        paymentStatus: 'completed',
        'paymentDetails.paymentDate': new Date(),
        'paymentDetails.processedBy': req.user._id,
        'paymentDetails.notes': 'Reset by Super Admin'
      }
    }
  );

  logger.info(`Outstanding payments reset for hotel`, {
    hotelId,
    resetBy: req.user._id,
    affectedRecords: result.modifiedCount
  });

  res.status(200).json({
    status: 'success',
    message: 'Outstanding payments reset successfully',
    data: { affectedRecords: result.modifiedCount }
  });
}));

// Import and use feedback routes for superadmin
const feedbackRoutes = require('./feedback');
router.use('/', feedbackRoutes);

module.exports = router;
