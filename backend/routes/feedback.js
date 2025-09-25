/**
 * Feedback Routes
 * Handles feedback creation and retrieval for different user roles
 */

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const TransportationBooking = require('../models/TransportationBooking');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @desc    Create feedback for a service
 * @route   POST /api/client/feedback
 * @access  Private (Guest)
 */
router.post('/feedback', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { bookingId, rating, comment, serviceType } = req.body;

    console.log('💬 Feedback submission request:', {
      bookingId,
      rating,
      comment: comment ? comment.substring(0, 50) + '...' : 'No comment',
      serviceType,
      userId: req.user.id,
      userEmail: req.user.email
    });

    // Validate required fields
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if booking exists and belongs to the user
    let booking = null;
    let bookingType = 'regular'; // Track whether it's a regular or transportation booking

    // Try to find by MongoDB ObjectId first
    if (bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(bookingId);
    }

    // If not found by ObjectId, try to find by booking number
    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: bookingId });
    }

    // If still not found in regular bookings, try transportation bookings
    if (!booking) {
      // Try by ObjectId in transportation bookings
      if (bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        booking = await TransportationBooking.findById(bookingId);
      }

      // Try by booking reference in transportation bookings
      if (!booking) {
        booking = await TransportationBooking.findOne({ bookingReference: bookingId });
      }

      if (booking) {
        bookingType = 'transportation';
      }
    }

    console.log('💬 Booking lookup result:', {
      bookingFound: !!booking,
      bookingType,
      bookingId: booking?._id,
      bookingNumber: booking?.bookingNumber || booking?.bookingReference,
      bookingStatus: booking?.status || booking?.bookingStatus,
      paymentStatus: booking?.payment?.status,
      paymentMethod: booking?.payment?.paymentMethod,
      guestId: booking?.guestId,
      requestingUserId: req.user.id,
      totalAmount: booking?.totalAmount || booking?.quote?.finalPrice,
      pricingTotalAmount: booking?.pricing?.totalAmount,
      currency: booking?.currency || booking?.pricing?.currency,
      pricingCurrency: booking?.pricing?.currency
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.guestId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for your own bookings'
      });
    }

    // Check if booking is completed/paid or if it's a cash payment (cash payments are considered confirmed)
    let isCashPayment, isCompleted;

    if (bookingType === 'transportation') {
      // For transportation bookings, check bookingStatus and payment fields
      isCashPayment = booking.payment?.paymentMethod === 'cash';
      isCompleted = ['completed', 'payment_completed', 'confirmed'].includes(booking.bookingStatus) ||
                    ['paid', 'completed'].includes(booking.payment?.status);
    } else {
      // For regular bookings, use existing logic
      isCashPayment = booking.payment?.paymentMethod === 'cash' || booking.paymentMethod === 'cash';
      isCompleted = ['completed', 'confirmed'].includes(booking.status) ||
                   ['paid', 'completed'].includes(booking.payment?.status);
    }

    if (!isCompleted && !isCashPayment) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be provided for completed bookings or confirmed cash payments'
      });
    }

    // Check if feedback already exists for this booking
    const existingFeedback = await Feedback.findOne({ bookingId: booking._id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been provided for this booking'
      });
    }

    // Create feedback - handle different field structures for regular vs transportation bookings
    let feedbackData;

    if (bookingType === 'transportation') {
      // For transportation bookings
      feedbackData = {
        bookingId: booking._id,
        guestId: req.user.id,
        hotelId: booking.hotelId,
        serviceProviderId: booking.serviceProviderId,
        serviceId: booking.serviceId,
        serviceType: serviceType || 'transportation',
        rating,
        comment: comment ? comment.trim() : '',
        guestName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
        guestEmail: req.user.email,
        bookingDate: booking.tripDetails?.scheduledDateTime || booking.createdAt,
        totalAmount: booking.quote?.finalPrice || booking.pricing?.finalPrice || 0,
        currency: booking.pricing?.currency || 'USD',
        paymentMethod: booking.payment?.paymentMethod || 'online',
        paymentType: booking.payment?.method || 'credit-card',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };
    } else {
      // For regular bookings
      feedbackData = {
        bookingId: booking._id,
        guestId: req.user.id,
        hotelId: booking.hotelId,
        serviceProviderId: booking.serviceProviderId,
        serviceId: booking.serviceId,
        serviceType: serviceType || booking.serviceType || 'regular',
        rating,
        comment: comment ? comment.trim() : '',
        guestName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
        guestEmail: req.user.email,
        bookingDate: booking.bookingDate || booking.createdAt,
        totalAmount: booking.pricing?.totalAmount || booking.totalAmount || 0,
        currency: booking.pricing?.currency || booking.currency || 'USD',
        paymentMethod: booking.payment?.paymentMethod || booking.paymentMethod || 'online',
        paymentType: booking.payment?.method || 'credit-card',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    // Populate references for response
    await feedback.populate([
      { path: 'hotelId', select: 'name' },
      { path: 'serviceId', select: 'title category' },
      { path: 'serviceProviderId', select: 'businessName' }
    ]);

    logger.info(`Feedback created: ${feedback._id} for booking: ${bookingId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback: {
          id: feedback._id,
          rating: feedback.rating,
          comment: feedback.comment,
          createdAt: feedback.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback'
    });
  }
});

/**
 * @desc    Get guest's feedback history
 * @route   GET /api/client/feedback
 * @access  Private (Guest)
 */
router.get('/feedback', protect, restrictTo('guest'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({ guestId: req.user.id })
      .populate([
        { path: 'hotelId', select: 'name' },
        { path: 'serviceId', select: 'title category' },
        { path: 'serviceProviderId', select: 'businessName' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments({ guestId: req.user.id });

    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFeedbacks: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get guest feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving feedback'
    });
  }
});

/**
 * @desc    Get hotel feedback (for hotel admin)
 * @route   GET /api/hotel/feedback
 * @access  Private (Hotel Admin)
 */
router.get('/hotel-feedback', protect, restrictTo('hotel'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { rating, serviceType, status = 'active', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = {
      hotelId: req.user.hotelId,
      status
    };

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const feedbacks = await Feedback.find(query)
      .populate([
        { path: 'serviceId', select: 'title category' },
        { path: 'serviceProviderId', select: 'businessName' },
        { path: 'bookingId', select: 'bookingNumber' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);

    // Get statistics
    const stats = await Feedback.getHotelRating(req.user.hotelId);

    res.json({
      success: true,
      data: {
        feedbacks,
        statistics: stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFeedbacks: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get hotel feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving feedback'
    });
  }
});

/**
 * @desc    Get service provider feedback
 * @route   GET /api/service/service-feedback
 * @access  Private (Service Provider)
 */
router.get('/service-feedback', protect, restrictTo('service'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { rating, status = 'active', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Get service provider ID
    const serviceProvider = await require('../models/ServiceProvider').findOne({ userId: req.user.id });
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }

    // Build query
    const query = {
      serviceProviderId: serviceProvider._id,
      status
    };

    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const feedbacks = await Feedback.find(query)
      .populate([
        { path: 'hotelId', select: 'name' },
        { path: 'serviceId', select: 'title category' },
        { path: 'bookingId', select: 'bookingNumber' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);

    // Get statistics
    const stats = await Feedback.getServiceProviderRating(serviceProvider._id);

    res.json({
      success: true,
      data: {
        feedbacks,
        statistics: stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFeedbacks: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get service provider feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving feedback'
    });
  }
});

/**
 * @desc    Get all feedback (for super admin)
 * @route   GET /api/superadmin/superadmin-feedback
 * @access  Private (Super Admin)
 */
router.get('/superadmin-feedback', protect, restrictTo('superadmin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const {
      rating,
      serviceType,
      status = 'active',
      hotelId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { status };

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    if (hotelId) {
      query.hotelId = hotelId;
    }

    if (search) {
      query.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { guestName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const feedbacks = await Feedback.find(query)
      .populate([
        { path: 'hotelId', select: 'name' },
        { path: 'serviceId', select: 'title category' },
        { path: 'serviceProviderId', select: 'businessName' },
        { path: 'bookingId', select: 'bookingNumber' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);

    // Get overall statistics
    const stats = await Feedback.getAverageRating();

    res.json({
      success: true,
      data: {
        feedbacks,
        statistics: stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFeedbacks: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get superadmin feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving feedback'
    });
  }
});

/**
 * @desc    Update feedback status (moderation)
 * @route   PATCH /api/feedback/:id/status
 * @access  Private (Hotel Admin, Super Admin)
 */
router.patch('/:id/status', protect, restrictTo('hotel', 'superadmin'), async (req, res) => {
  try {
    const { status, moderationNotes } = req.body;

    if (!['active', 'hidden', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check permissions
    if (req.user.role === 'hotel' && feedback.hotelId.toString() !== req.user.hotelId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only moderate feedback for your hotel'
      });
    }

    feedback.status = status;
    feedback.isModerated = true;
    feedback.moderatedBy = req.user.id;
    feedback.moderatedAt = new Date();
    if (moderationNotes) {
      feedback.moderationNotes = moderationNotes;
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: {
        feedback: {
          id: feedback._id,
          status: feedback.status,
          moderatedAt: feedback.moderatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Update feedback status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating feedback'
    });
  }
});

/**
 * @desc    Get feedback for super hotel admin (manages group of hotels)
 * @route   GET /api/superadmin/superhotel-feedback
 * @access  Private (Super Admin - but filtered for specific hotel group)
 */
router.get('/superhotel-feedback', protect, restrictTo('superadmin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const {
      rating,
      serviceType,
      status = 'active',
      hotelIds, // Comma-separated list of hotel IDs for the super hotel admin
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { status };

    // Filter by multiple hotel IDs if provided
    if (hotelIds) {
      const hotelIdArray = hotelIds.split(',').map(id => id.trim());
      query.hotelId = { $in: hotelIdArray };
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    if (search) {
      query.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { guestName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    console.log('🏨 Super Hotel feedback query:', query);

    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .populate('hotelId', 'name address')
        .populate('serviceProviderId', 'businessName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(query)
    ]);

    // Calculate statistics for this hotel group
    const stats = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Process rating distribution
    let ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingStats[rating] = (ratingStats[rating] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        statistics: {
          averageRating: stats.length > 0 ? Number(stats[0].averageRating.toFixed(2)) : 0,
          totalCount: total,
          ratingDistribution: ratingStats
        }
      }
    });

    console.log('🏨 Super Hotel feedback retrieved successfully:', {
      count: feedback.length,
      total,
      averageRating: stats.length > 0 ? stats[0].averageRating : 0
    });

  } catch (error) {
    logger.error('Get super hotel feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving feedback'
    });
  }
});

module.exports = router;
