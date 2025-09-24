/**
 * Super Hotel Routes
 *
 * Routes for super hotel portal at /admin
 * Handles authentication, dashboard, statistics, and analysis for assigned hotels
 */

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { catchAsync, AppError } = require('../middleware/error');
const { protectSuperHotel, restrictToAssignedHotels } = require('../middleware/auth');
const SuperHotel = require('../models/SuperHotel');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Booking = require('../models/Booking');
const TransportationBooking = require('../models/TransportationBooking');
const Service = require('../models/Service');
const logger = require('../utils/logger');

const router = express.Router();

// Helper function to create JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Helper function to send token response
const createSendToken = (superHotel, statusCode, req, res) => {
  const token = signToken(superHotel._id);

  // Simplified cookie settings - we're primarily relying on Authorization header now
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true, // Always use httpOnly for security
    secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
    sameSite: 'lax' // Use lax instead of none to avoid cross-site cookie issues
  };

  console.log('🍪 Setting superHotelJwt cookie with options:', cookieOptions);
  console.log('🍪 Token being set:', token.substring(0, 20) + '...');
  console.log('🍪 Request origin:', req.headers.origin);
  console.log('🍪 Request host:', req.headers.host);

  res.cookie('superHotelJwt', token, cookieOptions);  // Verify cookie was set by checking response headers
  console.log('🍪 Response headers after setting cookie:', res.getHeaders());

  // Remove password from output
  superHotel.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      superHotel
    }
  });
};

// ===========================================
// AUTHENTICATION ROUTES
// ===========================================

/**
 * @route   POST /api/admin/auth/login
 * @desc    Super hotel login
 * @access  Public
 */
router.post('/auth/login', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if super hotel exists and password is correct
  const superHotel = await SuperHotel.findByCredentials(email, password);

  if (!superHotel) {
    logger.logSecurity('SUPER_HOTEL_LOGIN_FAILED', req, { email });
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Update last login
  await superHotel.updateLastLogin();

  // 4) If everything ok, send token to client
  logger.info('Super hotel logged in successfully', {
    superHotelId: superHotel._id,
    email: superHotel.email
  });

  createSendToken(superHotel, 200, req, res);
}));

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Super hotel logout
 * @access  Private
 */
router.post('/auth/logout', (req, res) => {
  res.cookie('superHotelJwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get current super hotel info
 * @access  Private
 */
router.get('/auth/me', protectSuperHotel, catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      superHotel: req.superHotel
    }
  });
}));

// Protect all routes after this middleware
router.use(protectSuperHotel);

// ===========================================
// DASHBOARD AND STATISTICS ROUTES
// ===========================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get super hotel dashboard data
 * @access  Private/SuperHotel
 */
