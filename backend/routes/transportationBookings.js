/**
 * Transportation Booking Routes
 * Handles the new uber-style transportation booking system
 * Routes for quote-based pricing, payment processing, and booking management
 */

const express = require('express');
const router = express.Router();
const TransportationBooking = require('../models/TransportationBooking');
const Service = require('../models/Service');
const Hotel = require('../models/Hotel');
const ServiceProvider = require('../models/ServiceProvider');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  sendTransportationBookingConfirmation,
  sendNewTransportationOrderToProvider
} = require('../utils/whatsapp');

/**
 * @desc    Create a new transportation booking request (Guest route)
 * @route   POST /api/transportation-bookings/guest
 * @access  Private/Guest
 */
router.post('/guest', protect, restrictTo('guest'), async (req, res) => {
  try {
    const {
      serviceId,
      hotelId,
      tripDetails,
      vehicleDetails,
      guestNotes
    } = req.body;

    // Validate required fields
    if (!serviceId || !hotelId || !tripDetails?.destination || !tripDetails?.scheduledDateTime || !vehicleDetails?.vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serviceId, hotelId, destination, scheduledDateTime, and vehicleType are required'
      });
    }

    // Verify service exists and is active
    const service = await Service.findById(serviceId)
      .populate('providerId', 'businessName email phone markup')
      .populate('hotelId', 'name email');

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Transportation service not found or not available'
      });
    }

    // Get hotel details for markup calculation
    const hotel = await Hotel.findById(hotelId).select('markupSettings name address');
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Get service provider details to check for specific markup
    const ServiceProvider = require('../models/ServiceProvider');
    const serviceProvider = await ServiceProvider.findById(service.providerId._id).select('markup');

    let hotelMarkupPercentage = 15; // Default 15%

    // First priority: Service provider specific markup set by hotel
    if (serviceProvider?.markup?.percentage !== undefined) {
      hotelMarkupPercentage = serviceProvider.markup.percentage;
    }
    // Second priority: Hotel's category-specific markup
    else if (hotel.markupSettings?.categories?.transportation !== undefined) {
      hotelMarkupPercentage = hotel.markupSettings.categories.transportation;
    }
    // Third priority: Hotel's default markup
    else if (hotel.markupSettings?.default !== undefined) {
      hotelMarkupPercentage = hotel.markupSettings.default;
    }

    // Create the booking
    const bookingData = {
      guestId: req.user._id,
      hotelId: hotelId,
      serviceProviderId: service.providerId._id,
      serviceId: serviceId,

      vehicleDetails: {
        vehicleType: vehicleDetails.vehicleType,
        comfortLevel: vehicleDetails.comfortLevel || 'economy'
      },

      tripDetails: {
        pickupLocation: tripDetails.pickupLocation || hotel.address || 'Hotel lobby',
        destination: tripDetails.destination,
        scheduledDateTime: new Date(tripDetails.scheduledDateTime),
        passengerCount: tripDetails.passengerCount || 1,
        luggageCount: tripDetails.luggageCount || 0
      },

      guestDetails: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone
      },

      guestNotes: guestNotes || '',

      hotelMarkup: {
        percentage: hotelMarkupPercentage
      },

      bookingStatus: 'pending_quote',

      metadata: {
        source: 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    };

    logger.info('Creating transportation booking with data:', {
      bookingData: JSON.stringify(bookingData, null, 2),
      userRole: req.user.role,
      userId: req.user._id
    });

    const booking = new TransportationBooking(bookingData);

    // Ensure booking reference is set before saving
    if (!booking.bookingReference) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      booking.bookingReference = `TR${year}${month}${day}${random}`;
    }

    logger.info('About to save booking:', {
      bookingReference: booking.bookingReference,
      hasBookingReference: !!booking.bookingReference,
      bookingId: booking._id
    });

    await booking.save();

    logger.info('Booking saved successfully:', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference
    });

    // Add initial communication log
    booking.communications.push({
      sender: 'guest',
      message: `Booking request created for ${vehicleDetails.vehicleType} from ${booking.tripDetails.pickupLocation} to ${tripDetails.destination}`,
      messageType: 'info'
    });

    await booking.save();

    logger.info('Transportation booking created via guest route', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      guestId: req.user._id,
      serviceProviderId: service.providerId._id
    });

    // Send WhatsApp notifications
    try {
      // Send confirmation to guest via WhatsApp
      if (req.user.phone) {
        await sendTransportationBookingConfirmation({
          guestName: `${req.user.firstName} ${req.user.lastName || ''}`,
          guestPhone: req.user.phone,
          bookingNumber: booking.bookingReference,
          hotelName: hotel.name,
          serviceProviderName: service.providerId.businessName,
          vehicleType: booking.vehicleDetails.vehicleType,
          tripDate: new Date(booking.tripDetails.scheduledDateTime).toLocaleDateString('ar-EG'),
          departureTime: new Date(booking.tripDetails.scheduledDateTime).toLocaleTimeString('ar-EG'),
          pickupLocation: booking.tripDetails.pickupLocation,
          destinationLocation: booking.tripDetails.destination,
          totalAmount: 'سيتم تحديد السعر قريباً',
          paymentStatus: 'في انتظار السعر'
        });
        logger.info('WhatsApp transportation booking confirmation sent to guest', {
          bookingReference: booking.bookingReference,
          guestPhone: req.user.phone
        });
      }

      // Send notification to service provider via WhatsApp
      if (service.providerId.phone) {
        await sendNewTransportationOrderToProvider({
          providerPhone: service.providerId.phone,
          bookingNumber: booking.bookingReference,
          guestName: `${req.user.firstName} ${req.user.lastName || ''}`,
          hotelName: hotel.name,
          guestPhone: req.user.phone,
          tripDate: new Date(booking.tripDetails.scheduledDateTime).toLocaleDateString('ar-EG'),
          departureTime: new Date(booking.tripDetails.scheduledDateTime).toLocaleTimeString('ar-EG'),
          pickupLocation: booking.tripDetails.pickupLocation,
          destinationLocation: booking.tripDetails.destination,
          vehicleType: booking.vehicleDetails.vehicleType,
          passengerCount: booking.tripDetails.passengerCount,
          baseAmount: 'سيتم تحديد السعر'
        });
        logger.info('WhatsApp transportation order notification sent to provider', {
          bookingReference: booking.bookingReference,
          providerPhone: service.providerId.phone
        });
      }
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp notifications for transportation booking', {
        error: whatsappError.message,
        bookingReference: booking.bookingReference
      });
      // Don't fail the booking if WhatsApp fails
    }

    res.status(201).json({
      success: true,
      message: 'Transportation booking request sent successfully! You will receive a quote from the service provider soon.',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus,
          tripDetails: booking.tripDetails,
          vehicleDetails: booking.vehicleDetails,
          serviceProvider: service.providerId.businessName,
          hotel: hotel.name,
          createdAt: booking.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Create transportation booking error (guest route):', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Create a new transportation booking request
 * @route   POST /api/transportation-bookings
 * @access  Private/Guest
 */
router.post('/', protect, restrictTo('guest'), async (req, res) => {
  try {
    const {
      serviceId,
      hotelId,
      vehicleType,
      comfortLevel,
      pickupLocation,
      destination,
      scheduledDateTime,
      passengerCount,
      specialRequirements
    } = req.body;

    // Validate required fields
    if (!serviceId || !hotelId || !vehicleType || !comfortLevel || !pickupLocation || !destination || !scheduledDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify service exists and is active
    const service = await Service.findById(serviceId)
      .populate('providerId', 'businessName email phone markup')
      .populate('hotelId', 'name email');

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Transportation service not found or not available'
      });
    }

    // Verify the selected vehicle type and comfort level exist in the service
    const selectedVehicle = service.transportationItems?.find(
      item => item.vehicleType === vehicleType && item.comfortLevel === comfortLevel && item.isAvailable
    );

    if (!selectedVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Selected vehicle type and comfort level combination not available'
      });
    }

    // Get hotel markup settings
    const hotel = await Hotel.findById(hotelId).select('markupSettings name');
    let hotelMarkupPercentage = 15; // Default 15%

    if (hotel.markupSettings?.categories?.transportation !== undefined) {
      hotelMarkupPercentage = hotel.markupSettings.categories.transportation;
    } else if (hotel.markupSettings?.default !== undefined) {
      hotelMarkupPercentage = hotel.markupSettings.default;
    }

    // Create the booking
    const booking = new TransportationBooking({
      guestId: req.user._id,
      hotelId: hotelId,
      serviceProviderId: service.providerId._id,
      serviceId: serviceId,

      vehicleDetails: {
        vehicleType: vehicleType,
        comfortLevel: comfortLevel,
        passengerCapacity: selectedVehicle.vehicleCapacity?.passengers,
        selectedAmenities: selectedVehicle.amenities || []
      },

      tripDetails: {
        pickupLocation: pickupLocation,
        destination: destination,
        scheduledDateTime: new Date(scheduledDateTime),
        passengerCount: passengerCount,
        specialRequirements: specialRequirements
      },

      guestDetails: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone
      },

      hotelMarkup: {
        percentage: hotelMarkupPercentage
      },

      bookingStatus: 'pending_quote',

      metadata: {
        source: 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await booking.save();

    // Add initial communication log
    booking.communications.push({
      sender: 'guest',
      message: `Booking request created for ${vehicleType} (${comfortLevel}) from ${pickupLocation} to ${destination}`,
      messageType: 'info'
    });

    await booking.save();

    logger.info('Transportation booking created', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      guestId: req.user._id,
      serviceProviderId: service.providerId._id
    });

    // TODO: Send email notification to service provider
    // TODO: Send confirmation email to guest

    res.status(201).json({
      success: true,
      message: 'Transportation booking request created successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus,
          tripDetails: booking.tripDetails,
          vehicleDetails: booking.vehicleDetails,
          serviceProvider: service.providerId.businessName,
          createdAt: booking.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Create transportation booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Get guest's transportation bookings
 * @route   GET /api/transportation-bookings/guest
 * @access  Private/Guest
 */
router.get('/guest', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { guestId: req.user._id };
    if (status) {
      query.bookingStatus = status;
    }

    const bookings = await TransportationBooking.find(query)
      .populate('serviceProvider', 'businessName phone email rating')
      .populate('service', 'name')
      .populate('hotel', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TransportationBooking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get guest bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

/**
 * @desc    Get guest's pending payment requests
 * @route   GET /api/transportation-bookings/guest/payment-requests
 * @access  Private/Guest
 */
router.get('/guest/payment-requests', protect, restrictTo('guest'), async (req, res) => {
  try {
    const bookings = await TransportationBooking.findPendingPayments(req.user._id)
      .populate('serviceProvider', 'businessName phone email')
      .populate('service', 'name')
      .populate('hotel', 'name');

    res.json({
      success: true,
      data: {
        paymentRequests: bookings.map(booking => ({
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus,
          tripDetails: booking.tripDetails,
          vehicleDetails: booking.vehicleDetails,
          quote: booking.quote,
          serviceProvider: booking.serviceProvider,
          hotel: booking.hotel,
          isQuoteExpired: booking.isQuoteExpired,
          createdAt: booking.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Get payment requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment requests'
    });
  }
});

/**
 * @desc    Accept a quote
 * @route   PUT /api/transportation-bookings/:bookingId/accept-quote
 * @access  Private/Guest
 */
router.put('/:bookingId/accept-quote', protect, restrictTo('guest'), async (req, res) => {
  try {
    const booking = await TransportationBooking.findOne({
      _id: req.params.bookingId,
      guestId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'quote_sent') {
      return res.status(400).json({
        success: false,
        message: 'Quote cannot be accepted in current booking status'
      });
    }

    if (booking.isQuoteExpired) {
      return res.status(400).json({
        success: false,
        message: 'Quote has expired'
      });
    }

    await booking.acceptQuote(req.user._id);

    // TODO: Trigger Kashier.io payment session creation

    res.json({
      success: true,
      message: 'Quote accepted successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus,
          quote: booking.quote
        }
      }
    });

  } catch (error) {
    logger.error('Accept quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting quote'
    });
  }
});

/**
 * @desc    Reject a quote
 * @route   PUT /api/transportation-bookings/:bookingId/reject-quote
 * @access  Private/Guest
 */
router.put('/:bookingId/reject-quote', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await TransportationBooking.findOne({
      _id: req.params.bookingId,
      guestId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'quote_sent') {
      return res.status(400).json({
        success: false,
        message: 'Quote cannot be rejected in current booking status'
      });
    }

    await booking.rejectQuote(req.user._id, reason);

    res.json({
      success: true,
      message: 'Quote rejected successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus
        }
      }
    });

  } catch (error) {
    logger.error('Reject quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting quote'
    });
  }
});

/**
 * @desc    Get service provider's transportation booking requests
 * @route   GET /api/transportation-bookings/provider
 * @access  Private/ServiceProvider
 */
router.get('/provider', protect, restrictTo('service'), async (req, res) => {
  try {
    const { status = 'pending_quote', page = 1, limit = 10 } = req.query;

    // Get service provider ID from auth middleware
    let serviceProviderId;
    if (req.user.serviceProviderId) {
      serviceProviderId = req.user.serviceProviderId._id || req.user.serviceProviderId;
    } else {
      // Fallback to database lookup if not in auth middleware
      const serviceProvider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: 'Service provider profile not found'
        });
      }
      serviceProviderId = serviceProvider._id;
    }

    const query = {
      serviceProviderId: serviceProviderId,
      bookingStatus: status === 'completed' ? { $in: ['completed', 'payment_completed'] } : status
    };

    const bookings = await TransportationBooking.find(query)
      .populate('guestId', 'firstName lastName email phone')
      .populate('serviceId', 'serviceName')
      .populate('hotelId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TransportationBooking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get provider bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

/**
 * @desc    Create a quote for a booking
 * @route   PUT /api/transportation-bookings/:bookingId/quote
 * @access  Private/ServiceProvider
 */
router.put('/:bookingId/quote', protect, restrictTo('service'), async (req, res) => {
  try {
    const { basePrice, notes, expirationHours = 24 } = req.body;

    if (!basePrice || basePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid base price is required'
      });
    }

    // Get service provider ID from auth middleware
    let serviceProvider;
    let serviceProviderId;

    if (req.user.serviceProviderId) {
      serviceProviderId = req.user.serviceProviderId._id || req.user.serviceProviderId;
      serviceProvider = { _id: serviceProviderId };
    } else {
      // Fallback to database lookup if not in auth middleware
      serviceProvider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: 'Service provider profile not found'
        });
      }
      serviceProviderId = serviceProvider._id;
    }

    const booking = await TransportationBooking.findOne({
      _id: req.params.bookingId,
      serviceProviderId: serviceProviderId
    }).populate('guestId', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'pending_quote') {
      return res.status(400).json({
        success: false,
        message: 'Quote cannot be created for booking in current status'
      });
    }

    await booking.createQuote(basePrice, notes, expirationHours);

    // TODO: Send email notification to guest about new quote

    logger.info('Quote created for transportation booking', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      basePrice: basePrice,
      finalPrice: booking.quote.finalPrice,
      serviceProviderId: serviceProvider._id
    });

    res.json({
      success: true,
      message: 'Quote created successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus,
          quote: booking.quote,
          guest: {
            name: `${booking.guestId.firstName} ${booking.guestId.lastName}`,
            email: booking.guestId.email
          }
        }
      }
    });

  } catch (error) {
    logger.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating quote'
    });
  }
});

