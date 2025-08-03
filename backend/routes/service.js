/**
 * Service Provider Routes
 *
 * Routes accessible only by service provider users
 * Handles service management, order processing, and earnings tracking
 * Limited to managing their own offerings and viewing their own metrics
 * Cannot create other service providers
 */

const express = require('express');
const { catchAsync, AppError } = require('../middleware/error');
const { protect, restrictTo, restrictToOwnServiceProvider } = require('../middleware/auth');
const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const categoryTemplates = require('../config/categoryTemplates');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('service'));
router.use(restrictToOwnServiceProvider);

/**
 * @route   GET /api/service/dashboard
 * @desc    Get service provider dashboard data
 * @access  Private/ServiceProvider
 */
router.get('/dashboard', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const hotelId = req.user.hotelId;

  // Get service provider and hotel info
  const [
    provider,
    hotel,
    totalServices,
    activeServices,
    totalBookings,
    activeBookings,
    recentBookings,
    revenueStats,
    topServices,
    hotelMarkupSettings
  ] = await Promise.all([
    ServiceProvider.findById(providerId),
    Hotel.findById(hotelId).select('name markupSettings'),    Service.countDocuments({ providerId: providerId }),
    Service.countDocuments({ providerId: providerId, isActive: true, isApproved: true }),
    Booking.countDocuments({ serviceProviderId: providerId }),
    Booking.countDocuments({
      providerId: providerId,
      status: { $nin: ['completed', 'cancelled', 'refunded'] }
    }),
    Booking.find({ serviceProviderId: providerId })
      .sort({ createdAt: -1 })
      .limit(10)      .populate('serviceId', 'name category'),
    Booking.aggregate([
      { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalEarnings: { $sum: '$providerAmount' },
          thisMonthEarnings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $month: '$createdAt' }, { $month: new Date() }] },
                    { $eq: [{ $year: '$createdAt' }, { $year: new Date() }] }
                  ]
                },
                '$providerAmount',
                0
              ]
            }
          },
          averageRating: { $avg: '$rating' }
        }
      }
    ]),
    Service.find({ providerId: providerId, isActive: true })
      .sort({ 'performance.totalBookings': -1 })
      .limit(5)
      .select('name category pricing.basePrice performance'),
    Hotel.findById(hotelId).select('markupSettings')  ]);

  // Get monthly earnings trend
  const monthlyEarnings = await Booking.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        bookings: { $sum: 1 },
        earnings: { $sum: '$providerAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      provider,
      hotel: {
        name: hotel.name,
        markupDefault: hotelMarkupSettings ? hotelMarkupSettings.markupSettings.default : 15,
        markupCategory: provider.category && hotelMarkupSettings &&
          hotelMarkupSettings.markupSettings.categories ?
          hotelMarkupSettings.markupSettings.categories[provider.category] : null
      },
      counts: {
        totalServices,
        activeServices,
        totalBookings,
        activeBookings
      },
      recentBookings,
      metrics: revenueStats.length > 0 ? revenueStats[0] : {
        totalBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        averageRating: 0
      },
      topServices,
      monthlyEarnings
    }
  });
}));

/**
 * @route   GET /api/service/services
 * @desc    Get all services for the provider
 * @access  Private/ServiceProvider
 */
router.get('/services', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Query filters
  const filter = { providerId: providerId };

  if (req.query.status === 'active') {
    filter.isActive = true;
    filter.isApproved = true;
  } else if (req.query.status === 'pending') {
    filter.isApproved = false;
  } else if (req.query.status === 'inactive') {
    filter.isActive = false;
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Get services with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Service.countDocuments(filter)
  ]);

  // Get hotel markup information
  const hotel = await Hotel.findById(req.user.hotelId).select('markupSettings');
  const markupSettings = hotel.markupSettings || { default: 15, categories: {} };

  // Calculate final prices with markup for each service
  const servicesWithMarkup = services.map(service => {
    const serviceObj = service.toObject();
    const categoryMarkup = service.category && markupSettings.categories[service.category] !== undefined
      ? markupSettings.categories[service.category]
      : markupSettings.default;

    serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + categoryMarkup / 100);
    serviceObj.pricing.markupPercentage = categoryMarkup;
    return serviceObj;
  });

  res.status(200).json({
    status: 'success',
    results: services.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: {
      services: servicesWithMarkup,
      markupSettings
    }
  });
}));

/**
 * @route   GET /api/service/services/:id
 * @desc    Get service details
 * @access  Private/ServiceProvider
 */
