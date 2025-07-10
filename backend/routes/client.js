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
      .select('-adminId -serviceProviders -__v')
      .populate({
        path: 'services',
        match: { isActive: true, isApproved: true },
        select: 'name category description pricing.basePrice pricing.currency images'
      });

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
    }

    const query = {
      hotelId: req.params.id,
      isActive: true,
      isApproved: true
    };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const services = await Service.find(query)
      .populate('serviceProviderId', 'businessName rating')
      .sort({ 'performance.totalBookings': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);

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
    const service = await Service.findOne({
      _id: req.params.id,
      isActive: true,
      isApproved: true
    })
    .populate('serviceProviderId', 'businessName description contactEmail contactPhone rating')
    .populate('hotelId', 'name address contactPhone contactEmail');

    if (!service) {
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
    serviceObj.pricing.markupPercentage = markup;

    res.json({
      success: true,
      data: serviceObj
    });
  } catch (error) {
    logger.error('Get service details error:', error);
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
  try {
    const {
      serviceId,
      bookingDate,
      specialRequests,
      guests,
      options
    } = req.body;

    // Get service details
    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
      isApproved: true
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Get hotel markup settings
    const hotel = await Hotel.findById(service.hotelId).select('markupSettings');

    // Calculate final price with markup
    let markup = hotel.markupSettings?.default || 15; // Default 15% markup

    // Check if there's a category-specific markup
    if (hotel.markupSettings?.categories &&
        hotel.markupSettings.categories[service.category] !== undefined) {
      markup = hotel.markupSettings.categories[service.category];
    }

    const basePrice = service.pricing.basePrice;
    const finalPrice = basePrice * (1 + markup / 100);
    const hotelCommission = basePrice * (markup / 100);

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      serviceId,
      serviceProviderId: service.serviceProviderId,
      hotelId: service.hotelId,
      bookingDate: new Date(bookingDate),
      status: 'pending',
      guests: guests || 1,
      specialRequests,
      selectedOptions: options || [],
      totalAmount: finalPrice,
      providerAmount: basePrice,
      hotelCommission,
      platformFee: finalPrice * 0.05, // 5% platform fee
      currency: service.pricing.currency
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
      }
    });

    // Update service booking count
    await Service.findByIdAndUpdate(serviceId, {
      $inc: { 'performance.totalBookings': 1 }
    });

    // Update service provider booking count
    await ServiceProvider.findByIdAndUpdate(service.serviceProviderId, {
      $inc: { totalBookings: 1 }
    });

    // Send confirmation email
    try {
      await sendEmail({
        email: req.user.email,
        subject: `Booking Confirmation - ${service.name}`,
        message: `
          Dear ${req.user.firstName},

          Your booking for ${service.name} on ${new Date(bookingDate).toLocaleDateString()} has been confirmed.

          Booking ID: ${booking._id}
          Service: ${service.name}
          Date: ${new Date(bookingDate).toLocaleDateString()}
          Amount: ${finalPrice} ${service.pricing.currency}

          Special Requests: ${specialRequests || 'None'}

          Thank you for your booking!
          Hotel Service Platform
        `
      });
    } catch (emailError) {
      logger.error('Failed to send booking confirmation email', { error: emailError });
    }

    res.status(201).json({
      success: true,
      data: booking
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
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name category')
      .populate('hotelId', 'name')
      .populate('serviceProviderId', 'businessName')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
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

module.exports = router;

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

module.exports = router;