/**
 * @desc    Get booking details by ID
 * @route   GET /api/transportation-bookings/:bookingId
 * @access  Private/Guest or ServiceProvider
 */
router.get('/:bookingId', protect, async (req, res) => {
  try {
    let booking;

    if (req.user.role === 'guest') {
      booking = await TransportationBooking.findOne({
        _id: req.params.bookingId,
        guestId: req.user._id
      }).populate('serviceProvider', 'businessName phone email')
        .populate('service', 'name')
        .populate('hotel', 'name');
    } else if (req.user.role === 'service') {
      let serviceProviderId;
      if (req.user.serviceProviderId) {
        serviceProviderId = req.user.serviceProviderId._id || req.user.serviceProviderId;
      } else {
        // Fallback to database lookup if not in auth middleware
        const serviceProvider = await ServiceProvider.findOne({ userId: req.user._id });
        if (!serviceProvider) {
          return res.status(404).json({
            success: false,
            message: 'Service provider profile not found'
          });
        }
        serviceProviderId = serviceProvider._id;
      }

      booking = await TransportationBooking.findOne({
        _id: req.params.bookingId,
        serviceProviderId: serviceProviderId
      }).populate('guestId', 'firstName lastName email phone')
        .populate('serviceId', 'serviceName')
        .populate('hotelId', 'name');
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    logger.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking details'
    });
  }
});

