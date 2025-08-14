const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hotel = require('../models/Hotel');
const Service = require('../models/Service');
const ServiceProvider = require('../models/ServiceProvider');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect, restrictTo, restrictToOwnBookings } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

/**
 * @desc    Get all active hotels
 * @route   GET /api/client/hotels
 * @access  Public
 */
router.get('/hotels', async (req, res) => {
  try {
    const { search, city, state, country, featured, page = 1, limit = 10 } = req.query;

    const query = { isActive: true, isPublished: true };

    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) query['address.city'] = { $regex: city, $options: 'i' };
    if (state) query['address.state'] = { $regex: state, $options: 'i' };
    if (country) query['address.country'] = { $regex: country, $options: 'i' };
    if (featured === 'true') query.isFeatured = true;

    const skip = (page - 1) * limit;

    const hotels = await Hotel.find(query)
      .select('-adminId -serviceProviders -__v')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: hotels,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get hotel details
 * @route   GET /api/client/hotels/:id
 * @access  Public
 */
router.get('/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .select('-adminId -serviceProviders -__v');

    if (!hotel || !hotel.isActive || !hotel.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or not available'
      });
    }

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    logger.error('Get hotel details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get services for a hotel
 * @route   GET /api/client/hotels/:id/services
 * @access  Public
 */
router.get('/hotels/:id/services', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Check if hotel exists and is active
    const hotel = await Hotel.findOne({ _id: req.params.id, isActive: true, isPublished: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or not available'
      });
    }    const query = {
      hotelId: req.params.id,
      isActive: true
    };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔍 Client services query:', {
      hotelId: req.params.id,
      query,
      page,
      limit
    });

    const skip = (page - 1) * limit;

    const services = await Service.find(query)
      .populate('providerId', 'businessName rating')
      .sort({ 'performance.totalBookings': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);    console.log('📊 Services found for client:', {
      totalInDB: total,
      returnedCount: services.length,
      hotelId: req.params.id,
      serviceIds: services.map(s => s._id.toString()),
      serviceNames: services.map(s => s.name)
    });

    // Apply hotel markup to pricing
    const servicesWithMarkup = services.map(service => {
      const serviceObj = service.toObject();
      let markup = hotel.markupSettings?.default || 15; // Default 15% markup

      // Check if there's a category-specific markup
      if (hotel.markupSettings?.categories &&
          hotel.markupSettings.categories[service.category] !== undefined) {
        markup = hotel.markupSettings.categories[service.category];
      }

      serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + markup / 100);
      return serviceObj;
    });

    res.json({
      success: true,
      data: servicesWithMarkup,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Get hotel services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get service details
 * @route   GET /api/client/services/:id
 * @access  Public
 */
router.get('/services/:id', async (req, res) => {
  try {
    console.log('🔍 Backend: Fetching service details for ID:', req.params.id);
    console.log('🔍 Backend: Request URL:', req.originalUrl);    const service = await Service.findOne({
      _id: req.params.id,
      isActive: true
    })
    .populate('providerId', 'businessName description contactEmail contactPhone rating createdAt logo')
    .populate('hotelId', 'name address contactPhone contactEmail');    console.log('🔍 Backend: Service found:', !!service);
    if (service) {
      console.log('🔍 Backend: Service details:', {
        id: service._id,
        name: service.name,
        category: service.category,
        isActive: service.isActive,
        isApproved: service.isApproved,
        providerId: service.providerId ? {
          id: service.providerId._id,
          businessName: service.providerId.businessName,
          description: service.providerId.description,
          createdAt: service.providerId.createdAt
        } : null,
        hotelId: service.hotelId ? {
          id: service.hotelId._id,
          name: service.hotelId.name
        } : null
      });
    }

    if (!service) {
      console.log('❌ Backend: Service not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Get hotel markup settings
    const hotel = await Hotel.findById(service.hotelId).select('markupSettings');

    // Calculate final price with markup
    const serviceObj = service.toObject();
    let markup = hotel.markupSettings?.default || 15; // Default 15% markup

    // Check if there's a category-specific markup
    if (hotel.markupSettings?.categories &&
        hotel.markupSettings.categories[service.category] !== undefined) {
      markup = hotel.markupSettings.categories[service.category];
    }

    serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + markup / 100);
    serviceObj.pricing.markupPercentage = markup;    res.json({
      success: true,
      data: serviceObj
    });
  } catch (error) {
    console.log('❌ Backend: Error in service details:', {
      error: error.message,
      serviceId: req.params.id,
      stack: error.stack
    });

    logger.error('Get service details error:', error);

    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get current user's hotel information
 * @route   GET /api/client/my-hotel
 * @access  Private/Guest
 */
router.get('/my-hotel', protect, restrictTo('guest'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with selected hotel
    const user = await User.findById(userId).select('selectedHotelId');

    if (!user || !user.selectedHotelId) {
      return res.status(404).json({
        success: false,
        message: 'No hotel selected for this user'
      });
    }

    // Get hotel details
    const hotel = await Hotel.findOne({
      _id: user.selectedHotelId,
      isActive: true,
      isPublished: true
    }).select('-adminId -serviceProviders -__v');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Selected hotel not found or not available'
      });
    }

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    logger.error('Get my hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Book a service
 * @route   POST /api/client/bookings
 * @access  Private
 */
router.post('/bookings', protect, restrictTo('guest'), async (req, res) => {
  try {    const {
      serviceId,
      bookingDate,
      specialRequests,
      quantity = 1,
      selectedTime,
      options,
      serviceCombination // Add service combination support
    } = req.body;

    // Get user details
    const user = await User.findById(req.user.id)
      .select('firstName lastName email phone roomNumber selectedHotelId checkInDate checkOutDate');

    // Room number can be provided in the booking request if not in user profile
    const roomNumber = user.roomNumber || req.body.roomNumber;

    if (!roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Room number is required for booking. Please provide your room number.'
      });
    }    // Get service details
    const service = await Service.findOne({
      _id: serviceId,
      isActive: true
    }).populate('providerId', 'businessName email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Get hotel markup settings
    const hotel = await Hotel.findById(service.hotelId).select('markupSettings name');    // Calculate final price with markup
    let markup = hotel.markupSettings?.default || 15; // Default 15% markup

    // Check if there's a category-specific markup
    if (hotel.markupSettings?.categories &&
        hotel.markupSettings.categories[service.category] !== undefined) {
      markup = hotel.markupSettings.categories[service.category];
    }

    // Determine base price - use service combination price if available
    let basePrice;
    if (serviceCombination && service.packagePricing?.isPackageService) {
      basePrice = serviceCombination.finalPrice || service.pricing.basePrice;
    } else {
      basePrice = service.pricing.basePrice;
    }

    const finalPrice = Math.round((basePrice * (1 + markup / 100) * quantity) * 100) / 100;
    const hotelCommission = Math.round((basePrice * (markup / 100) * quantity) * 100) / 100;
    const providerAmount = Math.round((basePrice * quantity) * 100) / 100;

    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking with complete guest details
    const booking = await Booking.create({
      bookingNumber,
      guestId: req.user.id,
      serviceId,
      serviceProviderId: service.providerId._id,
      hotelId: service.hotelId,

      // Guest details for easy access
      guestDetails: {
        firstName: user.firstName,
        lastName: user.lastName || '', // Make lastName optional
        email: user.email,
        phone: user.phone,
        roomNumber: roomNumber
      },

      // Service details
      serviceDetails: {
        name: service.name,
        category: service.category,
        subcategory: service.subcategory,
        description: service.description
      },      // Booking configuration
      bookingConfig: {
        quantity,
        selectedOptions: options || [],
        selectedTime,
        serviceCombination: serviceCombination || null // Store selected service combination
      },// Scheduling
      schedule: {
        preferredDate: new Date(bookingDate),
        preferredTime: selectedTime,
        estimatedDuration: {
          value: service.duration || 60,
          unit: 'minutes'
        }
      },

      // Pricing breakdown
      pricing: {
        basePrice,
        quantity,
        subtotal: basePrice * quantity,
        totalBeforeMarkup: basePrice * quantity,
        markup: {
          percentage: markup,
          amount: hotelCommission
        },
        totalAmount: finalPrice,
        providerEarnings: providerAmount,
        hotelEarnings: hotelCommission,
        platformFee: Math.round((finalPrice * 0.05) * 100) / 100, // 5% platform fee
        currency: service.pricing.currency || 'USD'
      },

      // Payment information
      payment: {
        method: 'credit-card', // Default payment method
        status: 'pending'
      },

      specialRequests,
      status: 'pending'
    });

    // Update user's booking history
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        bookingHistory: {
          bookingId: booking._id,
          serviceId,
          hotelId: service.hotelId,
          date: new Date(bookingDate)
        }
      },
      hasActiveBooking: true
    });

    // Update service booking count
    await Service.findByIdAndUpdate(serviceId, {
      $inc: { 'performance.totalBookings': 1 }
    });

    // Update service provider booking count
    await ServiceProvider.findByIdAndUpdate(service.providerId._id, {
      $inc: { totalBookings: 1 }
    });

    // Send confirmation email to guest
    try {
      await sendEmail({
        email: user.email,
        subject: `Booking Confirmation - ${service.name}`,
        message: `
          Dear ${user.firstName},

          Your booking for ${service.name} has been confirmed!

          Booking Details:
          - Booking Number: ${bookingNumber}
          - Service: ${service.name}
          - Date: ${new Date(bookingDate).toLocaleDateString()}
          - Time: ${selectedTime || 'To be confirmed'}
          - Room: ${roomNumber}
          - Quantity: ${quantity}
          - Total Amount: $${finalPrice} ${service.pricing.currency || 'USD'}

          Special Requests: ${specialRequests || 'None'}

          Your service provider will be notified and will confirm the appointment details shortly.

          Thank you for your booking!
          Hotel Service Platform
        `
      });
    } catch (emailError) {
      logger.error('Failed to send booking confirmation email', { error: emailError });
    }

    // Send notification email to service provider
    try {
      await sendEmail({
        email: service.providerId.email,
        subject: `New Booking - ${service.name}`,
        message: `
          Dear ${service.providerId.businessName},

          You have received a new booking!

          Guest Details:
          - Name: ${user.firstName} ${user.lastName || ''}
          - Room Number: ${roomNumber}
          - Phone: ${user.phone}
          - Email: ${user.email}
          - Hotel: ${hotel.name}

          Booking Details:
          - Booking Number: ${bookingNumber}
          - Service: ${service.name}
          - Requested Date: ${new Date(bookingDate).toLocaleDateString()}
          - Requested Time: ${selectedTime || 'To be confirmed'}
          - Quantity: ${quantity}
          - Amount: $${providerAmount} ${service.pricing.currency || 'USD'}

          Special Requests: ${specialRequests || 'None'}

          Please log in to your dashboard to confirm or update this booking.

          Best regards,
          Hotel Service Platform
        `
      });
    } catch (emailError) {
      logger.error('Failed to send provider notification email', { error: emailError });
    }

    res.status(201).json({
      success: true,
      data: {
        ...booking.toObject(),
        message: 'Booking created successfully. The service provider has been notified.'
      }
    });
  } catch (error) {
    logger.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get user's bookings
 * @route   GET /api/client/bookings
 * @access  Private
 */
router.get('/bookings', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const query = { guestId: req.user.id }; // Fixed: use guestId instead of userId

    if (status) query.status = status;

    // Add category filtering for laundry bookings
    if (category === 'laundry') {
      // Find services with laundry category
      const laundryServices = await Service.find({ category: 'laundry' }).select('_id');
      query.serviceId = { $in: laundryServices.map(s => s._id) };
    } else if (category === 'transportation') {
      // Find services with transportation category
      const transportServices = await Service.find({ category: 'transportation' }).select('_id');
      query.serviceId = { $in: transportServices.map(s => s._id) };
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name category')
      .populate('hotelId', 'name')
      .populate('serviceProviderId', 'businessName')
      .sort({ createdAt: -1 }) // Sort by creation date instead of bookingDate
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get booking details
 * @route   GET /api/client/bookings/:id
 * @access  Private
 */
router.get('/bookings/:id', protect, restrictToOwnBookings, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'name description category images')
      .populate('hotelId', 'name address contactPhone contactEmail')
      .populate('serviceProviderId', 'businessName contactPhone contactEmail');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Cancel booking
 * @route   PUT /api/client/bookings/:id/cancel
 * @access  Private (Guest)
 */
router.put('/bookings/:id/cancel', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      guest: req.user.id
    }).populate('service', 'name').populate('hotel', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled'
      });
    }

    // Check cancellation policy (24 hours before scheduled time)
    const scheduledDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
    const now = new Date();
    const hoursUntilService = (scheduledDateTime - now) / (1000 * 60 * 60);

    if (hoursUntilService < 24) {
      return res.status(400).json({
        success: false,
        message: 'Booking can only be cancelled 24 hours before scheduled time'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Send cancellation emails
    await sendEmail({
      email: req.user.email,
      subject: 'Booking Cancelled',
      template: 'bookingCancellation',
      context: {
        guestName: req.user.name,
        serviceName: booking.service.name,
        hotelName: booking.hotel.name,
        bookingId: booking._id
      }
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Add review for completed booking
 * @route   POST /api/client/bookings/:id/review
 * @access  Private (Guest)
 */
router.post('/bookings/:id/review', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      guest: req.user.id,
      status: 'completed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not completed'
      });
    }

    if (booking.review) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted'
      });
    }

    booking.review = {
      rating,
      comment,
      createdAt: new Date()
    };
    await booking.save();

    // Update service provider rating
    const provider = await ServiceProvider.findById(booking.provider);
    if (provider) {
      const allBookings = await Booking.find({
        provider: booking.provider,
        status: 'completed',
        'review.rating': { $exists: true }
      });

      const totalRating = allBookings.reduce((sum, b) => sum + b.review.rating, 0);
      provider.rating = totalRating / allBookings.length;
      await provider.save();
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get all services across all hotels (for browsing/discovery)
 * @route   GET /api/client/services
 * @access  Public
 */
router.get('/services', async (req, res) => {
  try {
    const { category, search, city, minPrice, maxPrice, page = 1, limit = 12 } = req.query;    // Build query for active services from active hotels
    const serviceQuery = {
      isActive: true
    };

    if (category) serviceQuery.category = category;
    if (search) {
      serviceQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;    // Get services with hotel information
    const services = await Service.find(serviceQuery)
      .populate({
        path: 'hotelId',
        match: { isActive: true, isPublished: true },
        select: 'name address markupSettings images'
      })
      .populate('providerId', 'businessName rating')
      .sort({ 'performance.totalBookings': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out services from inactive hotels
    const activeServices = services.filter(service => service.hotelId);

    // Apply hotel markup to pricing and filter by price if specified
    let servicesWithMarkup = activeServices.map(service => {
      const serviceObj = service.toObject();
      let markup = service.hotelId.markupSettings?.default || 15; // Default 15% markup

      // Check if there's a category-specific markup
      if (service.hotelId.markupSettings?.categories &&
          service.hotelId.markupSettings.categories[service.category] !== undefined) {
        markup = service.hotelId.markupSettings.categories[service.category];
      }

      serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + markup / 100);
      serviceObj.hotel = {
        id: service.hotelId._id,
        name: service.hotelId.name,
        address: service.hotelId.address,
        images: service.hotelId.images
      };

      return serviceObj;
    });

    // Apply price filters if specified
    if (minPrice || maxPrice) {
      servicesWithMarkup = servicesWithMarkup.filter(service => {
        const price = service.pricing.finalPrice;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Get total count for pagination (this is approximate due to filtering)
    const totalQuery = { ...serviceQuery };
    const totalCount = await Service.countDocuments(totalQuery);

    res.json({
      success: true,
      data: servicesWithMarkup,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(totalCount / limit),
        total: servicesWithMarkup.length,
        totalEstimate: totalCount
      }
    });
  } catch (error) {
    logger.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get available laundry services with items for a hotel
 * @route   GET /api/client/hotels/:hotelId/services/laundry/items
 * @access  Public
 */
router.get('/hotels/:hotelId/services/laundry/items', async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Check if hotel exists and is active
    const hotel = await Hotel.findOne({ _id: hotelId, isActive: true, isPublished: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or not available'
      });
    }    // Find all laundry services for this hotel
    const laundryServices = await Service.find({
      hotelId: hotelId,
      category: 'laundry',
      isActive: true
    })
    .populate('providerId', 'businessName rating contactEmail contactPhone')
    .sort({ 'performance.totalBookings': -1 });    console.log('🔍 Laundry services query for hotel:', {
      hotelId,
      query: { hotelId, category: 'laundry', isActive: true },
      servicesFound: laundryServices.length,
      serviceNames: laundryServices.map(s => s.name),
      servicesWithItems: laundryServices.map(s => ({
        name: s.name,
        hasLaundryItems: !!(s.laundryItems && s.laundryItems.length > 0),
        itemCount: s.laundryItems?.length || 0
      }))
    });// Apply hotel markup to pricing and provide fallback template items
    const categoryTemplates = require('../config/categoryTemplates');
    const servicesWithMarkup = laundryServices.map(service => {
      const serviceObj = service.toObject();
      let markup = hotel.markupSettings?.default || 15; // Default 15% markup

      // Check if there's a category-specific markup for laundry
      if (hotel.markupSettings?.categories &&
          hotel.markupSettings.categories['laundry'] !== undefined) {
        markup = hotel.markupSettings.categories['laundry'];
      }      // Skip template fallback - only show services with actual configured items
      console.log(`🔍 Service "${serviceObj.name}" laundryItems:`, {
        hasItems: !!(serviceObj.laundryItems && serviceObj.laundryItems.length > 0),
        itemCount: serviceObj.laundryItems?.length || 0,
        categories: serviceObj.laundryItems ? [...new Set(serviceObj.laundryItems.map(item => item.category))] : []
      });

      // Apply markup to individual laundry items and their service types
      if (serviceObj.laundryItems && serviceObj.laundryItems.length > 0) {
        serviceObj.laundryItems = serviceObj.laundryItems.map(item => {
          const updatedItem = { ...item };

          // Apply markup to service types within each item
          if (updatedItem.serviceTypes) {
            updatedItem.serviceTypes = updatedItem.serviceTypes.map(st => ({
              ...st,
              price: Math.round((st.price * (1 + markup / 100)) * 100) / 100
            }));
          }

          // Apply markup to base item price if it exists
          if (updatedItem.price) {
            updatedItem.price = Math.round((updatedItem.price * (1 + markup / 100)) * 100) / 100;
          }

          return updatedItem;
        });
      }

      // Apply markup to service combinations
      if (serviceObj.serviceCombinations) {
        serviceObj.serviceCombinations = serviceObj.serviceCombinations.map(combo => ({
          ...combo,
          finalPrice: Math.round((combo.price * (1 + markup / 100)) * 100) / 100
        }));
      } else {
        // If no service combinations, create default ones from templates
        serviceObj.serviceCombinations = categoryTemplates.laundry.serviceCombinations.map(combo => ({
          ...combo,
          price: 10, // Default base price
          finalPrice: Math.round((10 * (1 + markup / 100)) * 100) / 100
        }));
      }

      // Apply markup to express surcharge if enabled
      if (serviceObj.expressSurcharge?.enabled) {
        serviceObj.expressSurcharge.finalRate = Math.round((serviceObj.expressSurcharge.rate * (1 + markup / 100)) * 100) / 100;
      } else if (!serviceObj.expressSurcharge) {
        // Add default express surcharge from template
        serviceObj.expressSurcharge = {
          ...categoryTemplates.laundry.expressSurcharge,
          enabled: false,
          rate: 5,
          finalRate: Math.round((5 * (1 + markup / 100)) * 100) / 100
        };
      }      // Set final pricing for the service
      serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + markup / 100);

      return serviceObj;
    });    // Filter out services without actual laundryItems
    const servicesWithActualItems = servicesWithMarkup.filter(service => {
      const hasItems = service.laundryItems && service.laundryItems.length > 0;
      console.log(`🔍 Service "${service.name}" - hasItems: ${hasItems}, itemCount: ${service.laundryItems?.length || 0}`);
      return hasItems;
    });

    console.log('🔍 Final services with items:', {
      totalServices: laundryServices.length,
      servicesWithItems: servicesWithActualItems.length,
      filteredServices: servicesWithActualItems.map(s => ({
        name: s.name,
        itemCount: s.laundryItems?.length || 0,
        categories: [...new Set(s.laundryItems?.map(item => item.category) || [])]
      }))
    });    res.json({
      success: true,
      data: {
        hotel: {
          id: hotel._id,
          name: hotel.name
        },
        services: servicesWithActualItems
      }
    });
  } catch (error) {
    logger.error('Get laundry services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Create a new laundry booking with multiple items
 * @route   POST /api/client/bookings/laundry
 * @access  Private/Guest
 */
router.post('/bookings/laundry', protect, restrictTo('guest'), async (req, res) => {
  try {
    const {
      serviceId,
      hotelId,
      laundryItems,
      expressSurcharge,
      schedule,
      guestDetails,
      location    } = req.body;

    console.log('🔍 Booking data received:', {
      serviceId,
      hotelId,
      laundryItemsCount: laundryItems?.length,
      schedule: schedule,
      preferredTime: schedule?.preferredTime,
      timeType: typeof schedule?.preferredTime
    });

    // Validate required fields
    if (!serviceId || !hotelId || !laundryItems || laundryItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service ID, hotel ID, and laundry items are required'
      });
    }

    // Validate service exists and is active
    const service = await Service.findOne({
      _id: serviceId,      hotelId: hotelId,
      category: 'laundry',
      isActive: true
    }).populate('providerId', 'businessName email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Laundry service not found or not available'
      });
    }

    // Get hotel markup settings
    const hotel = await Hotel.findById(hotelId).select('markupSettings name');
    let markup = hotel.markupSettings?.default || 15;

    if (hotel.markupSettings?.categories &&
        hotel.markupSettings.categories['laundry'] !== undefined) {
      markup = hotel.markupSettings.categories['laundry'];
    }

    // Calculate pricing
    const itemsTotal = laundryItems.reduce((total, item) => total + item.totalPrice, 0);
    const expressTotal = expressSurcharge?.enabled ? expressSurcharge.rate : 0;
    const subtotal = itemsTotal + expressTotal;

    // Apply hotel markup
    const totalBeforeMarkup = subtotal;
    const markupAmount = (totalBeforeMarkup * markup) / 100;
    const totalAmount = totalBeforeMarkup + markupAmount;
    const providerEarnings = totalBeforeMarkup;
    const hotelEarnings = markupAmount;    // Generate booking number
    const bookingNumber = `LN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Normalize time format to HH:MM
    const normalizeTime = (timeStr) => {
      if (!timeStr) return '09:00'; // Default time

      // If already in HH:MM format, return as is
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
        return timeStr;
      }

      // Convert text values to HH:MM format (legacy support)
      const timeMap = {
        'morning': '09:00',
        'afternoon': '14:00',
        'evening': '18:00'
      };

      return timeMap[timeStr.toLowerCase()] || '09:00';
    };

    const normalizedTime = normalizeTime(schedule?.preferredTime);
    console.log('⏰ Time normalization:', {
      original: schedule?.preferredTime,
      normalized: normalizedTime
    });

    // Get user details
    const user = await User.findById(req.user.id);

    // Create booking
    const booking = await Booking.create({
      bookingNumber,
      guestId: req.user.id,
      serviceId,
      serviceProviderId: service.providerId._id,
      hotelId,

      // Guest details
      guestDetails: {
        firstName: user.firstName,
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone,
        roomNumber: guestDetails?.roomNumber || user.roomNumber || roomNumber || ''
      },

      // Service details
      serviceDetails: {
        name: service.name,
        category: 'laundry',
        subcategory: service.subcategory,
        description: service.description
      },

      // Booking configuration for laundry
      bookingConfig: {
        quantity: laundryItems.length,        laundryItems: laundryItems.map(item => ({
          itemName: item.itemName,
          itemId: item.itemId,
          itemCategory: item.itemCategory,
          itemIcon: item.itemIcon,
          quantity: item.quantity,
          serviceType: {
            id: item.serviceTypeId,
            name: item.serviceTypeName,
            description: item.serviceTypeDescription,
            duration: {
              value: 24, // Default 24 hours for laundry
              unit: 'hours'
            },
            icon: item.serviceTypeIcon
          },
          basePrice: item.basePrice || item.totalPrice || 0,
          finalPrice: item.totalPrice
        })),
        isExpressService: expressSurcharge?.enabled || false,
        specialRequests: guestDetails?.specialRequests || ''
      },      // Scheduling
      schedule: {
        preferredDate: new Date(schedule.preferredDate),
        preferredTime: normalizedTime,
        estimatedDuration: {
          value: 24,
          unit: 'hours'
        }
      },

      // Location
      location: {
        pickupLocation: location?.pickupLocation || guestDetails?.roomNumber || '',
        deliveryLocation: location?.deliveryLocation || location?.pickupLocation || guestDetails?.roomNumber || '',
        pickupInstructions: location?.pickupInstructions || guestDetails?.specialRequests || ''
      },

      // Pricing breakdown
      pricing: {
        basePrice: itemsTotal,
        quantity: laundryItems.length,
        subtotal: subtotal,
        expressSurcharge: expressTotal,
        markup: {
          percentage: markup,
          amount: markupAmount
        },
        tax: {
          rate: 0,
          amount: 0
        },
        totalBeforeMarkup: totalBeforeMarkup,
        totalAmount: totalAmount,
        currency: 'USD',        providerEarnings: providerEarnings,
        hotelEarnings: hotelEarnings
      },

      status: 'pending',

      // Payment information - default to pending payment
      payment: {
        method: req.body.paymentMethod || 'credit-card',
        status: 'pending'
      }
    });

    // Send confirmation emails (optional - add email service integration)
    try {
      // Email to guest
      await sendEmail({
        to: user.email,
        subject: `Laundry Booking Confirmation - ${bookingNumber}`,
        template: 'laundry-booking-confirmation',
        data: {
          guestName: `${user.firstName} ${user.lastName}`,
          bookingNumber,
          hotel: hotel.name,
          items: laundryItems,
          totalAmount,
          schedule: schedule
        }
      });

      // Email to service provider
      await sendEmail({
        to: service.providerId.email,
        subject: `New Laundry Booking - ${bookingNumber}`,
        template: 'laundry-booking-provider',
        data: {
          providerName: service.providerId.businessName,
          bookingNumber,
          guestName: `${user.firstName} ${user.lastName}`,
          items: laundryItems,
          totalAmount: providerEarnings,
          schedule: schedule
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Laundry booking created successfully',
      data: {
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          totalAmount: totalAmount,
          schedule: booking.schedule,
          serviceName: service.name,
          providerName: service.providerId.businessName
        }
      }
    });

  } catch (error) {
    logger.error('Create laundry booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get available transportation services with vehicles for a hotel
 * @route   GET /api/client/hotels/:hotelId/services/transportation/vehicles
 * @access  Public
 */
router.get('/hotels/:hotelId/services/transportation/vehicles', async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Check if hotel exists and is active
    const hotel = await Hotel.findOne({ _id: hotelId, isActive: true, isPublished: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or not available'
      });
    }

    // Find all transportation services for this hotel
    const transportationServices = await Service.find({
      hotelId: hotelId,
      category: 'transportation',
      isActive: true
    })
    .populate('providerId', 'businessName rating contactEmail contactPhone')
    .sort({ 'performance.totalBookings': -1 });

    console.log('🚗 Transportation services query for hotel:', {
      hotelId,
      query: { hotelId, category: 'transportation', isActive: true },
      servicesFound: transportationServices.length,
      serviceNames: transportationServices.map(s => s.name),
      servicesWithVehicles: transportationServices.map(s => ({
        name: s.name,
        hasTransportationItems: !!(s.transportationItems && s.transportationItems.length > 0),
        vehicleCount: s.transportationItems?.length || 0
      }))
    });

    // Apply hotel markup to pricing
    const categoryTemplates = require('../config/categoryTemplates');
    const servicesWithMarkup = transportationServices.map(service => {
      const serviceObj = service.toObject();
      let markup = hotel.markupSettings?.default || 15; // Default 15% markup

      // Check if there's a category-specific markup for transportation
      if (hotel.markupSettings?.categories &&
          hotel.markupSettings.categories['transportation'] !== undefined) {
        markup = hotel.markupSettings.categories['transportation'];
      }

      console.log(`🚗 Service "${serviceObj.name}" transportationItems:`, {
        hasVehicles: !!(serviceObj.transportationItems && serviceObj.transportationItems.length > 0),
        vehicleCount: serviceObj.transportationItems?.length || 0,
        categories: serviceObj.transportationItems ? [...new Set(serviceObj.transportationItems.map(vehicle => vehicle.category))] : []
      });

      // Apply markup to individual transportation vehicles and their service types
      if (serviceObj.transportationItems && serviceObj.transportationItems.length > 0) {
        serviceObj.transportationItems = serviceObj.transportationItems.map(vehicle => {
          const updatedVehicle = { ...vehicle };          // Apply markup to service types within each vehicle
          if (updatedVehicle.serviceTypes) {
            updatedVehicle.serviceTypes = updatedVehicle.serviceTypes.map(st => {
              const updatedServiceType = { ...st };

              // Handle both pricing structures
              if (st.price && st.price > 0) {
                // Simple price structure
                updatedServiceType.price = Math.round((st.price * (1 + markup / 100)) * 100) / 100;
              } else if (st.pricing && st.pricing.basePrice > 0) {
                // Complex pricing structure
                updatedServiceType.pricing = {
                  ...st.pricing,
                  basePrice: Math.round((st.pricing.basePrice * (1 + markup / 100)) * 100) / 100
                };
                // Also set a simple price field for frontend compatibility
                updatedServiceType.price = updatedServiceType.pricing.basePrice;
              }

              return updatedServiceType;
            });
          }

          // Apply markup to base vehicle price if it exists
          if (updatedVehicle.price) {
            updatedVehicle.price = Math.round((updatedVehicle.price * (1 + markup / 100)) * 100) / 100;
          }

          return updatedVehicle;
        });
      }

      // Apply markup to express surcharge if enabled
      if (serviceObj.expressSurcharge?.enabled) {
        serviceObj.expressSurcharge.finalRate = Math.round((serviceObj.expressSurcharge.rate * (1 + markup / 100)) * 100) / 100;
      } else if (!serviceObj.expressSurcharge) {
        // Add default express surcharge from template
        serviceObj.expressSurcharge = {
          ...categoryTemplates.transportation.expressSurcharge,
          enabled: false,
          rate: 10,
          finalRate: Math.round((10 * (1 + markup / 100)) * 100) / 100
        };
      }

      // Set final pricing for the service
      serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + markup / 100);

      return serviceObj;
    });

    // Filter out services without actual transportationItems
    const servicesWithActualVehicles = servicesWithMarkup.filter(service => {
      const hasVehicles = service.transportationItems && service.transportationItems.length > 0;
      console.log(`🚗 Service "${service.name}" - hasVehicles: ${hasVehicles}, vehicleCount: ${service.transportationItems?.length || 0}`);
      return hasVehicles;
    });

    console.log('🚗 Final services with vehicles:', {
      totalServices: transportationServices.length,
      servicesWithVehicles: servicesWithActualVehicles.length,
      filteredServices: servicesWithActualVehicles.map(s => ({
        name: s.name,
        vehicleCount: s.transportationItems?.length || 0,
        categories: [...new Set(s.transportationItems?.map(vehicle => vehicle.category) || [])]
      }))
    });

    res.json({
      success: true,
      data: {
        hotel: {
          id: hotel._id,
          name: hotel.name
        },
        services: servicesWithActualVehicles
      }
    });
  } catch (error) {
    logger.error('Get transportation services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Create a new transportation booking with multiple vehicles
 * @route   POST /api/client/bookings/transportation
 * @access  Private/Guest
 */
router.post('/bookings/transportation', protect, restrictTo('guest'), async (req, res) => {
  try {
    const {
      serviceId,
      hotelId,
      transportationItems,
      expressSurcharge,
      schedule,
      guestDetails,
      location
    } = req.body;

    console.log('🚗 Transportation booking data received:', {
      serviceId,
      hotelId,
      transportationItemsCount: transportationItems?.length,
      schedule: schedule,
      pickupDate: schedule?.pickupDate,
      pickupTime: schedule?.pickupTime
    });

    // Validate required fields
    if (!serviceId || !hotelId || !transportationItems || transportationItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service ID, hotel ID, and transportation items are required'
      });
    }

    // Validate service exists and is active
    const service = await Service.findOne({
      _id: serviceId,
      hotelId: hotelId,
      category: 'transportation',
      isActive: true
    }).populate('providerId', 'businessName email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Transportation service not found or not available'
      });
    }

    // Get hotel markup settings
    const hotel = await Hotel.findById(hotelId).select('markupSettings name');
    let markup = hotel.markupSettings?.default || 15;

    if (hotel.markupSettings?.categories &&
        hotel.markupSettings.categories['transportation'] !== undefined) {
      markup = hotel.markupSettings.categories['transportation'];
    }

    // Calculate pricing
    const vehiclesTotal = transportationItems.reduce((total, vehicle) => total + vehicle.totalPrice, 0);
    const expressTotal = expressSurcharge?.enabled ? expressSurcharge.rate : 0;
    const subtotal = vehiclesTotal + expressTotal;

    // Apply hotel markup
    const totalBeforeMarkup = subtotal;
    const markupAmount = (totalBeforeMarkup * markup) / 100;
    const totalAmount = totalBeforeMarkup + markupAmount;
    const providerEarnings = totalBeforeMarkup;
    const hotelEarnings = markupAmount;

    // Generate booking number
    const bookingNumber = `TR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking with parsed date
    const scheduledDate = new Date(`${schedule.pickupDate}T${schedule.pickupTime}:00.000Z`);

    const booking = new Booking({
      bookingId: bookingNumber,
      serviceId: service._id,
      guestId: req.user._id,
      hotelId: hotelId,
      serviceName: service.name,
      category: 'transportation',
      transportationItems: transportationItems.map(vehicle => ({
        vehicleType: vehicle.vehicleType,
        vehicleCategory: vehicle.vehicleCategory,
        quantity: vehicle.quantity || 1,
        serviceType: {
          id: vehicle.serviceTypeId,
          name: vehicle.serviceTypeName,
          description: vehicle.serviceTypeDescription,
          duration: vehicle.serviceTypeDuration
        },
        basePrice: vehicle.basePrice,
        totalPrice: vehicle.totalPrice
      })),
      expressSurcharge: expressSurcharge || { enabled: false, rate: 0 },
      schedule: {
        pickupDate: schedule.pickupDate,
        pickupTime: schedule.pickupTime,
        returnDate: schedule.returnDate,
        returnTime: schedule.returnTime
      },
      guestDetails: {
        passengerCount: guestDetails.passengerCount || 1,
        luggageCount: guestDetails.luggageCount || 0,
        specialRequests: guestDetails.specialRequests || ''
      },
      location: {
        pickupLocation: location.pickupLocation,
        dropoffLocation: location.dropoffLocation,
        pickupInstructions: location.pickupInstructions || ''
      },
      scheduledDate,
      totalAmount,
      providerEarnings,
      hotelEarnings,
      markupPercentage: markup,
      paymentStatus: 'pending',
      status: 'pending',
      notes: guestDetails.specialRequests || ''
    });

    await booking.save();

    console.log('🚗 Transportation booking created:', {
      bookingId: booking.bookingId,
      totalAmount: booking.totalAmount,
      vehicleCount: transportationItems.length
    });

    // Send email notifications
    try {
      // Guest confirmation email
      await sendEmail({
        to: req.user.email,
        subject: `Transportation Booking Confirmation - ${bookingNumber}`,
        template: 'transportation-booking-confirmation',
        templateData: {
          guestName: `${req.user.firstName} ${req.user.lastName}`,
          bookingNumber: bookingNumber,
          hotelName: hotel.name,
          serviceName: service.name,
          vehicles: transportationItems,
          schedule: {
            pickupDate: schedule.pickupDate,
            pickupTime: schedule.pickupTime,
            returnDate: schedule.returnDate,
            returnTime: schedule.returnTime
          },
          location: location,
          totalAmount: totalAmount,
          bookingDate: new Date().toLocaleDateString()
        }
      });

      // Service provider notification email
      await sendEmail({
        to: service.providerId.email,
        subject: `New Transportation Booking - ${bookingNumber}`,
        template: 'transportation-booking-provider',
        templateData: {
          providerName: service.providerId.businessName,
          bookingNumber: bookingNumber,
          guestName: `${req.user.firstName} ${req.user.lastName}`,
          hotelName: hotel.name,
          vehicles: transportationItems,
          schedule: schedule,
          location: location,
          totalAmount: totalAmount,
          providerEarnings: providerEarnings,
          bookingDate: new Date().toLocaleDateString()
        }
      });

    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Transportation booking created successfully',
      data: {
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          totalAmount: booking.totalAmount,
          scheduledDate: booking.scheduledDate,
          status: booking.status,
          providerName: service.providerId.businessName
        }
      }
    });

  } catch (error) {
    logger.error('Create transportation booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