router.get('/services/:id', catchAsync(async (req, res, next) => {  const providerId = req.user.serviceProviderId;
  const serviceId = req.params.id;

  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId
  });

  if (!service) {
    return next(new AppError('No service found with that ID for this provider', 404));
  }
  // Get booking statistics for this service
  const bookingStats = await Booking.aggregate([
    { $match: { serviceId: new mongoose.Types.ObjectId(serviceId) } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalEarnings: { $sum: '$providerAmount' },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  // Get hotel markup information
  const hotel = await Hotel.findById(req.user.hotelId).select('markupSettings');
  const markupSettings = hotel.markupSettings || { default: 15, categories: {} };

  const categoryMarkup = service.category && markupSettings.categories[service.category] !== undefined
    ? markupSettings.categories[service.category]
    : markupSettings.default;

  const serviceObj = service.toObject();
  serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + categoryMarkup / 100);
  serviceObj.pricing.markupPercentage = categoryMarkup;

  res.status(200).json({
    status: 'success',
    data: {
      service: serviceObj,
      metrics: bookingStats.length > 0 ? bookingStats[0] : {
        totalBookings: 0,
        totalEarnings: 0,
        averageRating: 0
      },
      markup: {
        percentage: categoryMarkup,
        finalPrice: serviceObj.pricing.finalPrice
      }
    }
  });
}));

/**
 * @route   POST /api/service/services
 * @desc    Create a new service
 * @access  Private/ServiceProvider
 */
router.post('/services', catchAsync(async (req, res, next) => {
  const providerId = req.user.serviceProviderId;
  const hotelId = req.user.hotelId;
  // Create service
  const service = await Service.create({
    providerId: providerId,
    hotelId,
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    pricing: {
      basePrice: req.body.basePrice,
      currency: req.body.currency || 'USD'
    },
    duration: req.body.duration,
    images: req.body.images || [],
    availability: req.body.availability || {},
    options: req.body.options || [],    isActive: req.body.isActive || true,
    isApproved: true // Services are automatically approved
  });

  logger.info(`New service created: ${service.name}`, {
    serviceProviderId: providerId,
    serviceId: service._id
  });

  res.status(201).json({
    status: 'success',
    data: { service }
  });
}));

/**
 * @route   PUT /api/service/services/:id
 * @desc    Update service
 * @access  Private/ServiceProvider
 */
router.put('/services/:id', catchAsync(async (req, res, next) => {
  const providerId = req.user.serviceProviderId;
  const serviceId = req.params.id;
  // Find service and make sure it belongs to this provider
  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId
  });

  if (!service) {
    return next(new AppError('No service found with that ID for this provider', 404));
  }

  // Special handling for price changes - these require re-approval
  if (req.body.basePrice && req.body.basePrice !== service.pricing.basePrice) {
    service.isApproved = false;
    service.pricing.basePrice = req.body.basePrice;
  }

  // Update other fields
  ['name', 'description', 'category', 'duration', 'availability', 'options', 'isActive'].forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'availability' || field === 'options') {
        service[field] = req.body[field];
      } else {
        service[field] = req.body[field];
      }
    }
  });

  // Update currency if provided
  if (req.body.currency) {
    service.pricing.currency = req.body.currency;
  }

  // Update images if provided
  if (req.body.images) {
    service.images = req.body.images;
  }

  await service.save();

  logger.info(`Service updated: ${service.name}`, {
    serviceProviderId: providerId,
    serviceId: service._id
  });

  res.status(200).json({
    status: 'success',
    data: { service }
  });
}));



/**
 * @route   GET /api/service/orders
 * @desc    Get all orders (alias for bookings) for the provider
 * @access  Private/ServiceProvider
 */
router.get('/orders', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Query filters
  const filter = { serviceProviderId: providerId };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.fromDate && req.query.toDate) {
    filter['schedule.preferredDate'] = {
      $gte: new Date(req.query.fromDate),
      $lte: new Date(req.query.toDate)
    };
  }

  // Get bookings with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Booking.find(filter)
      .populate('serviceId', 'name category')
      .populate('guestId', 'firstName lastName email')
      .populate('hotelId', 'name')
      .populate('serviceProviderId', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    results: orders.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: orders
  });
}));

/**
 * @route   GET /api/service/bookings/:id
 * @desc    Get booking details
 * @access  Private/ServiceProvider
 */