router.get('/dashboard', catchAsync(async (req, res) => {
  const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id);

  // Get overview statistics from both Bookings and TransportationBookings
  const [
    hotelStats,
    regularBookingStats,
    transportationBookingStats,
    regularRevenueStats,
    transportationRevenueStats,
    clientStats,
    recentRegularBookings,
    recentTransportationBookings
  ] = await Promise.all([
    // Hotel statistics
    Hotel.aggregate([
      { $match: { _id: { $in: assignedHotelIds } } },
      {
        $group: {
          _id: null,
          totalHotels: { $sum: 1 },
          activeHotels: { $sum: { $cond: [{ $and: ['$isActive', '$isPublished'] }, 1, 0] } },
          totalRooms: { $sum: '$totalRooms' },
          averageRating: { $avg: '$averageRating' }
        }
      }
    ]),

    // Regular Booking statistics
    Booking.aggregate([
      { $match: { hotelId: { $in: assignedHotelIds } } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } }
        }
      }
    ]),

    // Transportation Booking statistics
    TransportationBooking.aggregate([
      { $match: { hotelId: { $in: assignedHotelIds } } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] } },
          pendingBookings: { $sum: { $cond: [{ $in: ['$bookingStatus', ['pending_quote', 'quote_sent', 'payment_pending']] }, 1, 0] } },
          confirmedBookings: { $sum: { $cond: [{ $in: ['$bookingStatus', ['quote_accepted', 'payment_completed', 'service_active']] }, 1, 0] } }
        }
      }
    ]),

    // Regular Revenue statistics
    Booking.aggregate([
      { $match: {
        hotelId: { $in: assignedHotelIds },
        status: 'completed'
      }},
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageBookingValue: { $avg: '$pricing.totalAmount' },
          hotelCommissions: { $sum: '$pricing.hotelCommission' },
          platformFees: { $sum: '$pricing.platformFee' }
        }
      }
    ]),

    // Transportation Revenue statistics
    TransportationBooking.aggregate([
      { $match: {
        hotelId: { $in: assignedHotelIds },
        bookingStatus: 'completed'
      }},
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$quote.finalPrice', '$totalAmount'] } },
          averageBookingValue: { $avg: { $ifNull: ['$quote.finalPrice', '$totalAmount'] } },
          hotelCommissions: { $sum: '$breakdown.hotelCommission' },
          platformFees: { $sum: '$breakdown.platformFee' }
        }
      }
    ]),

    // Client statistics
    User.aggregate([
      { $match: {
        selectedHotelId: { $in: assignedHotelIds },
        role: 'guest'
      }},
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          activeClients: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]),

    // Recent regular bookings
    Booking.aggregate([
      { $match: { hotelId: { $in: assignedHotelIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'guestId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
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
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          status: 1,
          totalAmount: '$pricing.totalAmount',
          createdAt: 1,
          bookingType: { $literal: 'regular' },
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          userEmail: '$user.email',
          serviceName: '$service.name',
          serviceCategory: '$service.category',
          hotelName: '$hotel.name'
        }
      }
    ]),

    // Recent transportation bookings
    TransportationBooking.aggregate([
      { $match: { hotelId: { $in: assignedHotelIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'guestId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          status: '$bookingStatus',
          totalAmount: { $ifNull: ['$quote.finalPrice', '$totalAmount'] },
          createdAt: 1,
          bookingType: { $literal: 'transportation' },
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          userEmail: '$user.email',
          serviceName: { $concat: ['Transportation - ', '$vehicleType'] },
          serviceCategory: { $literal: 'Transportation' },
          hotelName: '$hotel.name',
          bookingReference: 1
        }
      }
    ])
  ]);

  // Combine booking and revenue statistics
  const regularBookings = regularBookingStats[0] || { totalBookings: 0, completedBookings: 0, pendingBookings: 0, confirmedBookings: 0 };
  const transportBookings = transportationBookingStats[0] || { totalBookings: 0, completedBookings: 0, pendingBookings: 0, confirmedBookings: 0 };

  const combinedBookings = {
    totalBookings: regularBookings.totalBookings + transportBookings.totalBookings,
    completedBookings: regularBookings.completedBookings + transportBookings.completedBookings,
    pendingBookings: regularBookings.pendingBookings + transportBookings.pendingBookings,
    confirmedBookings: regularBookings.confirmedBookings + transportBookings.confirmedBookings
  };

  const regularRevenue = regularRevenueStats[0] || { totalRevenue: 0, averageBookingValue: 0, hotelCommissions: 0, platformFees: 0 };
  const transportRevenue = transportationRevenueStats[0] || { totalRevenue: 0, averageBookingValue: 0, hotelCommissions: 0, platformFees: 0 };

  const combinedRevenue = {
    totalRevenue: regularRevenue.totalRevenue + transportRevenue.totalRevenue,
    averageBookingValue: combinedBookings.totalBookings > 0 ?
      (regularRevenue.totalRevenue + transportRevenue.totalRevenue) / combinedBookings.totalBookings : 0,
    hotelCommissions: regularRevenue.hotelCommissions + transportRevenue.hotelCommissions,
    platformFees: regularRevenue.platformFees + transportRevenue.platformFees
  };

  // Combine and sort recent bookings
  const allRecentBookings = [...(recentRegularBookings || []), ...(recentTransportationBookings || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        hotels: hotelStats[0] || { totalHotels: 0, activeHotels: 0, totalRooms: 0, averageRating: 0 },
        bookings: combinedBookings,
        revenue: combinedRevenue,
        clients: clientStats[0] || { totalClients: 0, activeClients: 0 }
      },
      recentBookings: allRecentBookings,
      breakdown: {
        regularBookings: regularBookings,
        transportationBookings: transportBookings,
        regularRevenue: regularRevenue,
        transportationRevenue: transportRevenue
      }
    }
  });
}));

/**
 * @route   GET /api/admin/hotels
 * @desc    Get assigned hotels with statistics
 * @access  Private/SuperHotel
 */
router.get('/hotels', catchAsync(async (req, res) => {
  const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id);

  const hotelsWithStats = await Hotel.aggregate([
    { $match: { _id: { $in: assignedHotelIds } } },
    {
      $lookup: {
        from: 'users',
        let: { hotelId: '$_id' },
        pipeline: [
          { $match: {
            $expr: { $eq: ['$selectedHotelId', '$$hotelId'] },
            role: 'guest'
          }},
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        as: 'clientCount'
      }
    },
    {
      $lookup: {
        from: 'bookings',
        let: { hotelId: '$_id' },
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          { $match: { $expr: { $eq: ['$user.selectedHotelId', '$$hotelId'] } } },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } }
            }
          }
        ],
        as: 'bookingStats'
      }
    },
    {
      $project: {
        name: 1,
        address: 1,
        location: 1,
        contactInfo: 1,
        isActive: 1,
        isPublished: 1,
        averageRating: 1,
        totalRooms: 1,
        createdAt: 1,
        clientCount: { $ifNull: [{ $arrayElemAt: ['$clientCount.count', 0] }, 0] },
        totalBookings: { $ifNull: [{ $arrayElemAt: ['$bookingStats.totalBookings', 0] }, 0] },
        totalRevenue: { $ifNull: [{ $arrayElemAt: ['$bookingStats.totalRevenue', 0] }, 0] }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      hotels: hotelsWithStats
    }
  });
}));

/**
 * @route   GET /api/admin/hotels/:hotelId/details
 * @desc    Get detailed hotel information and statistics
 * @access  Private/SuperHotel
 */