/**
 * @desc    Cancel a booking
 * @route   DELETE /api/transportation-bookings/:bookingId
 * @access  Private/Guest or ServiceProvider
 */
router.delete('/:bookingId', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    let booking;

    if (req.user.role === 'guest') {
      booking = await TransportationBooking.findOne({
        _id: req.params.bookingId,
        guestId: req.user._id
      });
    } else if (req.user.role === 'service') {
      let serviceProviderId;
      if (req.user.serviceProviderId) {
        serviceProviderId = req.user.serviceProviderId._id || req.user.serviceProviderId;
      } else {
        // Fallback to database lookup if not in auth middleware
        const serviceProvider = await ServiceProvider.findOne({ userId: req.user._id });
        if (!serviceProvider) {
          return res.status(404).json({
            success: false,
            message: 'Service provider profile not found'
          });
        }
        serviceProviderId = serviceProvider._id;
      }

      booking = await TransportationBooking.findOne({
        _id: req.params.bookingId,
        serviceProviderId: serviceProviderId
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.cancel(req.user.role, reason);

    // TODO: Send cancellation notifications
    // TODO: Process refunds if applicable

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus,
          cancellation: booking.cancellation
        }
      }
    });

  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while cancelling booking'
    });
  }
});

/**
 * @desc    Update payment method for transportation booking
 * @route   PUT /api/transportation-bookings/:id/payment-method
 * @access  Private/Guest
 */
