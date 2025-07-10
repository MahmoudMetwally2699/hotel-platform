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
    Hotel.findById(hotelId).select('name markupSettings'),
    Service.countDocuments({ serviceProviderId: providerId }),
    Service.countDocuments({ serviceProviderId: providerId, isActive: true, isApproved: true }),
    Booking.countDocuments({ serviceProviderId: providerId }),
    Booking.countDocuments({
      serviceProviderId: providerId,
      status: { $nin: ['completed', 'cancelled', 'refunded'] }
    }),
    Booking.find({ serviceProviderId: providerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('serviceId', 'name category'),
    Booking.aggregate([
      { $match: { serviceProviderId: mongoose.Types.ObjectId(providerId) } },
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
    Service.find({ serviceProviderId: providerId, isActive: true })
      .sort({ 'performance.totalBookings': -1 })
      .limit(5)
      .select('name category pricing.basePrice performance'),
    Hotel.findById(hotelId).select('markupSettings')
  ]);

  // Get monthly earnings trend
  const monthlyEarnings = await Booking.aggregate([
    { $match: { serviceProviderId: mongoose.Types.ObjectId(providerId) } },
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
  const filter = { serviceProviderId: providerId };

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
router.get('/services/:id', catchAsync(async (req, res, next) => {
  const providerId = req.user.serviceProviderId;
  const serviceId = req.params.id;

  const service = await Service.findOne({
    _id: serviceId,
    serviceProviderId: providerId
  });

  if (!service) {
    return next(new AppError('No service found with that ID for this provider', 404));
  }

  // Get booking statistics for this service
  const bookingStats = await Booking.aggregate([
    { $match: { serviceId: mongoose.Types.ObjectId(serviceId) } },
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
    serviceProviderId: providerId,
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
    options: req.body.options || [],
    isActive: req.body.isActive || true,
    isApproved: false // Services require approval before becoming active
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
    serviceProviderId: providerId
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
 * @route   GET /api/service/bookings
 * @desc    Get all bookings for the provider
 * @access  Private/ServiceProvider
 */
router.get('/bookings', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Query filters
  const filter = { serviceProviderId: providerId };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.fromDate && req.query.toDate) {
    filter.bookingDate = {
      $gte: new Date(req.query.fromDate),
      $lte: new Date(req.query.toDate)
    };
  }

  // Get bookings with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('serviceId', 'name category')
      .populate('userId', 'firstName lastName email')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: { bookings }
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
 * @route   GET /api/service/metrics
 * @desc    Get metrics and analytics data for service provider
 * @access  Private/ServiceProvider
 */
router.get('/metrics', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Time range filters
  const timeRange = req.query.timeRange || '30days'; // default to last 30 days

  let dateFilter = { serviceProviderId: mongoose.Types.ObjectId(providerId) };
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
          avgRating: 1,
          completionRate: {
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
      {
        $project: {
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
            }
          },
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
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])
  ]);

  res.status(200).json({    status: 'success',
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
 * @route   GET /api/service/categories/:category/template
 * @desc    Get service template for a specific category
 * @access  Private/ServiceProvider
 */
router.get('/categories/:category/template', catchAsync(async (req, res) => {
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
 * @route   POST /api/service/categories/:category/services
 * @desc    Create services for a specific category
 * @access  Private/ServiceProvider
 */
router.post('/categories/:category/services', catchAsync(async (req, res) => {
  const { category } = req.params;
  const { services } = req.body;
  const providerId = req.user.serviceProviderId;
  const hotelId = req.user.hotelId;

  if (!categoryTemplates[category]) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid service category'
    });
  }

  if (!services || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Services array is required'
    });
  }

  const provider = await ServiceProvider.findById(providerId);

  // Ensure category is activated
  if (!provider.categories.includes(category)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Category must be activated first'
    });
  }

  const createdServices = [];

  // Create services based on category template
  for (const serviceData of services) {
    const service = new Service({
      name: serviceData.name,
      description: serviceData.description || `${serviceData.name} service`,
      providerId,
      hotelId,
      category,
      subcategory: serviceData.subcategory || 'general',
      serviceType: serviceData.serviceType || 'standard',
      serviceCombinations: serviceData.combinations || [],
      pricing: {
        basePrice: serviceData.basePrice,
        currency: 'USD',
        pricingType: serviceData.pricingType || 'fixed',
        minimumCharge: serviceData.minimumCharge || serviceData.basePrice
      },
      availability: {
        isAvailable: true,
        schedule: {
          monday: { isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '18:00', maxBookings: 10 }] },
          tuesday: { isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '18:00', maxBookings: 10 }] },
          wednesday: { isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '18:00', maxBookings: 10 }] },
          thursday: { isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '18:00', maxBookings: 10 }] },
          friday: { isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '18:00', maxBookings: 10 }] },
          saturday: { isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00', maxBookings: 8 }] },
          sunday: { isAvailable: false, timeSlots: [] }
        }
      },
      isActive: true,
      createdBy: req.user._id
    });

    await service.save();
    createdServices.push(service);
  }

  res.status(201).json({
    status: 'success',
    message: `${createdServices.length} services created successfully`,
    data: {
      services: createdServices,
      category: categoryTemplates[category].name
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
    { $match: { serviceProviderId: mongoose.Types.ObjectId(providerId) } },
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
        totalAmount: { $sum: '$totalAmount' },
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
        serviceProviderId: mongoose.Types.ObjectId(providerId),
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
        serviceProviderId: mongoose.Types.ObjectId(providerId),
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

module.exports = router;