router.get('/hotels/:hotelId/details', restrictToAssignedHotels, catchAsync(async (req, res) => {
  const { hotelId } = req.params;

  const [hotel, bookingTrends, clientStats, serviceStats] = await Promise.all([
    // Hotel details
    Hotel.findById(hotelId),

    // Booking trends (last 6 months)
    Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.selectedHotelId': new mongoose.Types.ObjectId(hotelId),
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Client statistics
    User.aggregate([
      { $match: {
        selectedHotelId: new mongoose.Types.ObjectId(hotelId),
        role: 'guest'
      }},
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newClients: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Service performance
    Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.selectedHotelId': new mongoose.Types.ObjectId(hotelId) } },
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
          bookings: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { revenue: -1 } }
    ])
  ]);

  if (!hotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Hotel not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
      analytics: {
        bookingTrends,
        clientStats,
        serviceStats
      }
    }
  });
}));

/**
 * @route   GET /api/admin/clients
 * @desc    Get clients from assigned hotels
 * @access  Private/SuperHotel
 */
router.get('/clients', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, hotelId } = req.query;
  const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id);

  // Build filter
  const filter = {
    role: 'guest',
    selectedHotelId: { $in: assignedHotelIds }
  };

  if (hotelId) {
    if (!assignedHotelIds.some(id => id.toString() === hotelId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this hotel'
      });
    }
    filter.selectedHotelId = hotelId;
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    User.find(filter)
      .populate('selectedHotelId', 'name')
      .select('firstName lastName email phone isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      clients,
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
 * @route   GET /api/admin/analytics
 * @desc    Get comprehensive analytics for assigned hotels
 * @access  Private/SuperHotel
 */
router.get('/analytics', catchAsync(async (req, res) => {
  const { timeRange = '30' } = req.query; // Days
  const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id);

  const startDate = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

  const [
    revenueAnalytics,
    bookingAnalytics,
    clientAnalytics,
    servicePerformance,
    hotelComparison
  ] = await Promise.all([
    // Revenue analytics
    Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.selectedHotelId': { $in: assignedHotelIds },
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Booking status analytics
    Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.selectedHotelId': { $in: assignedHotelIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]),

    // Client growth analytics
    User.aggregate([
      {
        $match: {
          selectedHotelId: { $in: assignedHotelIds },
          role: 'guest',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          newClients: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Service category performance
    Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.selectedHotelId': { $in: assignedHotelIds },
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
          bookings: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { revenue: -1 } }
    ]),

    // Hotel performance comparison
    Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.selectedHotelId': { $in: assignedHotelIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'user.selectedHotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: '$hotel._id',
          hotelName: { $first: '$hotel.name' },
          bookings: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { revenue: -1 } }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      timeRange: parseInt(timeRange),
      analytics: {
        revenue: revenueAnalytics,
        bookings: bookingAnalytics,
        clients: clientAnalytics,
        servicePerformance,
        hotelComparison
      }
    }
  });
}));

/**
 * @route   GET /api/admin/analytics/comprehensive
 * @desc    Get comprehensive analytics for super hotel admin
 * @access  Private/SuperHotel
 */