router.get('/bookings/:id', catchAsync(async (req, res, next) => {
  const providerId = req.user.serviceProviderId;
  const bookingId = req.params.id;

  const booking = await Booking.findOne({
    _id: bookingId,
    serviceProviderId: providerId
  })
    .populate('serviceId', 'name category description')
    .populate('userId', 'firstName lastName email phone')
    .populate('hotelId', 'name address');

  if (!booking) {
    return next(new AppError('No booking found with that ID for this provider', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
}));

/**
 * @route   PUT /api/service/bookings/:id/status
 * @desc    Update booking status
 * @access  Private/ServiceProvider
 */
router.put('/bookings/:id/status', catchAsync(async (req, res, next) => {
  const providerId = req.user.serviceProviderId;
  const bookingId = req.params.id;
  const { status, notes } = req.body;

  if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    serviceProviderId: providerId
  });

  if (!booking) {
    return next(new AppError('No booking found with that ID for this provider', 404));
  }

  // Update booking status
  booking.status = status;

  if (notes) {
    booking.notes = booking.notes || [];
    booking.notes.push({
      content: notes,
      addedBy: req.user.id,
      addedAt: Date.now()
    });
  }

  await booking.save();

  logger.info(`Booking status updated to ${status}`, {
    serviceProviderId: providerId,
    bookingId: booking._id
  });

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
}));

/**
 * @route   PUT /api/service/orders/:id/status
 * @desc    Update order status (alias for bookings status update)
 * @access  Private/ServiceProvider
 */
router.put('/orders/:id/status', catchAsync(async (req, res, next) => {
  const providerId = req.user.serviceProviderId;
  const bookingId = req.params.id;
  const { status, notes } = req.body;

  if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    serviceProviderId: providerId
  });

  if (!booking) {
    return next(new AppError('No order found with that ID for this provider', 404));
  }

  // Update booking status
  booking.status = status;

  if (notes) {
    booking.notes = booking.notes || [];
    booking.notes.push({
      content: notes,
      addedBy: req.user.id,
      addedAt: Date.now()
    });
  }

  await booking.save();

  logger.info(`Order status updated to ${status}`, {
    serviceProviderId: providerId,
    orderId: booking._id
  });

  res.status(200).json({
    success: true,
    data: booking
  });
}));

/**
 * @desc    Get service provider bookings
 * @route   GET /api/service/bookings
 * @access  Private (Service Provider only)
 */