router.put('/:id/payment-method', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    // Validate payment method
    if (!['online', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be either "online" or "cash".'
      });
    }

    // Find the booking and ensure it belongs to the current user
    const booking = await TransportationBooking.findOne({
      _id: req.params.id,
      guestId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking status allows payment method change
    if (!['payment_pending', 'pending_quote'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method can only be updated for pending bookings'
      });
    }

    // Update payment method
    booking.payment = {
      ...booking.payment,
      paymentMethod: paymentMethod,
      method: paymentMethod === 'online' ? 'credit-card' : 'cash',
      status: paymentMethod === 'cash' ? 'pending' : 'pending'
    };

    // If cash payment, update booking status
    if (paymentMethod === 'cash') {
      booking.bookingStatus = 'confirmed';
    }

    await booking.save();

    logger.info('Transportation booking payment method updated', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      paymentMethod,
      newStatus: booking.bookingStatus
    });

    res.json({
      success: true,
      message: paymentMethod === 'cash'
        ? 'Payment method updated successfully. Payment will be collected at the hotel.'
        : 'Payment method updated successfully.',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          bookingStatus: booking.bookingStatus,
          payment: booking.payment
        }
      }
    });

  } catch (error) {
    logger.error('Update transportation booking payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment method'
    });
  }
});

/**
 * @desc    Update booking status
 * @route   PUT /api/transportation-bookings/:id/status
 * @access  Private/Service Provider
 */
router.put('/:id/status', protect, restrictTo('service'), async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending_quote', 'quote_sent', 'quote_accepted', 'payment_pending', 'confirmed', 'payment_completed', 'service_active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Get service provider ID from auth middleware
    let serviceProviderId;
    if (req.user.serviceProviderId) {
      serviceProviderId = req.user.serviceProviderId._id || req.user.serviceProviderId;
    } else {
      // Fallback to database lookup if not in auth middleware
      const serviceProvider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: 'Service provider profile not found'
        });
      }
      serviceProviderId = serviceProvider._id;
    }

    // Find the booking and ensure it belongs to the current service provider
    const booking = await TransportationBooking.findOne({
      _id: req.params.id,
      serviceProviderId: serviceProviderId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status
    booking.bookingStatus = status;
    await booking.save();

    logger.info('Transportation booking status updated', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      oldStatus: booking.bookingStatus,
      newStatus: status,
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          bookingStatus: booking.bookingStatus
        }
      }
    });

  } catch (error) {
    logger.error('Update transportation booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status'
    });
  }
});

module.exports = router;