router.get('/analytics/comprehensive', protectSuperHotel, catchAsync(async (req, res) => {
  const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id);
  const { timeRange = '30', hotelId, category } = req.query;

  // Build date filter
  let dateFilter = {};
  const now = new Date();

  switch (timeRange) {
    case '7':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
      break;
    case '30':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
      break;
    case '90':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) } };
      break;
    case '365':
      dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
      break;
    default:
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
  }

  // Hotel filter - Create filtered arrays for aggregation queries
  let filteredHotelIds = assignedHotelIds;
  let hotelMatchFilter = { hotelId: { $in: assignedHotelIds } };
  let selectedHotelMatchFilter = { selectedHotelId: { $in: assignedHotelIds } };

  if (hotelId) {
    // Verify hotel is assigned to this super hotel admin
    if (!assignedHotelIds.some(id => id.toString() === hotelId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this hotel'
      });
    }
    const filteredHotelObjectId = new mongoose.Types.ObjectId(hotelId);
    filteredHotelIds = [filteredHotelObjectId];
    hotelMatchFilter = { hotelId: filteredHotelObjectId };
    selectedHotelMatchFilter = { selectedHotelId: filteredHotelObjectId };
  }

  const [
    // 1. Hotel Performance Tracking
    hotelTracking,

    // 1b. Transportation Hotel Performance Tracking
    transportationHotelTracking,

    // 2. Service Booking Analysis
    serviceBookingAnalysis,

    // 2b. Transportation Service Analysis
    transportationServiceAnalysis,

    // 3. Order Processing Time Analysis
    orderProcessingTimes,

    // 3b. Transportation Processing Time Analysis
    transportationProcessingTimes,

    // 4. Housekeeping Category Issues
    housekeepingIssues,

    // 5. Revenue Distribution
    revenueDistribution,

    // 5b. Transportation Revenue Distribution
    transportationRevenueDistribution,

    // 6. Service Provider Performance
    serviceProviderPerformance,

    // 6b. Transportation Service Provider Performance
    transportationServiceProviderPerformance,

    // 7. Time-based Analytics
    timeBasedAnalytics
  ] = await Promise.all([

    // 1. Hotel Performance Tracking
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: '$hotelId',
          hotelName: { $first: '$hotel.name' },
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          // Only count revenue from completed bookings
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$pricing.totalAmount',
                0
              ]
            }
          },
          hotelEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$pricing.hotelEarnings',
                0
              ]
            }
          },
          providerEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$pricing.providerEarnings',
                0
              ]
            }
          },
          averageOrderValue: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$pricing.totalAmount',
                null
              ]
            }
          },
          uniqueGuests: { $addToSet: '$guestId' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] },
              0
            ]
          },
          cancellationRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$cancelledBookings', '$totalBookings'] }, 100] },
              0
            ]
          },
          uniqueGuestCount: { $size: '$uniqueGuests' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),

    // 1b. Transportation Hotel Performance Tracking
    TransportationBooking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: '$hotelId',
          hotelName: { $first: '$hotel.name' },
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
          },
          // Only count revenue from completed bookings
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$bookingStatus', 'completed'] },
                { $ifNull: ['$quote.finalPrice', 0] },
                0
              ]
            }
          },
          hotelEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$bookingStatus', 'completed'] },
                { $ifNull: ['$breakdown.hotelCommission', 0] },
                0
              ]
            }
          },
          providerEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$bookingStatus', 'completed'] },
                { $ifNull: ['$breakdown.providerEarnings', 0] },
                0
              ]
            }
          },
          averageOrderValue: {
            $avg: {
              $cond: [
                { $eq: ['$bookingStatus', 'completed'] },
                { $ifNull: ['$quote.finalPrice', 0] },
                null
              ]
            }
          },
          uniqueGuests: { $addToSet: '$guestId' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] },
              0
            ]
          },
          cancellationRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$cancelledBookings', '$totalBookings'] }, 100] },
              0
            ]
          },
          uniqueGuestCount: { $size: '$uniqueGuests' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),

    // 2. Service Booking Analysis by Category and Hotel
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            hotelName: '$hotel.name',
            category: '$serviceDetails.category',
            status: '$status'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageValue: { $avg: '$pricing.totalAmount' }
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$_id.hotelId',
            hotelName: '$_id.hotelName',
            category: '$_id.category'
          },
          totalBookings: { $sum: '$count' },
          totalRevenue: { $sum: '$totalRevenue' },
          averageValue: { $avg: '$averageValue' },
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { '_id.hotelName': 1, totalRevenue: -1 } }
    ]),

    // 2b. Transportation Service Analysis
    TransportationBooking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            hotelName: '$hotel.name',
            category: 'transportation', // All transportation bookings are in transportation category
            status: '$bookingStatus'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$quote.finalPrice', 0] } },
          averageValue: { $avg: { $ifNull: ['$quote.finalPrice', 0] } }
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$_id.hotelId',
            hotelName: '$_id.hotelName',
            category: '$_id.category'
          },
          totalBookings: { $sum: '$count' },
          totalRevenue: { $sum: '$totalRevenue' },
          averageValue: { $avg: '$averageValue' },
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { '_id.hotelName': 1, totalRevenue: -1 } }
    ]),

    // 3. Order Processing Time Analysis
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter,
          statusHistory: { $exists: true, $ne: [] }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $addFields: {
          pendingToConfirmed: {
            $let: {
              vars: {
                pendingTime: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        cond: { $eq: ['$$this.status', 'pending'] }
                      }
                    },
                    0
                  ]
                },
                confirmedTime: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        cond: { $in: ['$$this.status', ['confirmed', 'assigned']] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                $cond: [
                  { $and: ['$$pendingTime', '$$confirmedTime'] },
                  {
                    $divide: [
                      { $subtract: ['$$confirmedTime.timestamp', '$$pendingTime.timestamp'] },
                      60000 // Convert to minutes
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          pendingToConfirmed: { $ne: null, $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            hotelName: '$hotel.name',
            category: '$serviceDetails.category'
          },
          averageProcessingTime: { $avg: '$pendingToConfirmed' },
          minProcessingTime: { $min: '$pendingToConfirmed' },
          maxProcessingTime: { $max: '$pendingToConfirmed' },
          totalOrders: { $sum: 1 },
          ordersUnder30Min: {
            $sum: { $cond: [{ $lte: ['$pendingToConfirmed', 30] }, 1, 0] }
          },
          ordersUnder1Hour: {
            $sum: { $cond: [{ $lte: ['$pendingToConfirmed', 60] }, 1, 0] }
          },
          ordersOver4Hours: {
            $sum: { $cond: [{ $gte: ['$pendingToConfirmed', 240] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          under30MinPercentage: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$ordersUnder30Min', '$totalOrders'] }, 100] },
              0
            ]
          },
          under1HourPercentage: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$ordersUnder1Hour', '$totalOrders'] }, 100] },
              0
            ]
          },
          over4HoursPercentage: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$ordersOver4Hours', '$totalOrders'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { averageProcessingTime: 1 } }
    ]),

    // 3b. Transportation Processing Time Analysis
    TransportationBooking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter,
          'quote.quotedAt': { $exists: true } // Only include bookings that have received quotes
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $addFields: {
          responseTime: {
            $cond: [
              { $and: [
                { $ne: ['$quote.quotedAt', null] },
                { $ne: ['$createdAt', null] }
              ]},
              {
                $divide: [
                  { $subtract: ['$quote.quotedAt', '$createdAt'] },
                  60000  // Convert to minutes
                ]
              },
              null
            ]
          }
        }
      },
      {
        $match: {
          responseTime: { $gte: 0 } // Filter out invalid response times
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            hotelName: '$hotel.name',
            category: 'transportation'
          },
          averageProcessingTime: { $avg: '$responseTime' },
          minProcessingTime: { $min: '$responseTime' },
          maxProcessingTime: { $max: '$responseTime' },
          totalOrders: { $sum: 1 },
          // Calculate percentages based on response times to match regular analysis
          ordersUnder30Min: {
            $sum: { $cond: [{ $lte: ['$responseTime', 30] }, 1, 0] } // Within 30 minutes
          },
          ordersUnder1Hour: {
            $sum: { $cond: [{ $lte: ['$responseTime', 60] }, 1, 0] } // Within 1 hour
          },
          ordersOver4Hours: {
            $sum: { $cond: [{ $gte: ['$responseTime', 240] }, 1, 0] } // Over 4 hours
          }
        }
      },
      {
        $addFields: {
          under30MinPercentage: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$ordersUnder30Min', '$totalOrders'] }, 100] },
              0
            ]
          },
          under1HourPercentage: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$ordersUnder1Hour', '$totalOrders'] }, 100] },
              0
            ]
          },
          over4HoursPercentage: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$ordersOver4Hours', '$totalOrders'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { averageProcessingTime: 1 } }
    ]),

    // 4. Housekeeping Category Issues Tracking
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter,
          'serviceDetails.category': 'housekeeping',
          'serviceDetails.specificCategory': { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: {
            hotelId: '$hotelId',
            hotelName: '$hotel.name',
            specificCategory: '$serviceDetails.specificCategory',
            status: '$status'
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.totalAmount' },
          averageResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    3600000 // Convert to hours
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            hotelId: '$_id.hotelId',
            hotelName: '$_id.hotelName',
            specificCategory: '$_id.specificCategory'
          },
          totalIssues: { $sum: '$count' },
          totalValue: { $sum: '$totalValue' },
          averageResolutionTime: { $avg: '$averageResolutionTime' },
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          completedIssues: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'completed'] }, '$count', 0]
            }
          }
        }
      },
      {
        $addFields: {
          resolutionRate: {
            $cond: [
              { $gt: ['$totalIssues', 0] },
              { $multiply: [{ $divide: ['$completedIssues', '$totalIssues'] }, 100] },
              0
            ]
          },
          categoryLabel: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.specificCategory', 'electrical_issues'] }, then: 'Electrical Issues' },
                { case: { $eq: ['$_id.specificCategory', 'plumbing_issues'] }, then: 'Plumbing Issues' },
                { case: { $eq: ['$_id.specificCategory', 'ac_heating'] }, then: 'AC/Heating' },
                { case: { $eq: ['$_id.specificCategory', 'furniture_repair'] }, then: 'Furniture Repair' },
                { case: { $eq: ['$_id.specificCategory', 'electronics_issues'] }, then: 'Electronics Issues' },
                { case: { $eq: ['$_id.specificCategory', 'general_cleaning'] }, then: 'General Cleaning' },
                { case: { $eq: ['$_id.specificCategory', 'deep_cleaning'] }, then: 'Deep Cleaning' },
                { case: { $eq: ['$_id.specificCategory', 'stain_removal'] }, then: 'Stain Removal' },
                { case: { $eq: ['$_id.specificCategory', 'bathroom_amenities'] }, then: 'Bathroom Amenities' },
                { case: { $eq: ['$_id.specificCategory', 'room_supplies'] }, then: 'Room Supplies' },
                { case: { $eq: ['$_id.specificCategory', 'cleaning_supplies'] }, then: 'Cleaning Supplies' }
              ],
              default: '$_id.specificCategory'
            }
          }
        }
      },
      { $sort: { '_id.hotelName': 1, totalIssues: -1 } }
    ]),

    // 5. Revenue Distribution Analysis
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter,
          status: { $in: ['completed', 'in-progress', 'confirmed'] }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' },
            hotelId: '$hotelId',
            hotelName: '$hotel.name'
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          hotelEarnings: { $sum: '$pricing.hotelEarnings' },
          providerEarnings: { $sum: '$pricing.providerEarnings' },
          markupAmount: { $sum: '$pricing.markup.amount' },
          bookingCount: { $sum: 1 },
          averageMarkupPercentage: { $avg: '$pricing.markup.percentage' }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: ['$hotelEarnings', '$totalRevenue'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1 } }
    ]),

    // 5b. Transportation Revenue Distribution Analysis
    TransportationBooking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter,
          bookingStatus: { $in: ['completed', 'service_active', 'payment_completed'] }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' },
            hotelId: '$hotelId',
            hotelName: '$hotel.name'
          },
          totalRevenue: { $sum: { $ifNull: ['$quote.finalPrice', 0] } },
          hotelEarnings: { $sum: { $ifNull: ['$breakdown.hotelCommission', 0] } },
          providerEarnings: { $sum: { $ifNull: ['$breakdown.providerEarnings', 0] } },
          totalBookings: { $sum: 1 }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: ['$hotelEarnings', '$totalRevenue'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1 } }
    ]),

    // 6. Service Provider Performance
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'serviceproviders',
          localField: 'serviceProviderId',
          foreignField: '_id',
          as: 'serviceProvider'
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$serviceProvider' },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: {
            providerId: '$serviceProviderId',
            providerName: '$serviceProvider.businessName',
            hotelId: '$hotelId',
            hotelName: '$hotel.name',
            category: '$serviceDetails.category'
          },
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageRating: { $avg: '$feedback.rating' },
          averageResponseTime: {
            $avg: {
              $let: {
                vars: {
                  // Find the first status change after creation (any status other than pending)
                  responseStatus: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$statusHistory',
                          cond: {
                            $and: [
                              { $ne: ['$$this.status', 'pending'] },
                              { $ne: ['$$this.status', null] }
                            ]
                          }
                        }
                      },
                      0
                    ]
                  },
                  // If no response status, check if there's any status history at all
                  anyStatus: {
                    $arrayElemAt: ['$statusHistory', 0]
                  }
                },
                in: {
                  $cond: [
                    { $ne: ['$$responseStatus', null] },
                    {
                      $divide: [
                        { $subtract: ['$$responseStatus.timestamp', '$createdAt'] },
                        60000
                      ]
                    },
                    // If no response status but has any status history, calculate from first status
                    {
                      $cond: [
                        { $ne: ['$$anyStatus', null] },
                        {
                          $divide: [
                            { $subtract: ['$$anyStatus.timestamp', '$createdAt'] },
                            60000
                          ]
                        },
                        null
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.hotelName': 1, completionRate: -1 } }
    ]),

    // 6b. Transportation Service Provider Performance
    TransportationBooking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'serviceproviders',
          localField: 'serviceProviderId',
          foreignField: '_id',
          as: 'serviceProvider'
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: { path: '$serviceProvider', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$hotel', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          responseTime: {
            $cond: [
              { $and: [
                { $isArray: '$statusHistory' },
                { $gt: [{ $size: '$statusHistory' }, 1] }
              ]},
              {
                $let: {
                  vars: {
                    firstStatus: { $arrayElemAt: ['$statusHistory', 0] },
                    confirmedStatus: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$statusHistory',
                            cond: { $in: ['$$this.status', ['quote_sent', 'quote_accepted', 'payment_completed']] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $cond: [
                      { $ne: ['$$confirmedStatus', null] },
                      { $divide: [{ $subtract: ['$$confirmedStatus.timestamp', '$$firstStatus.timestamp'] }, 60000] },
                      null
                    ]
                  }
                }
              },
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            providerId: '$serviceProviderId',
            providerName: { $ifNull: ['$serviceProvider.businessName', 'Unknown Provider'] },
            hotelId: '$hotelId',
            hotelName: { $ifNull: ['$hotel.name', 'Unknown Hotel'] },
            category: 'transportation'
          },
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] } },
          totalRevenue: { $sum: { $ifNull: ['$quote.finalPrice', 0] } },
          averageResponseTime: {
            $avg: {
              $cond: [{ $and: [{ $ne: ['$responseTime', null] }, { $gt: ['$responseTime', 0] }] }, '$responseTime', null]
            }
          },
          responseTimeCount: { $sum: { $cond: [{ $ne: ['$responseTime', null] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.hotelName': 1, completionRate: -1 } }
    ]),

    // 7. Time-based Analytics (Peak hours, days, etc.)
    Booking.aggregate([
      {
        $match: {
          ...hotelMatchFilter,
          ...dateFilter
        }
      },
      {
        $addFields: {
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          dayOfMonth: { $dayOfMonth: '$createdAt' }
        }
      },
      {
        $group: {
          _id: {
            hour: '$hour',
            dayOfWeek: '$dayOfWeek'
          },
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageValue: { $avg: '$pricing.totalAmount' }
        }
      },
      {
        $addFields: {
          dayName: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.dayOfWeek', 1] }, then: 'Sunday' },
                { case: { $eq: ['$_id.dayOfWeek', 2] }, then: 'Monday' },
                { case: { $eq: ['$_id.dayOfWeek', 3] }, then: 'Tuesday' },
                { case: { $eq: ['$_id.dayOfWeek', 4] }, then: 'Wednesday' },
                { case: { $eq: ['$_id.dayOfWeek', 5] }, then: 'Thursday' },
                { case: { $eq: ['$_id.dayOfWeek', 6] }, then: 'Friday' },
                { case: { $eq: ['$_id.dayOfWeek', 7] }, then: 'Saturday' }
              ],
              default: 'Unknown'
            }
          }
        }
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ])
  ]);

  // Combine regular and transportation hotel tracking data
  const combinedHotelTracking = combineHotelTrackingData(hotelTracking, transportationHotelTracking);

  // Combine service booking analysis from regular and transportation bookings
  const combinedServiceBookingAnalysis = [...serviceBookingAnalysis, ...transportationServiceAnalysis];

  // Combine revenue distribution from regular and transportation bookings
  const combinedRevenueDistribution = combineRevenueDistribution(revenueDistribution, transportationRevenueDistribution);

  // Combine processing times from regular and transportation bookings
  const combinedProcessingTimes = [...orderProcessingTimes, ...transportationProcessingTimes];

  // Combine service provider performance from regular and transportation bookings
  const combinedServiceProviderPerformance = [...serviceProviderPerformance, ...transportationServiceProviderPerformance];

  // Format and send response
  res.status(200).json({
    status: 'success',
    data: {
      timeRange: parseInt(timeRange),
      hotelFilter: hotelId || 'all',
      analytics: {
        hotelTracking: combinedHotelTracking,
        serviceBookingAnalysis: combinedServiceBookingAnalysis,
        orderProcessingTimes: combinedProcessingTimes,
        housekeepingIssues,
        revenueDistribution: combinedRevenueDistribution,
        serviceProviderPerformance: combinedServiceProviderPerformance,
        timeBasedAnalytics
      },
      summary: {
        totalHotels: combinedHotelTracking.length,
        totalBookings: combinedHotelTracking.reduce((sum, hotel) => sum + hotel.totalBookings, 0),
        totalRevenue: combinedHotelTracking.reduce((sum, hotel) => sum + hotel.totalRevenue, 0),
        averageProcessingTime: combinedProcessingTimes.length > 0
          ? combinedProcessingTimes.reduce((sum, item) => sum + item.averageProcessingTime, 0) / combinedProcessingTimes.length
          : 0
      }
    }
  });
}));

