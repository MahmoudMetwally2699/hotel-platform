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
const TransportationBooking = require('../models/TransportationBooking');
const Hotel = require('../models/Hotel');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const {
  sendLaundryServiceCompleted,
  sendHousekeepingServiceCompleted,
  sendHousekeepingServiceStarted,
  sendNewHousekeepingOrderToProvider
} = require('../utils/whatsapp');
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

  // Log the incoming request body for debugging
  console.log('🔵 Creating service with data:', JSON.stringify(req.body, null, 2));

  // Create service with all required fields
  const serviceData = {
    providerId: providerId,
    hotelId,
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    subcategory: req.body.subcategory,
    serviceType: req.body.serviceType,
    pricing: {
      basePrice: req.body.pricing?.basePrice || req.body.basePrice,
      currency: req.body.pricing?.currency || req.body.currency || 'USD',
      pricingType: req.body.pricing?.pricingType || 'per-item'
    },
    specifications: {
      duration: {
        estimated: req.body.specifications?.duration?.estimated || 30,
        unit: req.body.specifications?.duration?.unit || 'minutes'
      }
    },
    duration: req.body.duration,
    images: req.body.images || [],
    availability: req.body.availability || {},
    options: req.body.options || [],
    menuItems: req.body.menuItems || [],
    // Add transportation items for transportation services
    transportationItems: req.body.transportationItems || [],
    // Add laundry items for laundry services
    laundryItems: req.body.laundryItems || [],
    isActive: req.body.isActive || true,
    isApproved: true // Services are automatically approved
  };

  console.log('🟢 Processed service data:', JSON.stringify(serviceData, null, 2));

  const service = await Service.create(serviceData);

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
  ['name', 'description', 'category', 'cuisineType', 'duration', 'availability', 'options', 'isActive', 'menuItems'].forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'availability' || field === 'options' || field === 'menuItems') {
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
 * @route   DELETE /api/service/services/:id
 * @desc    Delete service
 * @access  Private/ServiceProvider
 */
router.delete('/services/:id', catchAsync(async (req, res, next) => {
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

  // Check if service has any active bookings
  const activeBookings = await Booking.findOne({
    serviceId: serviceId,
    status: { $nin: ['completed', 'cancelled', 'refunded'] }
  });

  if (activeBookings) {
    return next(new AppError('Cannot delete service with active bookings', 400));
  }

  await Service.findByIdAndDelete(serviceId);

  logger.info(`Service deleted: ${service.name}`, {
    serviceProviderId: providerId,
    serviceId: serviceId
  });

  res.status(200).json({
    status: 'success',
    message: 'Service deleted successfully'
  });
}));

/**
 * @route   PATCH /api/service/services/:id/toggle-availability
 * @desc    Toggle service availability (active/inactive)
 * @access  Private/ServiceProvider
 */
router.patch('/services/:id/toggle-availability', catchAsync(async (req, res, next) => {
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

  // Toggle the isActive status
  service.isActive = !service.isActive;
  await service.save();

  logger.info(`Service availability toggled: ${service.name} - ${service.isActive ? 'Active' : 'Inactive'}`, {
    serviceProviderId: providerId,
    serviceId: service._id,
    isActive: service.isActive
  });

  res.status(200).json({
    status: 'success',
    data: {
      service: {
        _id: service._id,
        name: service.name,
        isActive: service.isActive
      }
    },
    message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`
  });
}));

/**
 * @route   GET /api/service/orders
 * @desc    Get all orders (alias for bookings) for the provider
 * @access  Private/ServiceProvider
 */
router.get('/orders', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;

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

  // Get bookings without pagination limit - fetch all orders
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 999999; // Fetch all orders by default
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

    // Send WhatsApp notification for completed services
    try {
      if (status === 'completed' && booking.guestId.phone) {
        await sendLaundryServiceCompleted({
          guestName: `${booking.guestId.firstName} ${booking.guestId.lastName || ''}`,
          guestPhone: booking.guestId.phone,
          bookingNumber: booking.bookingNumber || booking._id,
          serviceProviderName: req.user.serviceProvider?.businessName || 'مقدم الخدمة',
          deliveryDate: new Date().toLocaleDateString('ar-EG'),
          deliveryTime: new Date().toLocaleTimeString('ar-EG'),
          roomNumber: booking.roomNumber || 'غير محدد'
        });
        logger.info('WhatsApp service completion notification sent to guest', {
          bookingId: booking._id,
          guestPhone: booking.guestId.phone
        });
      }
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp completion notification', {
        error: whatsappError.message,
        bookingId: booking._id
      });
      // Don't fail the status update if WhatsApp fails
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

  // Calculate earnings by service category with counts and averages
  const earningsByCategory = {};
  const ordersByCategory = {};

  completedBookings.forEach(booking => {
    const category = booking.serviceId?.category || 'other';
    const earnings = booking.pricing?.providerEarnings || 0;

    earningsByCategory[category] = (earningsByCategory[category] || 0) + earnings;
    ordersByCategory[category] = (ordersByCategory[category] || 0) + 1;
  });

  // Create comprehensive category breakdown
  const categoryBreakdown = Object.keys(earningsByCategory).map(category => ({
    category,
    earnings: Math.round(earningsByCategory[category] * 100) / 100,
    totalBookings: ordersByCategory[category] || 0,
    averagePerBooking: ordersByCategory[category] > 0
      ? Math.round((earningsByCategory[category] / ordersByCategory[category]) * 100) / 100
      : 0
  }));

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
        byCategory: categoryBreakdown,
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
 * @route   GET /api/service/analytics/categories
 * @desc    Get detailed analytics for each service category
 * @access  Private/ServiceProvider
 */
router.get('/analytics/categories', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;
  const timeRange = req.query.timeRange || 'month';

  console.log('🔍 Provider ID:', providerId);
  console.log('🔍 Time Range:', timeRange);

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
      startDate.setMonth(startDate.getMonth() - 1);
  }

  console.log('🔍 Category Analytics - Provider ID:', providerId);
  console.log('🔍 Category Analytics - Time Range:', { startDate, endDate });

  // Get regular booking analytics
  const regularBookingAnalytics = await Booking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
        status: 'completed'
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
    {
      $unwind: {
        path: '$service',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        effectiveCategory: {
          $ifNull: ['$service.category', '$serviceType']
        }
      }
    },
    {
      $group: {
        _id: '$effectiveCategory',
        allTimeEarnings: { $sum: '$pricing.providerEarnings' },
        allTimeOrders: { $sum: 1 },
        currentPeriodEarnings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startDate] },
                  { $lte: ['$createdAt', endDate] }
                ]
              },
              '$pricing.providerEarnings',
              0
            ]
          }
        },
        currentPeriodOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startDate] },
                  { $lte: ['$createdAt', endDate] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Get transportation booking analytics
  const transportationAnalytics = await TransportationBooking.aggregate([
    {
      $match: {
        serviceProviderId: new mongoose.Types.ObjectId(providerId),
        bookingStatus: 'payment_completed' // Use the correct status for completed transportation bookings
      }
    },
    {
      $group: {
        _id: 'transportation',
        allTimeEarnings: { $sum: '$payment.breakdown.serviceProviderAmount' },
        allTimeOrders: { $sum: 1 },
        currentPeriodEarnings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startDate] },
                  { $lte: ['$createdAt', endDate] }
                ]
              },
              '$payment.breakdown.serviceProviderAmount',
              0
            ]
          }
        },
        currentPeriodOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startDate] },
                  { $lte: ['$createdAt', endDate] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Combine analytics from both sources
  const combinedAnalytics = [...regularBookingAnalytics, ...transportationAnalytics];

  // Process and format the combined data
  const categoryAnalytics = combinedAnalytics.map(item => ({
    category: item._id,
    allTime: {
      totalEarnings: Math.round((item.allTimeEarnings || 0) * 100) / 100,
      totalOrders: item.allTimeOrders || 0,
      averagePerOrder: item.allTimeOrders > 0
        ? Math.round(((item.allTimeEarnings || 0) / item.allTimeOrders) * 100) / 100
        : 0
    },
    currentPeriod: {
      totalEarnings: Math.round((item.currentPeriodEarnings || 0) * 100) / 100,
      totalOrders: item.currentPeriodOrders || 0,
      averagePerOrder: item.currentPeriodOrders > 0
        ? Math.round(((item.currentPeriodEarnings || 0) / item.currentPeriodOrders) * 100) / 100
        : 0
    }
  }));

  // Ensure all main categories are included (even with zero values)
  const mainCategories = ['transportation', 'laundry', 'housekeeping', 'dining', 'restaurant'];
  const completeAnalytics = mainCategories.map(category => {
    const existing = categoryAnalytics.find(item =>
      item.category && (
        item.category.toLowerCase() === category.toLowerCase() ||
        (category === 'restaurant' && item.category.toLowerCase() === 'dining') ||
        (category === 'dining' && item.category.toLowerCase() === 'restaurant')
      )
    );

    return existing || {
      category,
      allTime: {
        totalEarnings: 0,
        totalOrders: 0,
        averagePerOrder: 0
      },
      currentPeriod: {
        totalEarnings: 0,
        totalOrders: 0,
        averagePerOrder: 0
      }
    };
  });

  res.status(200).json({
    success: true,
    data: {
      timeRange,
      period: {
        startDate,
        endDate
      },
      categories: completeAnalytics
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
 * @desc    Get available service categories and templates (only those enabled by hotel admin)
 * @access  Private/ServiceProvider
 */
router.get('/categories', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  // Get current provider to check which categories they're allowed to use
  const provider = await ServiceProvider.findById(providerId).select('categories serviceTemplates');

  if (!provider) {
    return res.status(404).json({
      status: 'fail',
      message: 'Service provider not found'
    });
  }

  // Filter available categories to only include those enabled by hotel admin
  const allowedCategories = provider.categories || [];
  const availableCategories = {};

  allowedCategories.forEach(categoryKey => {
    if (categoryTemplates[categoryKey]) {
      availableCategories[categoryKey] = categoryTemplates[categoryKey];
    }
  });

  // Get currently active categories (those that provider has activated)
  const activeCategories = [];
  if (provider.serviceTemplates) {
    Object.keys(provider.serviceTemplates).forEach(categoryKey => {
      if (provider.serviceTemplates[categoryKey] && provider.serviceTemplates[categoryKey].isActive) {
        activeCategories.push(categoryKey);
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      availableCategories: availableCategories,
      activeCategories: activeCategories,
      serviceTemplates: provider?.serviceTemplates || {},
      message: allowedCategories.length === 0
        ? 'No service categories are currently enabled for your account. Please contact your hotel admin.'
        : undefined
    }
  });
}));

/**
 * @route   POST /api/service/categories/:category/activate
 * @desc    Activate a service category for the provider (only if allowed by hotel admin)
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
  if (!provider) {
    return res.status(404).json({
      status: 'fail',
      message: 'Service provider not found'
    });
  }

  // Check if hotel admin has enabled this category for the provider
  const isAllowedCategory = provider.categories && provider.categories.includes(category);

  if (!isAllowedCategory) {
    return res.status(403).json({
      status: 'fail',
      message: `You are not authorized to activate ${categoryTemplates[category].name}. Please contact your hotel admin to enable this service category.`
    });
  }

  // Check if service template exists and if it's active
  if (!provider.serviceTemplates[category]) {
    return res.status(403).json({
      status: 'fail',
      message: `${categoryTemplates[category].name} category is not available for your account. Please contact your hotel admin.`
    });
  }

  // Activate service template for this category
  provider.serviceTemplates[category].isActive = true;

  // Ensure expiry dates are in the future before saving (fix legacy data)
  const now = new Date();
  const futureDate = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000); // 366 days from now

  if (provider.businessLicense && provider.businessLicense.expiryDate <= now) {
    provider.businessLicense.expiryDate = futureDate;
  }

  if (provider.insurance && provider.insurance.expiryDate <= now) {
    provider.insurance.expiryDate = futureDate;
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

  // Ensure expiry dates are in the future before saving (fix legacy data)
  const now = new Date();
  const futureDate = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000); // 366 days from now

  if (provider.businessLicense && provider.businessLicense.expiryDate <= now) {
    provider.businessLicense.expiryDate = futureDate;
  }

  if (provider.insurance && provider.insurance.expiryDate <= now) {
    provider.insurance.expiryDate = futureDate;
  }

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
      currency: 'EGP'
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

/**
 * @route   POST /api/service/categories/transportation/vehicles
 * @desc    Add a new transportation service with vehicles
 * @access  Private/ServiceProvider
 */
router.post('/categories/transportation/vehicles', catchAsync(async (req, res) => {
  console.log('🚗 ENDPOINT HIT: POST /categories/transportation/vehicles');

  // For service providers, use the serviceProviderId from the populated user
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;
  const hotelId = req.user.hotelId;
  console.log('🚗 Debug - POST /categories/transportation/vehicles received:', {
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
    transportationItems
  } = req.body;

  // Validation
  if (!name) {
    console.log('❌ Validation failed: Service name is required');
    return res.status(400).json({
      status: 'fail',
      message: 'Service name is required'
    });
  }

  if (!transportationItems || transportationItems.length === 0) {
    console.log('❌ Validation failed: No transportation vehicles provided', { transportationItems });
    return res.status(400).json({
      status: 'fail',
      message: 'At least one transportation vehicle must be provided'
    });
  }
  // Validate individual vehicles - transportation items don't need service types with pricing
  // They are just vehicle specifications, pricing is handled at the service level
  const hasValidVehicles = transportationItems.some(vehicle => {
    const hasBasicInfo = vehicle.isAvailable && vehicle.vehicleType;
    const hasCapacity = vehicle.capacity && vehicle.capacity.passengers > 0;
    return hasBasicInfo && hasCapacity;
  });

  if (!hasValidVehicles) {
    console.log('❌ Validation failed: No valid vehicles provided', {
      transportationItems,
      hasValidVehicles,
      sampleVehicle: transportationItems[0],
      detailedCheck: transportationItems.map(v => ({
        isAvailable: v.isAvailable,
        vehicleType: v.vehicleType,
        hasCapacity: !!v.capacity,
        passengers: v.capacity?.passengers,
        validationResult: v.isAvailable && v.vehicleType && v.capacity && v.capacity.passengers > 0
      }))
    });
    return res.status(400).json({
      status: 'fail',
      message: 'At least one vehicle must be available with valid specifications (vehicle type and passenger capacity required)'
    });
  }

  try {
    // Check if the service provider already has a transportation service for this hotel
    const existingService = await Service.findOne({
      providerId: providerId,
      hotelId: hotelId,
      category: 'transportation',
      isActive: true
    });

    let service;    if (existingService) {
      console.log('🔄 Updating existing transportation service:', existingService._id);
      // Update existing service
      existingService.name = name;
      existingService.description = description;
      existingService.shortDescription = shortDescription;
      existingService.transportationItems = transportationItems;
      existingService.updatedAt = new Date();

      service = await existingService.save();
    } else {
      console.log('➕ Creating new transportation service');
      // Create new service with all required fields
      service = new Service({
        name,
        description,
        shortDescription,
        category: 'transportation',
        subcategory: 'vehicle_rental', // Required field
        serviceType: 'vehicle_service', // Required field
        providerId: providerId,
        hotelId: hotelId,
        transportationItems: transportationItems,

        // Required pricing fields (set defaults)
        pricing: {
          basePrice: 25, // Default base price, will be overridden by individual vehicle pricing
          pricingType: 'per-item', // Transportation is priced per vehicle/service
          currency: 'EGP'
        },

        // Required specifications fields
        specifications: {
          duration: {
            estimated: 120, // Default 2 hours
            unit: 'minutes'
          },
          capacity: {
            maxPeople: 8, // Maximum capacity across all vehicles
            maxDistance: 1000 // Maximum distance in km
          },
          inclusions: ['Driver', 'Fuel', 'Insurance'],
          exclusions: ['Tolls', 'Parking fees', 'Food']
        },

        // Availability settings
        availability: {
          isAvailable: true,
          schedule: {
            monday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] },
            tuesday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] },
            wednesday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] },
            thursday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] },
            friday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] },
            saturday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] },
            sunday: { isAvailable: true, timeSlots: [{ startTime: '06:00', endTime: '23:00', maxBookings: 10 }] }
          }
        },

        // Delivery/Pickup settings for transportation
        delivery: {
          isPickupAvailable: true,
          isDeliveryAvailable: true,
          pickupCharge: 0,
          deliveryCharge: 0,
          deliveryRadius: 50, // 50km radius
          estimatedPickupTime: 15, // 15 minutes
          estimatedDeliveryTime: 15
        },

        isActive: true,
        isApproved: true, // Automatically approved for immediate availability
        createdAt: new Date(),
        updatedAt: new Date()
      });

      service = await service.save();
    }

    console.log('✅ Transportation service saved successfully:', service._id);

    res.status(200).json({
      status: 'success',
      message: existingService ? 'Transportation service updated successfully' : 'Transportation service created successfully',
      data: {
        service
      }
    });

  } catch (error) {
    console.error('❌ Error saving transportation service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save transportation service',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/service/categories/transportation/vehicles
 * @desc    Get transportation service with vehicles for the service provider
 * @access  Private/ServiceProvider
 */
router.get('/categories/transportation/vehicles', catchAsync(async (req, res) => {
  console.log('🚗 ENDPOINT HIT: GET /categories/transportation/vehicles');

  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;
  const hotelId = req.user.hotelId;

  console.log('🚗 Debug - GET /categories/transportation/vehicles:', {
    providerId,
    hotelId,
    userRole: req.user.role
  });

  if (!providerId) {
    return res.status(400).json({
      status: 'fail',
      message: 'User is not associated with a service provider'
    });
  }

  try {
    // Get transportation service for this provider and hotel
    const service = await Service.findOne({
      providerId: providerId,
      hotelId: hotelId,
      category: 'transportation',
      isActive: true
    }).populate('providerId', 'businessName contactEmail phone');

    if (!service) {
      console.log('📋 No transportation service found, returning empty service with templates');

      // Get transportation templates for initialization
      const templates = categoryTemplates.transportation;

      return res.status(200).json({
        status: 'success',
        data: {
          service: null,
          templates: templates,
          message: 'No transportation service found. Use templates to create one.'
        }
      });
    }

    console.log('✅ Transportation service found:', service._id, 'with', service.transportationItems?.length || 0, 'vehicles');

    res.status(200).json({
      status: 'success',
      data: {
        service,
        templates: categoryTemplates.transportation
      }
    });

  } catch (error) {
    console.error('❌ Error fetching transportation service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transportation service',
      error: error.message
    });
  }
}));

/**
 * @route   PUT /api/service/categories/transportation/vehicles/:serviceId
 * @desc    Update a transportation service
 * @access  Private/ServiceProvider
 */
router.put('/categories/transportation/vehicles/:serviceId', catchAsync(async (req, res) => {
  const { serviceId } = req.params;
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;

  const {
    name,
    description,
    shortDescription,
    transportationItems
  } = req.body;

  // Find and verify ownership
  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId,
    category: 'transportation'
  });

  if (!service) {
    return res.status(404).json({
      status: 'fail',
      message: 'Transportation service not found'
    });
  }

  // Update service
  service.name = name || service.name;
  service.description = description || service.description;
  service.shortDescription = shortDescription || service.shortDescription;
  service.transportationItems = transportationItems || service.transportationItems;
  service.updatedAt = new Date();

  await service.save();

  res.status(200).json({
    status: 'success',
    message: 'Transportation service updated successfully',
    data: {
      service
    }
  });
}));

/**
 * @route   DELETE /api/service/categories/transportation/vehicles/:serviceId
 * @desc    Delete a transportation service
 * @access  Private/ServiceProvider
 */
router.delete('/categories/transportation/vehicles/:serviceId', catchAsync(async (req, res) => {
  const { serviceId } = req.params;
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;

  // Find and verify ownership
  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId,
    category: 'transportation'
  });

  if (!service) {
    return res.status(404).json({
      status: 'fail',
      message: 'Transportation service not found'
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
    message: 'Transportation service deleted successfully'
  });
}));

/**
 * @route   GET /api/service/inside-services
 * @desc    Get service provider's inside services (services provided within hotel premises, only those enabled by hotel admin)
 * @access  Private/ServiceProvider
 */
router.get('/inside-services', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  const provider = await ServiceProvider.findById(providerId);

  if (!provider) {
    return res.status(404).json({
      status: 'fail',
      message: 'Service provider not found'
    });
  }

  // Check which categories hotel admin has enabled for this provider
  const allowedCategories = provider.categories || [];

  // Default inside services categories with mapping to main categories
  const defaultServices = [
    {
      id: 'hotel-restaurant',
      name: 'Hotel Restaurant',
      description: 'Main dining facilities and reservations',
      category: 'dining',
      requiredMainCategory: 'dining', // Maps to main dining category
      isActive: false,
      operatingHours: { start: '07:00', end: '22:00' },
      features: ['Table reservations', 'Private dining', 'Event catering']
    },
    {
      id: 'housekeeping-requests',
      name: 'Housekeeping Services',
      description: 'Room cleaning and maintenance requests',
      category: 'maintenance',
      requiredMainCategory: 'housekeeping', // Maps to main housekeeping category
      isActive: false,
      operatingHours: { start: '08:00', end: '18:00' },
      features: ['Extra cleaning', 'Amenity requests', 'Maintenance issues']
    }
  ];

  // Filter services based on hotel admin's category restrictions
  const filteredServices = defaultServices.filter(service => {
    // If no specific main category required, allow if provider has any category enabled
    if (!service.requiredMainCategory) {
      return allowedCategories.length > 0;
    }
    // Check if hotel admin has enabled the required main category
    return allowedCategories.includes(service.requiredMainCategory);
  });

  // Initialize insideServices if it doesn't exist or filter existing ones
  if (!provider.insideServices || provider.insideServices.length === 0) {
    // Use findByIdAndUpdate to avoid triggering full validation
    await ServiceProvider.findByIdAndUpdate(
      providerId,
      { insideServices: filteredServices },
      { new: false, runValidators: false }
    );
    provider.insideServices = filteredServices;
  } else {
    // Filter existing services based on admin permissions and update with filtered services
    const allowedServiceIds = filteredServices.map(s => s.id);
    const existingAllowedServices = provider.insideServices.filter(s => allowedServiceIds.includes(s.id));

    // Merge with defaults to ensure all allowed categories exist
    const existingServiceIds = existingAllowedServices.map(s => s.id);
    const missingServices = filteredServices.filter(s => !existingServiceIds.includes(s.id));

    let updatedInsideServices;
    if (missingServices.length > 0) {
      updatedInsideServices = [...existingAllowedServices, ...missingServices];
    } else {
      updatedInsideServices = existingAllowedServices;
    }

    // Use findByIdAndUpdate to avoid triggering full validation
    await ServiceProvider.findByIdAndUpdate(
      providerId,
      { insideServices: updatedInsideServices },
      { new: false, runValidators: false }
    );
    provider.insideServices = updatedInsideServices;
  }

  res.status(200).json({
    status: 'success',
    data: provider.insideServices,
    message: filteredServices.length === 0
      ? 'No inside hotel services are currently enabled for your account. Please contact your hotel admin to enable the required service categories.'
      : undefined
  });
}));

/**
 * @route   POST /api/service/inside-services/:serviceId/activate
 * @desc    Activate an inside service for service provider (only if allowed by hotel admin)
 * @access  Private/ServiceProvider
 */
router.post('/inside-services/:serviceId/activate', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { serviceId } = req.params;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw new AppError('Service provider not found', 404);
  }

  // Check which categories hotel admin has enabled for this provider
  const allowedCategories = provider.categories || [];

  // Service to main category mapping
  const serviceToMainCategory = {
    'hotel-restaurant': 'dining',
    'housekeeping-requests': 'housekeeping'
  };  const requiredMainCategory = serviceToMainCategory[serviceId];

  // Check authorization
  if (requiredMainCategory && !allowedCategories.includes(requiredMainCategory)) {
    return res.status(403).json({
      status: 'fail',
      message: `You are not authorized to activate this service. Please contact your hotel admin to enable the ${requiredMainCategory} service category.`
    });
  }

  // Initialize insideServices if it doesn't exist
  if (!provider.insideServices) {
    provider.insideServices = [];
  }

  // Find and activate the service
  const serviceIndex = provider.insideServices.findIndex(service => service.id === serviceId);
  if (serviceIndex !== -1) {
    provider.insideServices[serviceIndex].isActive = true;
  } else {
    // Add new service if it doesn't exist
    provider.insideServices.push({
      id: serviceId,
      isActive: true
    });
  }

  await provider.save();

  res.status(200).json({
    status: 'success',
    message: 'Service activated successfully'
  });
}));

/**
 * @route   POST /api/service/inside-services/:serviceId/deactivate
 * @desc    Deactivate an inside service for service provider
 * @access  Private/ServiceProvider
 */
router.post('/inside-services/:serviceId/deactivate', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { serviceId } = req.params;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw new AppError('Service provider not found', 404);
  }

  // Find and deactivate the service
  if (provider.insideServices) {
    const serviceIndex = provider.insideServices.findIndex(service => service.id === serviceId);
    if (serviceIndex !== -1) {
      provider.insideServices[serviceIndex].isActive = false;
      await provider.save();
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Service deactivated successfully'
  });
}));

/**
 * @route   POST /api/service/inside-services
 * @desc    Create a new inside service for service provider
 * @access  Private/ServiceProvider
 */
router.post('/inside-services', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { name, description, category, operatingHours, features } = req.body;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw new AppError('Service provider not found', 404);
  }

  // Initialize insideServices if it doesn't exist
  if (!provider.insideServices) {
    provider.insideServices = [];
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

  provider.insideServices.push(newService);
  await provider.save();

  res.status(201).json({
    status: 'success',
    data: newService,
    message: 'Service created successfully'
  });
}));

/**
 * Housekeeping Services Management Routes
 */

/**
 * @route   GET /api/service/housekeeping-services
 * @desc    Get all housekeeping services for the service provider
 * @access  Private/ServiceProvider
 */
router.get('/housekeeping-services', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    return res.status(404).json({
      status: 'error',
      message: 'Service provider not found'
    });
  }

  // Get housekeeping services from Service collection
  const housekeepingServices = await Service.find({
    providerId: providerId,
    category: 'housekeeping',
    isActive: true
  }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: housekeepingServices
  });
}));

/**
 * @route   POST /api/service/housekeeping-services
 * @desc    Create a new housekeeping service
 * @access  Private/ServiceProvider
 */
router.post('/housekeeping-services', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const hotelId = req.user.hotelId;
  const { name, description, category, estimatedDuration, availability, requirements, instructions, basePrice } = req.body;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    return res.status(404).json({
      status: 'error',
      message: 'Service provider not found'
    });
  }

  // Create proper Service document for housekeeping services
  const serviceData = {
    providerId: providerId,
    hotelId: hotelId,
    name: name,
    description: description || 'Housekeeping service',
    category: 'housekeeping',
    subcategory: category || 'cleaning',
    serviceType: 'housekeeping',
    pricing: {
      basePrice: basePrice || 0,
      currency: 'EGP',
      pricingType: 'per-service'
    },
    specifications: {
      duration: {
        estimated: estimatedDuration || 30,
        unit: 'minutes'
      },
      requirements: requirements || [],
      instructions: instructions || ''
    },
    availability: {
      isAvailable: true,
      schedule: {
        monday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00', maxBookings: 10 }] },
        tuesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00', maxBookings: 10 }] },
        wednesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00', maxBookings: 10 }] },
        thursday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00', maxBookings: 10 }] },
        friday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00', maxBookings: 10 }] },
        saturday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00', maxBookings: 10 }] },
        sunday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '16:00', maxBookings: 5 }] }
      }
    },
    isActive: true,
    isApproved: true, // Auto-approve housekeeping services
    moderationStatus: 'approved'
  };

  const service = await Service.create(serviceData);

  logger.info(`New housekeeping service created: ${service.name}`, {
    serviceProviderId: providerId,
    serviceId: service._id,
    hotelId: hotelId
  });

  res.status(201).json({
    status: 'success',
    data: { service },
    message: 'Housekeeping service created successfully'
  });
}));

/**
 * @route   POST /api/service/housekeeping-services/:serviceId/activate
 * @desc    Activate a housekeeping service
 * @access  Private/ServiceProvider
 */
router.post('/housekeeping-services/:serviceId/activate', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { serviceId } = req.params;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    return res.status(404).json({
      status: 'error',
      message: 'Service provider not found'
    });
  }

  // Initialize housekeeping services if not exists
  if (!provider.housekeepingServices) {
    provider.housekeepingServices = [];
  }

  // Find and activate the service
  const serviceIndex = provider.housekeepingServices.findIndex(service => service.id === serviceId);
  if (serviceIndex !== -1) {
    provider.housekeepingServices[serviceIndex].isActive = true;
    await provider.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Service activated successfully'
  });
}));

/**
 * @route   POST /api/service/housekeeping-services/:serviceId/deactivate
 * @desc    Deactivate a housekeeping service
 * @access  Private/ServiceProvider
 */
router.post('/housekeeping-services/:serviceId/deactivate', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId;
  const { serviceId } = req.params;

  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    return res.status(404).json({
      status: 'error',
      message: 'Service provider not found'
    });
  }

  // Initialize housekeeping services if not exists
  if (!provider.housekeepingServices) {
    provider.housekeepingServices = [];
  }

  // Find and deactivate the service
  const serviceIndex = provider.housekeepingServices.findIndex(service => service.id === serviceId);
  if (serviceIndex !== -1) {
    provider.housekeepingServices[serviceIndex].isActive = false;
    await provider.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Service deactivated successfully'
  });
}));

/**
 * @route   DELETE /api/service/housekeeping-services/:serviceId
 * @desc    Delete a housekeeping service
 * @access  Private/ServiceProvider
 */
router.delete('/housekeeping-services/:serviceId', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;
  const { serviceId } = req.params;

  logger.info(`Delete housekeeping service request: ${serviceId} by provider: ${providerId}`);

  // Only work with the Services collection (newer system)
  const service = await Service.findOne({
    _id: serviceId,
    providerId: providerId,
    category: 'housekeeping'
  });

  if (!service) {
    return res.status(404).json({
      status: 'error',
      message: 'Service not found'
    });
  }

  // Check for active bookings
  const activeBookings = await Booking.countDocuments({
    serviceId: serviceId,
    status: { $nin: ['completed', 'cancelled', 'refunded'] }
  });

  if (activeBookings > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete service with active bookings'
    });
  }

  // Delete from Services collection
  await Service.findByIdAndDelete(serviceId);
  logger.info(`Housekeeping service deleted successfully: ${serviceId}`);

  res.status(200).json({
    status: 'success',
    message: 'Service deleted successfully'
  });
}));

/**
 * @route   GET /api/service/housekeeping-bookings
 * @desc    Get housekeeping service bookings for the service provider
 * @access  Private/ServiceProvider
 */
router.get('/housekeeping-bookings', catchAsync(async (req, res) => {
  const providerId = req.user.serviceProviderId?._id || req.user.serviceProviderId;
  const hotelId = req.user.hotelId;
  const { status, limit = 50, page = 1 } = req.query;

  console.log('🔧 Housekeeping bookings query - hotelId:', hotelId);
  console.log('🔧 Housekeeping bookings query - providerId:', providerId);

  let query = {
    serviceType: 'housekeeping',
    serviceProviderId: providerId  // ✅ FIXED: Filter by service provider, not hotel
  };

  if (status) {
    query.status = status;
  }

  console.log('🔧 Housekeeping bookings query:', query);

  const bookings = await Booking.find(query)
    .sort({ bookingDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('hotelId', 'name location')
    .populate('hotel', 'name location')
    .lean();

  const totalBookings = await Booking.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    totalBookings,
    totalPages: Math.ceil(totalBookings / limit),
    currentPage: page,
    data: bookings
  });
}));

/**
 * @route   PUT /api/service/housekeeping-bookings/:bookingId/status
 * @desc    Update housekeeping booking status
 * @access  Private/ServiceProvider
 */
router.put('/housekeeping-bookings/:bookingId/status', catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { status, notes } = req.body;
  const hotelId = req.user.hotelId;

  const booking = await Booking.findOne({
    _id: bookingId,
    serviceType: 'housekeeping',
    hotelId: hotelId
  });

  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }

  const oldStatus = booking.status;
  booking.status = status;
  booking.statusHistory = booking.statusHistory || [];
  booking.statusHistory.push({
    status,
    timestamp: new Date(),
    notes: notes || `Status changed from ${oldStatus} to ${status}`
  });

  if (status === 'completed') {
    booking.completedAt = new Date();
  }

  await booking.save();

  // Send WhatsApp notifications based on status change
  if (booking.guestDetails?.phone) {
    try {
      let whatsappPromise = null;
      const currentTime = new Date().toLocaleString('ar-SA');
      const currentDate = new Date().toLocaleDateString('ar-SA');

      if (status === 'in-progress' || status === 'confirmed') {
        // Service started notification
        whatsappPromise = sendHousekeepingServiceStarted({
          guestName: booking.guestDetails.firstName + ' ' + (booking.guestDetails.lastName || ''),
          guestPhone: booking.guestDetails.phone,
          bookingNumber: booking._id.toString(),
          serviceType: booking.serviceName || 'خدمة التدبير المنزلي',
          startTime: currentTime,
          roomNumber: booking.guestDetails.roomNumber || 'غير محدد',
          estimatedDuration: booking.bookingDetails?.estimatedDuration || '30'
        });
      } else if (status === 'completed') {
        // Service completed notification
        whatsappPromise = sendHousekeepingServiceCompleted({
          guestName: booking.guestDetails.firstName + ' ' + (booking.guestDetails.lastName || ''),
          guestPhone: booking.guestDetails.phone,
          bookingNumber: booking._id.toString(),
          serviceType: booking.serviceName || 'خدمة التدبير المنزلي',
          completionDate: currentDate,
          completionTime: currentTime,
          roomNumber: booking.guestDetails.roomNumber || 'غير محدد'
        });
      }

      if (whatsappPromise) {
        await whatsappPromise;
        logger.info(`WhatsApp notification sent for housekeeping booking status: ${status}`, {
          bookingId,
          status,
          guestPhone: booking.guestDetails.phone
        });
      }
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp notification for housekeeping status update:', whatsappError);
      // Don't fail the status update if WhatsApp fails
    }
  }

  // Log the status change
  logger.info(`Housekeeping booking ${bookingId} status updated from ${oldStatus} to ${status}`, {
    bookingId,
    oldStatus,
    newStatus: status,
    hotelId,
    serviceProviderId: req.user.serviceProviderId
  });

  res.status(200).json({
    status: 'success',
    data: booking,
    message: `Booking status updated to ${status}`
  });
}));

// Import and use feedback routes for service providers
const feedbackRoutes = require('./feedback');
router.use('/', feedbackRoutes);

module.exports = router;
