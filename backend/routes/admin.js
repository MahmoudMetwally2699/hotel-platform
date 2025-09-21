/**
 * Super Hotel Routes
 *
 * Routes for super hotel portal at /admin
 * Handles authentication, dashboard, statistics, and analysis for assigned hotels
 */

const express = require('express');
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

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: process.env.NODE_ENV === 'production', // Allow JS access in development for debugging
    secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  console.log('🍪 Setting superHotelJwt cookie with options:', cookieOptions);
  console.log('🍪 Token being set:', token.substring(0, 20) + '...');
  res.cookie('superHotelJwt', token, cookieOptions);

  // Verify cookie was set by checking response headers
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
    httpOnly: true
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

module.exports = router;