router.get('/bookings', protect, restrictTo('service'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt' } = req.query;

    // Get provider ID from user
    const user = await User.findById(req.user.id).select('serviceProviderId');
    const providerId = user.serviceProviderId;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }

    // Build query
    const query = { serviceProviderId: providerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    // Get bookings with populated guest and service details
    const bookings = await Booking.find(query)
      .populate({
        path: 'guestId',
        select: 'firstName lastName email phone roomNumber checkInDate checkOutDate',
        populate: {
          path: 'selectedHotelId',
          select: 'name address'
        }
      })
      .populate('serviceId', 'name category description')
      .populate('hotelId', 'name address')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments(query);

    // Format booking data for service provider view
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      createdAt: booking.createdAt,
      bookingDate: booking.bookingDate,

      // Guest information
      guest: {
        name: `${booking.guestId?.firstName || ''} ${booking.guestId?.lastName || ''}`.trim(),
        email: booking.guestId?.email,
        phone: booking.guestId?.phone,
        roomNumber: booking.guestId?.roomNumber,
        checkIn: booking.guestId?.checkInDate,
        checkOut: booking.guestId?.checkOutDate,
        hotel: booking.guestId?.selectedHotelId?.name
      },

      // Service information
      service: {
        name: booking.serviceId?.name,
        category: booking.serviceId?.category,
        description: booking.serviceId?.description
      },

      // Booking details
      quantity: booking.bookingConfig?.quantity || 1,
      specialRequests: booking.specialRequests,
      totalAmount: booking.pricing?.totalAmount,
      providerAmount: booking.pricing?.providerAmount,

      // Hotel information
      hotel: {
        name: booking.hotelId?.name,
        address: booking.hotelId?.address
      }
    }));

    res.json({
      success: true,
      data: formattedBookings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: formattedBookings.length,
        totalRecords: total
      }
    });

  } catch (error) {
    logger.error('Get service provider bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Update booking status
 * @route   PATCH /api/service/bookings/:id/status
 * @access  Private (Service Provider only)
 */
router.patch('/bookings/:id/status', protect, restrictTo('service'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const bookingId = req.params.id;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Get provider ID from user
    const user = await User.findById(req.user.id).select('serviceProviderId');
    const providerId = user.serviceProviderId;

    // Find and update booking
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        serviceProviderId: providerId
      },
      {
        status,
        $push: {
          statusHistory: {
            status,
            notes,
            updatedBy: req.user.id,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('guestId', 'firstName lastName email')
     .populate('serviceId', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    // Send notification email to guest
    try {
      const statusMessages = {
        confirmed: 'Your booking has been confirmed!',
        'in-progress': 'Your service is now in progress.',
        completed: 'Your service has been completed. Thank you!',
        cancelled: 'Your booking has been cancelled.'
      };

      if (statusMessages[status]) {
        await sendEmail({
          email: booking.guestId.email,
          subject: `Booking Update - ${booking.serviceId.name}`,
          message: `
            Dear ${booking.guestId.firstName},

            ${statusMessages[status]}

            Booking Details:
            - Service: ${booking.serviceId.name}
            - Booking ID: ${booking.bookingNumber || booking._id}
            - Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
            ${notes ? `- Notes: ${notes}` : ''}

            Best regards,
            Hotel Service Platform
          `
        });
      }
    } catch (emailError) {
      logger.error('Failed to send booking status email', { error: emailError });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking status updated successfully'
    });

  } catch (error) {
    logger.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/service/earnings
 * @desc    Get provider earnings data with breakdown
 * @access  Private/ServiceProvider
 */
router.get('/earnings', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const timeRange = req.query.timeRange || 'month';

  // Define date range based on timeRange parameter
  let startDate = new Date();
  let endDate = new Date();

  switch (timeRange) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);  }

  // Get completed bookings for earnings calculation
  const completedBookings = await Booking.find({
    serviceProviderId: providerId,
    status: 'completed',
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('serviceId', 'name category');

  // Calculate total earnings
  const totalEarnings = completedBookings.reduce((sum, booking) => {return sum + (booking.pricing?.providerEarnings || 0);
  }, 0);

  // Calculate earnings by service category
  const earningsByCategory = {};
  completedBookings.forEach(booking => {
    const category = booking.serviceId?.category || 'other';
    earningsByCategory[category] = (earningsByCategory[category] || 0) + (booking.pricing?.providerEarnings || 0);
  });

  // Get monthly earnings breakdown
  const monthlyEarnings = await Booking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        earnings: { $sum: '$pricing.providerEarnings' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get all-time stats
  const allTimeStats = await Booking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$pricing.providerEarnings' },
        totalBookings: { $sum: 1 }
      }
    }
  ]);

  // Get pending earnings (confirmed but not completed)
  const pendingBookings = await Booking.find({
    serviceProviderId: providerId,
    status: { $in: ['confirmed', 'in-progress'] }
  });
  const pendingEarnings = pendingBookings.reduce((sum, booking) => {
    return sum + (booking.pricing?.providerEarnings || 0);
  }, 0);
  res.status(200).json({
    success: true,
    data: {
      // Frontend expects these specific field names
      availableBalance: Math.round(totalEarnings * 100) / 100,
      monthlyEarnings: Math.round(totalEarnings * 100) / 100,
      yearlyEarnings: allTimeStats.length > 0 ? Math.round(allTimeStats[0].totalEarnings * 100) / 100 : 0,
      totalOrders: allTimeStats.length > 0 ? allTimeStats[0].totalBookings : 0,

      // Additional detailed data
      timeRange,
      period: {
        startDate,
        endDate
      },
      currentPeriod: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalBookings: completedBookings.length,
        averagePerBooking: completedBookings.length > 0 ? Math.round((totalEarnings / completedBookings.length) * 100) / 100 : 0
      },
      allTime: {
        totalEarnings: allTimeStats.length > 0 ? Math.round(allTimeStats[0].totalEarnings * 100) / 100 : 0,
        totalBookings: allTimeStats.length > 0 ? allTimeStats[0].totalBookings : 0
      },
      pending: {
        pendingEarnings: Math.round(pendingEarnings * 100) / 100,
        pendingBookings: pendingBookings.length
      },
      breakdown: {
        byCategory: Object.keys(earningsByCategory).map(category => ({
          category,
          earnings: Math.round(earningsByCategory[category] * 100) / 100
        })),
        monthly: monthlyEarnings.map(month => ({
          year: month._id.year,
          month: month._id.month,
          earnings: Math.round(month.earnings * 100) / 100,
          bookings: month.bookings
        }))
      }
    }
  });
}));

/**
 * @route   GET /api/service/earnings/payouts
 * @desc    Get payout history for service provider
 * @access  Private/ServiceProvider
 */