// Helper function to combine regular and transportation hotel tracking data
function combineHotelTrackingData(regularTracking, transportationTracking) {
  const hotelMap = new Map();

  // Add regular booking data
  regularTracking.forEach(hotel => {
    hotelMap.set(hotel._id.toString(), {
      _id: hotel._id,
      hotelName: hotel.hotelName,
      totalBookings: hotel.totalBookings,
      completedBookings: hotel.completedBookings,
      cancelledBookings: hotel.cancelledBookings,
      totalRevenue: hotel.totalRevenue,
      hotelEarnings: hotel.hotelEarnings,
      providerEarnings: hotel.providerEarnings,
      averageOrderValue: hotel.averageOrderValue,
      uniqueGuestCount: hotel.uniqueGuestCount,
      completionRate: hotel.completionRate,
      cancellationRate: hotel.cancellationRate,
      // Track separate counts for analysis
      regularBookings: hotel.totalBookings,
      transportationBookings: 0
    });
  });

  // Add transportation booking data
  transportationTracking.forEach(hotel => {
    const hotelId = hotel._id.toString();
    const existing = hotelMap.get(hotelId);

    if (existing) {
      // Combine data for existing hotel
      const combinedTotalBookings = existing.totalBookings + hotel.totalBookings;
      const combinedCompletedBookings = existing.completedBookings + hotel.completedBookings;
      const combinedCancelledBookings = existing.cancelledBookings + hotel.cancelledBookings;
      const combinedTotalRevenue = existing.totalRevenue + hotel.totalRevenue;
      const combinedHotelEarnings = existing.hotelEarnings + hotel.hotelEarnings;
      const combinedProviderEarnings = existing.providerEarnings + hotel.providerEarnings;

      hotelMap.set(hotelId, {
        ...existing,
        totalBookings: combinedTotalBookings,
        completedBookings: combinedCompletedBookings,
        cancelledBookings: combinedCancelledBookings,
        totalRevenue: combinedTotalRevenue,
        hotelEarnings: combinedHotelEarnings,
        providerEarnings: combinedProviderEarnings,
        averageOrderValue: combinedTotalRevenue / combinedTotalBookings,
        uniqueGuestCount: Math.max(existing.uniqueGuestCount, hotel.uniqueGuestCount), // Approximate
        completionRate: combinedTotalBookings > 0 ? (combinedCompletedBookings / combinedTotalBookings) * 100 : 0,
        cancellationRate: combinedTotalBookings > 0 ? (combinedCancelledBookings / combinedTotalBookings) * 100 : 0,
        transportationBookings: hotel.totalBookings
      });
    } else {
      // Add new hotel from transportation bookings only
      hotelMap.set(hotelId, {
        _id: hotel._id,
        hotelName: hotel.hotelName,
        totalBookings: hotel.totalBookings,
        completedBookings: hotel.completedBookings,
        cancelledBookings: hotel.cancelledBookings,
        totalRevenue: hotel.totalRevenue,
        hotelEarnings: hotel.hotelEarnings,
        providerEarnings: hotel.providerEarnings,
        averageOrderValue: hotel.averageOrderValue,
        uniqueGuestCount: hotel.uniqueGuestCount,
        completionRate: hotel.completionRate,
        cancellationRate: hotel.cancellationRate,
        regularBookings: 0,
        transportationBookings: hotel.totalBookings
      });
    }
  });

  // Convert map back to array and sort by total revenue
  return Array.from(hotelMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// Helper function to combine regular and transportation revenue distribution data
function combineRevenueDistribution(regularRevenue, transportationRevenue) {
  const revenueMap = new Map();

  // Add regular revenue data
  regularRevenue.forEach(entry => {
    const key = `${entry._id.year}-${entry._id.month}-${entry._id.week}-${entry._id.hotelId}`;
    revenueMap.set(key, {
      _id: entry._id,
      totalRevenue: entry.totalRevenue,
      hotelEarnings: entry.hotelEarnings,
      providerEarnings: entry.providerEarnings,
      totalBookings: entry.totalBookings,
      profitMargin: entry.profitMargin,
      regularRevenue: entry.totalRevenue,
      transportationRevenue: 0
    });
  });

  // Add transportation revenue data
  transportationRevenue.forEach(entry => {
    const key = `${entry._id.year}-${entry._id.month}-${entry._id.week}-${entry._id.hotelId}`;
    const existing = revenueMap.get(key);

    if (existing) {
      // Combine with existing entry
      const combinedRevenue = existing.totalRevenue + entry.totalRevenue;
      const combinedHotelEarnings = existing.hotelEarnings + entry.hotelEarnings;
      const combinedProviderEarnings = existing.providerEarnings + entry.providerEarnings;
      const combinedBookings = existing.totalBookings + entry.totalBookings;

      revenueMap.set(key, {
        ...existing,
        totalRevenue: combinedRevenue,
        hotelEarnings: combinedHotelEarnings,
        providerEarnings: combinedProviderEarnings,
        totalBookings: combinedBookings,
        profitMargin: combinedRevenue > 0 ? (combinedHotelEarnings / combinedRevenue) * 100 : 0,
        transportationRevenue: entry.totalRevenue
      });
    } else {
      // Add new entry for transportation only
      revenueMap.set(key, {
        _id: entry._id,
        totalRevenue: entry.totalRevenue,
        hotelEarnings: entry.hotelEarnings,
        providerEarnings: entry.providerEarnings,
        totalBookings: entry.totalBookings,
        profitMargin: entry.profitMargin,
        regularRevenue: 0,
        transportationRevenue: entry.totalRevenue
      });
    }
  });

  // Convert map back to array and sort
  return Array.from(revenueMap.values()).sort((a, b) => {
    // Sort by year, month, week descending
    if (a._id.year !== b._id.year) return b._id.year - a._id.year;
    if (a._id.month !== b._id.month) return b._id.month - a._id.month;
    return b._id.week - a._id.week;
  });
}

/**
 * @route   GET /api/admin/analytics/export
 * @desc    Export analytics data to CSV
 * @access  Private/SuperHotel
 */
router.get('/analytics/export', protectSuperHotel, catchAsync(async (req, res) => {
  const assignedHotelIds = req.superHotel.assignedHotels.map(hotel => hotel._id);
  const { timeRange = '30', format = 'json' } = req.query;

  // Build date filter
  let dateFilter = {};
  const now = new Date();

  switch (timeRange) {
    case '7':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
      break;
    case '30':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
      break;
    case '90':
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) } };
      break;
    case '365':
      dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
      break;
    default:
      dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
  }

  // Get detailed booking data for export
  const bookingData = await Booking.find({
    hotelId: { $in: assignedHotelIds },
    ...dateFilter
  })
  .populate('hotelId', 'name')
  .populate('serviceProviderId', 'businessName')
  .populate('guestId', 'firstName lastName email')
  .select('bookingNumber status serviceDetails pricing schedule createdAt updatedAt')
  .sort({ createdAt: -1 });

  if (format === 'csv') {
    // Convert to CSV format
    const csv = [
      // CSV Headers
      [
        'Booking Number', 'Hotel', 'Service Provider', 'Guest', 'Service Category',
        'Status', 'Total Amount', 'Hotel Earnings', 'Provider Earnings',
        'Created Date', 'Completed Date', 'Processing Time (hours)'
      ].join(','),
      // CSV Data
      ...bookingData.map(booking => [
        booking.bookingNumber,
        booking.hotelId?.name || 'Unknown',
        booking.serviceProviderId?.businessName || 'Unknown',
        `${booking.guestId?.firstName || ''} ${booking.guestId?.lastName || ''}`.trim(),
        booking.serviceDetails?.category || 'Unknown',
        booking.status,
        booking.pricing?.totalAmount || 0,
        booking.pricing?.hotelEarnings || 0,
        booking.pricing?.providerEarnings || 0,
        booking.createdAt?.toISOString() || '',
        booking.updatedAt?.toISOString() || '',
        booking.updatedAt && booking.createdAt
          ? ((booking.updatedAt - booking.createdAt) / (1000 * 60 * 60)).toFixed(2)
          : ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } else {
    // Return JSON format
    res.status(200).json({
      status: 'success',
      data: {
        timeRange: parseInt(timeRange),
        bookings: bookingData,
        exportedAt: new Date().toISOString(),
        totalRecords: bookingData.length
      }
    });
  }
}));

module.exports = router;
