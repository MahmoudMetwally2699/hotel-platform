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

module.exports = router;