router.get('/earnings/payouts', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // For now, we'll return a basic payout history
  // In a real application, you would have a Payout model to track actual payouts
  const completedBookings = await Booking.find({
    serviceProviderId: providerId,
    status: 'completed'
  })
  .populate('serviceId', 'name category')
  .populate('hotelId', 'name')
  .sort({ completedAt: -1 })
  .limit(50);

  // Group payouts by month (simulated monthly payouts)
  const payoutHistory = {};
  completedBookings.forEach(booking => {
    const date = new Date(booking.updatedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!payoutHistory[monthKey]) {
      payoutHistory[monthKey] = {
        month: monthKey,
        amount: 0,
        bookings: 0,
        status: 'paid', // In real app, track actual payout status
        paidAt: new Date(date.getFullYear(), date.getMonth() + 1, 15) // Simulate 15th of next month payout
      };
    }

    payoutHistory[monthKey].amount += booking.pricing?.providerEarnings || 0;
    payoutHistory[monthKey].bookings += 1;
  });

  const payouts = Object.values(payoutHistory).map(payout => ({
    ...payout,
    amount: Math.round(payout.amount * 100) / 100
  }));

  // Calculate available balance (completed but not yet paid out)
  const currentMonth = new Date();
  const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const availableBalance = payoutHistory[currentMonthKey]?.amount || 0;

  res.status(200).json({
    success: true,
    data: {
      payouts: payouts.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
      summary: {
        totalPaid: Math.round(payouts.reduce((sum, p) => sum + p.amount, 0) * 100) / 100,
        availableBalance: Math.round(availableBalance * 100) / 100,
        nextPayoutDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 15)
      }
    }
  });
}));

/**
 * @route   POST /api/service/earnings/payouts
 * @desc    Request a payout (manual payout request)
 * @access  Private/ServiceProvider
 */
