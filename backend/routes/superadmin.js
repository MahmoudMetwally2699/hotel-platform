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

// Import and use feedback routes for superadmin
const feedbackRoutes = require('./feedback');
router.use('/', feedbackRoutes);

module.exports = router;