router.post('/earnings/payouts', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount is required for payout request'
    });
  }

  // Calculate available balance
  const completedBookings = await Booking.find({
    serviceProviderId: providerId,
    status: 'completed'
  });

  const availableBalance = completedBookings.reduce((sum, booking) => {
    return sum + (booking.pricing?.basePrice || 0);
  }, 0);

  if (amount > availableBalance) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Available: $${Math.round(availableBalance * 100) / 100}`
    });
  }

  // In a real application, you would:
  // 1. Create a Payout request record
  // 2. Integrate with payment processor (Stripe, PayPal, etc.)
  // 3. Send notification to admin for approval
  // 4. Update booking records to mark as paid out

  logger.info('Payout requested', {
    serviceProviderId: providerId,
    amount,
    availableBalance
  });

  res.status(200).json({
    success: true,
    message: 'Payout request submitted successfully',
    data: {
      requestedAmount: Math.round(amount * 100) / 100,
      status: 'pending',
      requestedAt: new Date(),
      expectedProcessingTime: '3-5 business days'
    }
  });
}));

/**
 * @route   GET /api/service/metrics
 * @desc    Get metrics and analytics data for service provider
 * @access  Private/ServiceProvider
 */
router.get('/metrics', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Time range filters
  const timeRange = req.query.timeRange || '30days'; // default to last 30 days

  let dateFilter = { serviceProviderId: new mongoose.Types.ObjectId(providerId) };
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

  // Comprehensive metrics
  const [
    bookingSummary,
    servicePerformance,
    dailyBookings,
    ratingBreakdown
  ] = await Promise.all([
    // Overall booking and earnings summary
    Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalEarnings: { $sum: '$providerAmount' },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          totalBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1,
          totalEarnings: 1,
          avgRating: 1,          completionRate: {
            $multiply: [
              { $divide: ['$completedBookings', { $max: ['$totalBookings', 1] }] },
              100
            ]
          }
        }
      }
    ]),

    // Service-specific performance
    Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$serviceId',
          bookings: { $sum: 1 },
          earnings: { $sum: '$providerAmount' },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { earnings: -1 } },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      { $unwind: '$serviceDetails' },
      {        $project: {
          serviceName: '$serviceDetails.name',
          category: '$serviceDetails.category',
          bookings: 1,
          earnings: 1,
          avgRating: 1
        }
      }
    ]),

    // Daily booking trends
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
          earnings: { $sum: '$providerAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }          },
          bookings: 1,
          earnings: 1
        }
      },
      { $sort: { date: 1 } }
    ]),

    // Rating breakdown
    Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          rating: { $exists: true, $ne: null }
        }
      },      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary: bookingSummary[0] || {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalEarnings: 0,
        avgRating: 0,
        completionRate: 0
      },
      servicePerformance,
      dailyBookings,
      ratingBreakdown,
      timeRange
    }
  });
}));

/**
 * @route   GET /api/service/categories
 * @desc    Get available service categories and templates
 * @access  Private/ServiceProvider
 */
router.get('/categories', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Get current provider to check which categories they're already active in
  const provider = await ServiceProvider.findById(providerId).select('categories serviceTemplates');

  res.status(200).json({
    status: 'success',
    data: {
      availableCategories: categoryTemplates,
      activeCategories: provider?.categories || [],
      serviceTemplates: provider?.serviceTemplates || {}
    }
  });
}));

/**
 * @route   POST /api/service/categories/:category/activate
 * @desc    Activate a service category for the provider
 * @access  Private/ServiceProvider
 */
router.post('/categories/:category/activate', catchAsync(async (req, res) => {
  const { category } = req.params;
  const providerId = req.user.serviceProviderId;

  // Validate category
  if (!categoryTemplates[category]) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid service category'
    });
  }

  const provider = await ServiceProvider.findById(providerId);

  // Add category if not already present
  if (!provider.categories.includes(category)) {
    provider.categories.push(category);
  }

  // Activate service template for this category
  if (!provider.serviceTemplates[category]) {
    provider.serviceTemplates[category] = { isActive: true, services: [] };
  } else {
    provider.serviceTemplates[category].isActive = true;
  }

  await provider.save();

  res.status(200).json({
    status: 'success',
    message: `${categoryTemplates[category].name} category activated successfully`,
    data: {
      category: categoryTemplates[category],
      provider: {
        categories: provider.categories,
        serviceTemplates: provider.serviceTemplates
      }
    }
  });
}));

/**
 * @route   POST /api/service/categories/:category/deactivate
 * @desc    Deactivate a service category for the provider
 * @access  Private/ServiceProvider
 */
router.post('/categories/:category/deactivate', catchAsync(async (req, res) => {
  const { category } = req.params;
  const providerId = req.user.serviceProviderId;

  // Validate category
  if (!categoryTemplates[category]) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid service category'
    });
  }

  const provider = await ServiceProvider.findById(providerId);

  // Deactivate service template for this category
  if (provider.serviceTemplates[category]) {
    provider.serviceTemplates[category].isActive = false;
  }

  // Remove category from active categories but keep the template for data preservation
  provider.categories = provider.categories.filter(cat => cat !== category);

  await provider.save();

  res.status(200).json({
    status: 'success',
    message: `${categoryTemplates[category].name} category deactivated successfully`,
    data: {
      category: categoryTemplates[category],
      provider: {
        categories: provider.categories,
        serviceTemplates: provider.serviceTemplates
      }
    }
  });
}));

/**
 * @route   GET /api/service/category-templates/:category
 * @desc    Get category template for a specific category
 * @access  Private/ServiceProvider
 */
router.get('/category-templates/:category', catchAsync(async (req, res) => {
  const { category } = req.params;

  if (!categoryTemplates[category]) {
    return res.status(404).json({
      status: 'fail',
      message: 'Category template not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      template: categoryTemplates[category]
    }
  });
}));

/**
 * @route   GET /api/service/services-by-category/:category
 * @desc    Get all services for a specific category
 * @access  Private/ServiceProvider
 */
router.get('/services-by-category/:category', catchAsync(async (req, res) => {
  const { category } = req.params;
  const providerId = req.user.serviceProviderId;
  // Query filters
  const filter = {
    providerId: providerId,
    category: category
  };

  if (req.query.status === 'active') {
    filter.isActive = true;
    filter.isApproved = true;
  } else if (req.query.status === 'pending') {
    filter.isApproved = false;
  } else if (req.query.status === 'inactive') {
    filter.isActive = false;
  }

  // Get services with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Service.countDocuments(filter)
  ]);

  // Get hotel markup information
  const hotel = await Hotel.findById(req.user.hotelId).select('markupSettings');
  const markupSettings = hotel.markupSettings || { default: 15, categories: {} };

  // Calculate final prices with markup for each service
  const servicesWithMarkup = services.map(service => {
    const serviceObj = service.toObject();
    const categoryMarkup = service.category && markupSettings.categories[service.category] !== undefined
      ? markupSettings.categories[service.category]
      : markupSettings.default;

    serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + categoryMarkup / 100);
    serviceObj.pricing.markupPercentage = categoryMarkup;
    return serviceObj;
  });

  res.status(200).json({
    status: 'success',
    results: services.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: {
      services: servicesWithMarkup,
      category: category,
      categoryTemplate: categoryTemplates[category] || null,
      markupSettings
    }
  });
}));

/**
 * @route   GET /api/service/orders/by-category
 * @desc    Get orders filtered by category
 * @access  Private/ServiceProvider
 */
router.get('/orders/by-category', catchAsync(async (req, res) => {
  const { category, status, page = 1, limit = 20 } = req.query;
  const providerId = req.user.serviceProviderId;

  const skip = (page - 1) * limit;

  // Build query
  const query = { serviceProviderId: providerId };

  if (category && category !== 'all') {
    // Get services for this category
    const categoryServices = await Service.find({
      providerId,
      category,
      isActive: true
    }).select('_id');

    query.serviceId = { $in: categoryServices.map(s => s._id) };
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const [orders, totalCount] = await Promise.all([
    Booking.find(query)
      .populate('serviceId', 'name category pricing')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);
  // Group orders by category for summary
  const categoryStats = await Booking.aggregate([
    { $match: { serviceProviderId: new mongoose.Types.ObjectId(providerId) } },
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
        count: { $sum: 1 },
        totalAmount: { $sum: '$rating' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + orders.length < totalCount,
        hasPrev: page > 1
      },
      categoryStats,
      filters: {
        category: category || 'all',
        status: status || 'all'
      }
    }
  });
}));

/**
 * @route   GET /api/service/analytics/categories
 * @desc    Get analytics data by category
 * @access  Private/ServiceProvider
 */
router.get('/analytics/categories', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { timeRange = '30' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeRange));

  // Get performance by category
  const categoryPerformance = await Booking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
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
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$providerAmount' },
        averageRating: { $avg: '$rating' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        completionRate: {
          $multiply: [
            { $divide: ['$completedOrders', '$totalOrders'] },
            100
          ]
        },
        categoryName: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 'laundry'] }, then: 'Laundry Services' },
              { case: { $eq: ['$_id', 'transportation'] }, then: 'Transportation' },
              { case: { $eq: ['$_id', 'tours'] }, then: 'Tours & Activities' },
              { case: { $eq: ['$_id', 'spa'] }, then: 'Spa & Wellness' },
              { case: { $eq: ['$_id', 'dining'] }, then: 'Dining Services' },
              { case: { $eq: ['$_id', 'entertainment'] }, then: 'Entertainment' },
              { case: { $eq: ['$_id', 'shopping'] }, then: 'Shopping Services' },
              { case: { $eq: ['$_id', 'fitness'] }, then: 'Fitness & Sports' }
            ],
            default: 'Other'
          }
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Get monthly trends by category
  const monthlyTrends = await Booking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
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
        _id: {
          category: '$service.category',
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        dailyOrders: { $sum: 1 },
        dailyRevenue: { $sum: '$providerAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      categoryPerformance,
      monthlyTrends,
      timeRange: parseInt(timeRange),
      totalCategories: categoryPerformance.length
    }
  });
}));

/**
 * @route   POST /api/service/categories/:category/items
 * @desc    Add a new service item to a category (e.g., t-shirt to laundry)
 * @access  Private/ServiceProvider
 */
router.post('/categories/:category/items', catchAsync(async (req, res) => {
  console.log('🔍 ENDPOINT HIT: POST /categories/laundry/items');

  // For service providers, use the serviceProviderId from the populated user
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;
  const hotelId = req.user.hotelId;
  console.log('🔍 Debug - POST /categories/laundry/items received:', {
    userId: req.user._id,
    providerId,
    hotelId,
    userRole: req.user.role,
    body: req.body
  });

  // Validate that the user has a serviceProviderId
  if (!providerId) {
    console.log('❌ Validation failed: User does not have a serviceProviderId');
    return res.status(400).json({
      status: 'fail',
      message: 'User is not associated with a service provider'
    });
  }

  const {
    name,
    description,
    shortDescription,
    laundryItems
  } = req.body;

  // Validation
  if (!name) {
    console.log('❌ Validation failed: Service name is required');
    return res.status(400).json({
      status: 'fail',
      message: 'Service name is required'
    });
  }

  if (!laundryItems || laundryItems.length === 0) {
    console.log('❌ Validation failed: No laundry items provided', { laundryItems });
    return res.status(400).json({
      status: 'fail',
      message: 'At least one laundry item must be provided'
    });
  }
  // Validate individual items and calculate base prices
  const hasValidItems = laundryItems.some(item =>
    item.isAvailable && item.serviceTypes.some(st => st.isAvailable && st.price > 0)
  );

  if (!hasValidItems) {
    console.log('❌ Validation failed: No valid items with pricing', {
      laundryItems,
      hasValidItems
    });
    return res.status(400).json({
      status: 'fail',
      message: 'At least one item must be available with valid pricing'
    });
  }

  // Process laundry items to add base price (lowest service type price)
  const processedLaundryItems = laundryItems.map(item => {
    const validServiceTypes = item.serviceTypes.filter(st => st.isAvailable && st.price > 0);
    const basePrice = validServiceTypes.length > 0
      ? Math.min(...validServiceTypes.map(st => st.price))
      : 0;

    return {
      ...item,
      price: basePrice // Add the required base price field
    };
  });
  // Check if service with same name already exists for this provider
  const existingService = await Service.findOne({
    providerId,
    hotelId,
    category: 'laundry',
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  });

  if (existingService) {
    console.log('❌ Service already exists:', { providerId, hotelId, name });
    return res.status(400).json({
      status: 'fail',
      message: 'A laundry service with this name already exists'
    });
  }
  // Create service with individual items only
  const serviceData = {
    name,
    description: description || `Laundry service`,
    shortDescription: shortDescription || `Laundry service`,
    providerId,
    hotelId,
    category: 'laundry',
    subcategory: 'item_based',
    serviceType: 'laundry_items',    isActive: true,
    isApproved: true, // Automatically approved for immediate availability
    specifications: {
      duration: {
        estimated: 24, // Default 24 hours for laundry
        unit: 'hours'
      }
    },
    pricing: {
      basePrice: 0, // Will be calculated dynamically
      pricingType: 'per-item',
      currency: 'USD'
    },
    laundryItems: processedLaundryItems
  };

  console.log('✅ Creating service with data:', serviceData);

  try {
    const service = await Service.create(serviceData);
    console.log('✅ Service created successfully:', service._id);

    res.status(201).json({
      status: 'success',
      message: 'Laundry service created successfully',
      data: {
        service
      }
    });
  } catch (error) {
    console.log('❌ Service creation failed:', error.message);
    console.log('❌ Service creation error details:', error);

    return res.status(400).json({
      status: 'fail',
      message: `Service creation failed: ${error.message}`,
      details: error.name === 'ValidationError' ? error.errors : undefined
    });
  }
}));

/**
 * @route   PUT /api/service/categories/laundry/items/:serviceId
 * @desc    Update an existing laundry service
 * @access  Private/ServiceProvider
 */
router.put('/categories/laundry/items/:serviceId', catchAsync(async (req, res) => {
  const { serviceId } = req.params;
  const providerId = req.user._id;

  const {
    name,
    description,
    shortDescription,
    selectedItems,
    servicePricing,
    expressSurcharge,
    serviceCombinations
  } = req.body;

  // Find and verify ownership
  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId,
    category: 'laundry'
  });

  if (!service) {
    return res.status(404).json({
      status: 'fail',
      message: 'Laundry service not found'
    });
  }

  // Update service
  service.name = name || service.name;
  service.description = description || service.description;
  service.shortDescription = shortDescription || service.shortDescription;
  service.selectedItems = selectedItems || service.selectedItems;
  service.servicePricing = servicePricing || service.servicePricing;
  service.expressSurcharge = expressSurcharge || service.expressSurcharge;
  service.serviceCombinations = serviceCombinations || service.serviceCombinations;
  service.updatedAt = new Date();

  await service.save();

  res.status(200).json({
    status: 'success',
    message: 'Laundry service updated successfully',
    data: {
      service
    }
  });
}));

/**
 * @route   DELETE /api/service/categories/laundry/items/:serviceId
 * @desc    Delete a laundry service
 * @access  Private/ServiceProvider
 */
router.delete('/categories/laundry/items/:serviceId', catchAsync(async (req, res) => {
  const { serviceId } = req.params;
  const providerId = req.user._id;

  // Find and verify ownership
  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId,
    category: 'laundry'
  });

  if (!service) {
    return res.status(404).json({
      status: 'fail',
      message: 'Laundry service not found'
    });
  }

  // Check if there are any active bookings
  const activeBookings = await Booking.countDocuments({
    serviceId: serviceId,
    status: { $nin: ['completed', 'cancelled', 'refunded'] }
  });

  if (activeBookings > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Cannot delete service with active bookings'
    });
  }

  await Service.findByIdAndDelete(serviceId);

  res.status(200).json({
    status: 'success',
    message: 'Laundry service deleted successfully'  });
}));

module.exports = router;
