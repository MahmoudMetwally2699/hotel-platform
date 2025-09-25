const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Service = require('../models/Service');
const ServiceProvider = require('../models/ServiceProvider');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect, restrictTo, restrictToOwnBookings } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const {
  sendLaundryBookingConfirmation,
  sendNewLaundryOrderToProvider,
  sendTransportationBookingConfirmation,
  sendNewTransportationOrderToProvider,
  sendHousekeepingBookingConfirmation,
  sendNewHousekeepingOrderToProvider
} = require('../utils/whatsapp');

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
  try {
    console.log('🔍 Booking request body:', JSON.stringify(req.body, null, 2));

    const {
      serviceId,
      bookingDate,
      specialRequests,
      quantity = 1,
      selectedTime,
      options,
      serviceCombination, // Add service combination support
      paymentMethod = 'online', // Add payment method selection
      // Restaurant booking fields
      menuItems,
      deliveryTime,
      deliveryDate,
      schedule,
      guestDetails,
      location,
      roomNumber: requestRoomNumber
    } = req.body;

    // Extract dates and times from different possible locations
    const extractedDeliveryDate = deliveryDate || schedule?.preferredDate;
    const extractedDeliveryTime = deliveryTime || schedule?.preferredTime;
    const extractedRoomNumber = requestRoomNumber || guestDetails?.deliveryLocation || location?.deliveryLocation;

    console.log('🔍 Extracted fields:', {
      serviceId,
      bookingDate,
      deliveryDate,
      extractedDeliveryDate,
      selectedTime,
      deliveryTime,
      extractedDeliveryTime,
      extractedRoomNumber,
      paymentMethod,
      hasMenuItems: !!menuItems,
      menuItemsCount: menuItems?.length
    });

    // Validate required fields
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    // For restaurant bookings, use deliveryDate as bookingDate if bookingDate is not provided
    const finalBookingDate = bookingDate || extractedDeliveryDate;
    let finalSelectedTime = selectedTime || extractedDeliveryTime;

    if (!finalBookingDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking date or delivery date is required'
      });
    }

    if (!finalSelectedTime) {
      // For restaurant bookings, provide default times for meal periods
      finalSelectedTime = '12:00'; // Default lunch time
    } else if (finalSelectedTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(finalSelectedTime)) {
      // Convert meal period names to times
      switch (finalSelectedTime.toLowerCase()) {
        case 'breakfast':
          finalSelectedTime = '08:00';
          break;
        case 'lunch':
          finalSelectedTime = '12:00';
          break;
        case 'dinner':
          finalSelectedTime = '19:00';
          break;
        default:
          finalSelectedTime = '12:00'; // Default fallback
      }

      console.log('🔍 Converted meal period to time:', {
        originalTime: extractedDeliveryTime,
        finalTime: finalSelectedTime
      });
    }

    if (!finalSelectedTime) {
      return res.status(400).json({
        success: false,
        message: 'Selected time or delivery time is required'
      });
    }

    // Validate date format
    const parsedDate = new Date(finalBookingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date format'
      });
    }

    // Validate time format (HH:MM) - make this more flexible for restaurant bookings
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(finalSelectedTime)) {
      console.log('🔍 Time validation failed:', {
        finalSelectedTime,
        regex: timeRegex.toString()
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM format (e.g., 14:30)'
      });
    }

    // Validate that booking date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past'
      });
    }

    // Validate payment method
    if (!['online', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be either "online" or "cash".'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id)
      .select('firstName lastName email phone roomNumber selectedHotelId checkInDate checkOutDate');

    // Room number can be provided in the booking request if not in user profile
    const roomNumber = user.roomNumber || extractedRoomNumber || req.body.roomNumber;

    console.log('🔍 Room number resolution:', {
      userRoomNumber: user.roomNumber,
      extractedRoomNumber,
      bodyRoomNumber: req.body.roomNumber,
      finalRoomNumber: roomNumber
    });

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

    // Determine base price - use service combination price if available, or calculate from menu items
    let basePrice;
    let finalQuantity = quantity;

    if (menuItems && menuItems.length > 0) {
      // For restaurant bookings, calculate total from menu items
      // Use totalPrice if available, otherwise calculate from price * quantity
      basePrice = menuItems.reduce((total, item) => {
        const itemPrice = item.totalPrice || (item.price * item.quantity);
        return total + itemPrice;
      }, 0);
      finalQuantity = menuItems.reduce((total, item) => total + item.quantity, 0);

      console.log('🔍 Restaurant pricing calculation:', {
        menuItems: menuItems.map(item => ({
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          calculatedTotal: item.totalPrice || (item.price * item.quantity)
        })),
        basePrice,
        finalQuantity
      });
    } else if (serviceCombination && service.packagePricing?.isPackageService) {
      basePrice = serviceCombination.finalPrice || service.pricing.basePrice;
    } else {
      basePrice = service.pricing.basePrice;
    }

    // Ensure basePrice is a valid number
    if (isNaN(basePrice) || basePrice <= 0) {
      console.error('🔍 Invalid basePrice calculated:', {
        basePrice,
        menuItems: menuItems?.length,
        serviceCombination: !!serviceCombination,
        servicePricing: service.pricing
      });
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate booking price. Please check menu items or service pricing.'
      });
    }

    const finalPrice = Math.round((basePrice * (1 + markup / 100)) * 100) / 100;
    const hotelCommission = Math.round((basePrice * (markup / 100)) * 100) / 100;
    const providerAmount = Math.round(basePrice * 100) / 100;

    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking with complete guest details
    const booking = await Booking.create({
      bookingNumber,
      guestId: req.user.id,
      serviceId,
      serviceProviderId: service.providerId._id,
      hotelId: service.hotelId,
      serviceType: service.category || 'regular', // Set serviceType based on service category

      // Guest details for easy access
      guestDetails: {
        firstName: user.firstName,
        lastName: user.lastName || user.firstName || 'Guest', // Ensure lastName is never empty
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
        quantity: finalQuantity,
        selectedOptions: options || [],
        selectedTime: finalSelectedTime,
        serviceCombination: serviceCombination || null, // Store selected service combination
        menuItems: menuItems || [] // Store menu items for restaurant bookings
      },// Scheduling
      schedule: {
        preferredDate: parsedDate,
        preferredTime: finalSelectedTime,
        estimatedDuration: {
          value: service.duration || 60,
          unit: 'minutes'
        }
      },

      // Pricing breakdown
      pricing: {
        basePrice,
        quantity: finalQuantity,
        subtotal: basePrice,
        totalBeforeMarkup: basePrice,
        markup: {
          percentage: markup,
          amount: hotelCommission
        },
        totalAmount: finalPrice,
        providerEarnings: providerAmount,
        hotelEarnings: hotelCommission,
        platformFee: Math.round((finalPrice * 0.05) * 100) / 100, // 5% platform fee
        currency: service.pricing.currency || 'EGP'
      },

      // Payment information
      payment: {
        paymentMethod,
        method: paymentMethod === 'online' ? 'credit-card' : 'cash',
        status: 'pending',
        paymentStatus: 'pending'
      },

      specialRequests,
      status: 'pending' // Use valid status value
    });

    // Set different statuses based on payment method
    if (paymentMethod === 'cash') {
      booking.payment.paymentStatus = 'paid'; // Cash payments are considered paid
      booking.payment.status = 'completed'; // Payment completed at hotel
      booking.status = 'confirmed'; // Booking is confirmed for cash payments
    } else {
      booking.payment.paymentStatus = 'pending';
      booking.status = 'pending'; // Normal flow for online payments
    }

    await booking.save();

    // Update user's booking history
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        bookingHistory: {
          bookingId: booking._id,
          serviceId,
          hotelId: service.hotelId,
          date: parsedDate
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
      const paymentMethodText = paymentMethod === 'cash'
        ? 'Cash (Payment at hotel)'
        : 'Online payment required';

      const paymentInstructions = paymentMethod === 'cash'
        ? 'Payment will be collected when the service is provided.'
        : 'Please complete your online payment to confirm this booking.';

      await sendEmail({
        email: user.email,
        subject: `Booking Confirmation - ${service.name}`,
        message: `
          Dear ${user.firstName},

          Your booking for ${service.name} has been ${paymentMethod === 'cash' ? 'confirmed' : 'created'}!

          Booking Details:
          - Booking Number: ${bookingNumber}
          - Service: ${service.name}
          - Date: ${new Date(finalBookingDate).toLocaleDateString()}
          - Time: ${finalSelectedTime || 'To be confirmed'}
          - Room: ${roomNumber}
          - Quantity: ${finalQuantity}
          - Total Amount: $${finalPrice} ${service.pricing.currency || 'EGP'}
          - Payment Method: ${paymentMethodText}

          Special Requests: ${specialRequests || 'None'}

          Payment Information:
          ${paymentInstructions}

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
      const paymentMethodText = paymentMethod === 'cash'
        ? 'Cash (Payment at hotel)'
        : 'Online payment';

      const paymentStatus = paymentMethod === 'cash'
        ? 'Payment will be collected when service is provided'
        : 'Payment pending online confirmation';

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
          - Requested Date: ${new Date(finalBookingDate).toLocaleDateString()}
          - Requested Time: ${finalSelectedTime || 'To be confirmed'}
          - Quantity: ${finalQuantity}
          - Amount: $${providerAmount} ${service.pricing.currency || 'EGP'}
          - Payment Method: ${paymentMethodText}
          - Payment Status: ${paymentStatus}

          Special Requests: ${specialRequests || 'None'}

          Please log in to your dashboard to confirm or update this booking.

          Best regards,
          Hotel Service Platform
        `
      });
    } catch (emailError) {
      logger.error('Failed to send provider notification email', { error: emailError });
    }

    // Send WhatsApp notifications
    try {
      // Send confirmation to guest via WhatsApp
      if (user.phone) {
        await sendLaundryBookingConfirmation({
          guestName: `${user.firstName} ${user.lastName || ''}`,
          guestPhone: user.phone,
          bookingNumber,
          hotelName: hotel.name,
          serviceProviderName: service.providerId.businessName,
          serviceType: service.name,
          pickupDate: new Date(finalBookingDate).toLocaleDateString('ar-EG'),
          pickupTime: finalSelectedTime || 'سيتم التأكيد',
          roomNumber,
          totalAmount: finalPrice,
          paymentStatus: 'في انتظار الدفع'
        });
        logger.info('WhatsApp booking confirmation sent to guest', {
          bookingNumber,
          guestPhone: user.phone
        });
      }

      // Send notification to service provider via WhatsApp
      if (service.providerId.phone) {
        await sendNewLaundryOrderToProvider({
          providerPhone: service.providerId.phone,
          bookingNumber,
          guestName: `${user.firstName} ${user.lastName || ''}`,
          hotelName: hotel.name,
          roomNumber,
          guestPhone: user.phone,
          pickupDate: new Date(finalBookingDate).toLocaleDateString('ar-EG'),
          pickupTime: finalSelectedTime || 'سيتم التأكيد',
          serviceType: service.name,
          specialNotes: specialRequests,
          baseAmount: providerAmount
        });
        logger.info('WhatsApp order notification sent to provider', {
          bookingNumber,
          providerPhone: service.providerId.phone
        });
      }
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp notifications', {
        error: whatsappError.message,
        bookingNumber
      });
      // Don't fail the booking if WhatsApp fails
    }

    // Create appropriate response message based on payment method
    const successMessage = paymentMethod === 'cash'
      ? 'Booking created successfully. Payment will be collected at the hotel. The service provider has been notified.'
      : 'Booking created successfully. Please proceed to payment. The service provider has been notified.';

    // Determine redirect URL for cash payments to show feedback
    let redirectUrl = null;
    if (paymentMethod === 'cash') {
      const bookingReference = booking.bookingNumber || booking._id;
      const serviceTypeParam = booking.serviceType || service.category || 'regular';
      redirectUrl = `/guest/payment-success?booking=${bookingReference}&paymentMethod=cash&serviceType=${serviceTypeParam}`;
    }

    res.status(201).json({
      success: true,
      data: {
        ...booking.toObject(),
        message: successMessage,
        paymentMethod,
        requiresPayment: paymentMethod === 'online',
        redirectUrl // Add redirect URL for cash payments
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
      // Find services with laundry category OR bookings with serviceType 'laundry'
      const laundryServices = await Service.find({ category: 'laundry' }).select('_id');
      const laundryServiceIds = laundryServices.map(s => s._id);

      // Filter by both serviceId (regular bookings) AND serviceType (laundry bookings)
      query.$or = [
        { serviceId: { $in: laundryServiceIds } },
        { serviceType: 'laundry' }
      ];

      console.log('🔍 Laundry category filter applied:', {
        laundryServiceIds: laundryServiceIds.map(id => id.toString()),
        queryWithOr: query
      });
    } else if (category === 'transportation') {
      // Find services with transportation category
      const transportServices = await Service.find({ category: 'transportation' }).select('_id');
      query.serviceId = { $in: transportServices.map(s => s._id) };
    } else if (category === 'restaurant' || category === 'dining') {
      // Find services with dining category
      const restaurantServices = await Service.find({ category: 'dining' }).select('_id');
      query.serviceId = { $in: restaurantServices.map(s => s._id) };
    }

    const skip = (page - 1) * limit;

    // Create the main query for regular bookings with user's guestId (exclude housekeeping)
    const regularBookingsQuery = {
      ...query,
      $or: [
        { serviceType: { $ne: 'housekeeping' } },
        { serviceType: { $exists: false } }
      ]
    };

    // Also find housekeeping bookings that match user's email (for bookings made without authentication)
    // OR match by guestId (for bookings made with authentication)
    const housekeepingByEmailQuery = {
      serviceType: 'housekeeping',
      $or: [
        { 'guestDetails.email': req.user.email },
        { guestId: req.user.id }
      ]
    };

    // If status filter is provided, apply it to housekeeping query too
    if (status) housekeepingByEmailQuery.status = status;

    console.log('🔍 Guest bookings - User ID:', req.user.id);
    console.log('🔍 Guest bookings - User email:', req.user.email);
    console.log('🔍 Guest bookings - Base query:', query);
    console.log('🔍 Guest bookings - Regular query:', regularBookingsQuery);
    console.log('🔍 Guest bookings - Housekeeping query:', housekeepingByEmailQuery);

    // Debug: Check all housekeeping bookings to see what emails they have
    const allHousekeepingBookings = await Booking.find({ serviceType: 'housekeeping' }).lean();
    // console.log('🔍 All housekeeping bookings emails:', allHousekeepingBookings.map(b => ({
    //   id: b._id,
    //   email: b.guestDetails?.email,
    //   guestId: b.guestId
    // })));

    // Get both regular bookings and housekeeping bookings by email
    const [regularBookings, housekeepingBookings] = await Promise.all([
      Booking.find(regularBookingsQuery)
        .populate('serviceId', 'name category')
        .populate('hotelId', 'name')
        .populate('serviceProviderId', 'businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Booking.find(housekeepingByEmailQuery)
        .populate('hotelId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    console.log('🔍 Guest bookings - Regular bookings found:', regularBookings.length);
    console.log('🔍 Guest bookings - Regular bookings details:', regularBookings.map(b => ({
      id: b._id,
      serviceType: b.serviceType,
      serviceName: b.serviceId?.name,
      serviceCategory: b.serviceId?.category,
      status: b.status,
      createdAt: b.createdAt
    })));
    console.log('🔍 Guest bookings - Housekeeping bookings found:', housekeepingBookings.length);
    console.log('🔍 Guest bookings - Housekeeping bookings details:', housekeepingBookings.map(b => ({
      id: b._id,
      serviceName: b.serviceName,
      email: b.guestDetails?.email,
      serviceType: b.serviceType
    })));

    // Combine and sort all bookings
    const allBookings = [...regularBookings, ...housekeepingBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    // Get total count
    const [regularTotal, housekeepingTotal] = await Promise.all([
      Booking.countDocuments(regularBookingsQuery),
      Booking.countDocuments(housekeepingByEmailQuery)
    ]);

    const total = regularTotal + housekeepingTotal;

    res.json({
      success: true,
      data: {
        bookings: allBookings,
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
 * @desc    Get booking details by merchant order ID (for temporary bookings)
 * @route   GET /api/client/bookings/by-merchant-order/:merchantOrderId
 * @access  Public (for payment success pages)
 */
router.get('/bookings/by-merchant-order/:merchantOrderId', async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    console.log('🔍 Looking for booking by merchant order ID:', merchantOrderId);

    let booking = null;

    // First try to find in regular bookings by bookingNumber (for laundry)
    booking = await Booking.findOne({ bookingNumber: merchantOrderId })
      .populate('serviceId', 'name description category images')
      .populate('hotelId', 'name address contactPhone contactEmail')
      .populate('serviceProviderId', 'businessName contactPhone contactEmail');

    console.log('🔍 Found booking by bookingNumber:', !!booking, booking?.bookingNumber);

    // If not found by bookingNumber, try to find by payment.kashier.sessionId for temp laundry bookings
    if (!booking) {
      booking = await Booking.findOne({ 'payment.kashier.sessionId': merchantOrderId })
        .populate('serviceId', 'name description category images')
        .populate('hotelId', 'name address contactPhone contactEmail')
        .populate('serviceProviderId', 'businessName contactPhone contactEmail');

      console.log('🔍 Found booking by sessionId:', !!booking, booking?.bookingNumber);
    }

    if (!booking) {
      // Try TransportationBooking by bookingReference
      const TransportationBooking = require('../models/TransportationBooking');
      booking = await TransportationBooking.findOne({ bookingReference: merchantOrderId })
        .populate('serviceId', 'name description category images')
        .populate('hotelId', 'name address contactPhone contactEmail')
        .populate('serviceProviderId', 'businessName contactPhone contactEmail');
    }

    if (!booking) {
      // Check if this is still a temporary booking that hasn't been created yet
      const tempData = global.tempBookingData && global.tempBookingData[merchantOrderId];
      if (tempData) {
        return res.status(202).json({
          success: false,
          message: 'Booking is still being processed. Please try again in a few moments.',
          isProcessing: true
        });
      }

      // Additional check: if this looks like a temp booking ID, wait a moment and try again
      if (merchantOrderId.startsWith('TEMP_')) {
        console.log('⏳ Temp booking not found immediately, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        // Try to find the booking again after waiting
        booking = await Booking.findOne({
          $or: [
            { bookingNumber: merchantOrderId },
            { 'payment.kashier.sessionId': merchantOrderId }
          ]
        })
        .populate('serviceId', 'name description category images')
        .populate('hotelId', 'name address contactPhone contactEmail')
        .populate('serviceProviderId', 'businessName contactPhone contactEmail');

        if (booking) {
          console.log('✅ Found booking after retry:', booking.bookingNumber);
          return res.json({
            success: true,
            data: booking
          });
        }
      }

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
    logger.error('Get booking by merchant order error:', error);
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
 * @desc    Get available restaurant services with menu items for a hotel
 * @route   GET /api/client/hotels/:hotelId/services/dining/items
 * @access  Public
 */
router.get('/hotels/:hotelId/services/dining/items', async (req, res) => {
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

    // Find all restaurant services for this hotel
    const restaurantServices = await Service.find({
      hotelId: hotelId,
      category: 'dining',
      isActive: true
    })
    .populate('providerId', 'businessName rating contactEmail contactPhone')
    .sort({ 'performance.totalBookings': -1 });

    console.log('🍽️ Restaurant services query for hotel:', {
      hotelId,
      query: { hotelId, category: 'dining', isActive: true },
      servicesFound: restaurantServices.length,
      serviceNames: restaurantServices.map(s => s.name),
      servicesWithItems: restaurantServices.map(s => ({
        name: s.name,
        hasMenuItems: !!(s.menuItems && s.menuItems.length > 0),
        itemCount: s.menuItems?.length || 0
      }))
    });

    // Apply hotel markup to pricing
    const servicesWithMarkup = restaurantServices.map(service => {
      const serviceObj = service.toObject();
      let markup = hotel.markupSettings?.default || 15; // Default 15% markup

      // Check if there's a category-specific markup for dining
      if (hotel.markupSettings?.categories &&
          hotel.markupSettings.categories['dining'] !== undefined) {
        markup = hotel.markupSettings.categories['dining'];
      }

      console.log(`🔍 Service "${serviceObj.name}" menuItems:`, {
        hasItems: !!(serviceObj.menuItems && serviceObj.menuItems.length > 0),
        itemCount: serviceObj.menuItems?.length || 0,
        categories: serviceObj.menuItems ? [...new Set(serviceObj.menuItems.map(item => item.category))] : []
      });

      // Apply markup to individual menu items
      if (serviceObj.menuItems && serviceObj.menuItems.length > 0) {
        serviceObj.menuItems = serviceObj.menuItems.map(item => {
          const updatedItem = { ...item };

          // Apply markup to menu item price
          if (updatedItem.price) {
            updatedItem.price = Math.round((updatedItem.price * (1 + markup / 100)) * 100) / 100;
          }

          return updatedItem;
        });
      }

      // Set final pricing for the service
      if (serviceObj.pricing) {
        serviceObj.pricing.finalPrice = serviceObj.pricing.basePrice * (1 + markup / 100);
      }

      return serviceObj;
    });

    // Filter out services without actual menuItems
    const servicesWithActualItems = servicesWithMarkup.filter(service => {
      const hasItems = service.menuItems && service.menuItems.length > 0;
      console.log(`🔍 Service "${service.name}" - hasItems: ${hasItems}, itemCount: ${service.menuItems?.length || 0}`);
      return hasItems;
    });

    console.log('🔍 Final restaurant services with items:', {
      totalServices: restaurantServices.length,
      servicesWithItems: servicesWithActualItems.length,
      filteredServices: servicesWithActualItems.map(s => ({
        name: s.name,
        itemCount: s.menuItems?.length || 0,
        categories: [...new Set(s.menuItems?.map(item => item.category) || [])]
      }))
    });

    res.json({
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
    logger.error('Get restaurant services error:', error);
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
      location,
      paymentMethod = 'online' // Add payment method selection
    } = req.body;

    // Validate payment method
    if (!['online', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be either "online" or "cash".'
      });
    }

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

    // Validate schedule
    if (!schedule || !schedule.preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'Schedule with preferred date is required'
      });
    }

    // Validate date format
    const parsedDate = new Date(schedule.preferredDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferred date format'
      });
    }

    // Validate that booking date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past'
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
      serviceType: 'laundry', // Set the service type for the booking

      // Guest details
      guestDetails: {
        firstName: user.firstName,
        lastName: user.lastName || user.firstName || 'Guest', // Ensure lastName is never empty
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
        quantity: laundryItems.length,        laundryItems: laundryItems.map(item => {
          // Parse duration if provided, otherwise use default
          let durationObj = { value: 24, unit: 'hours' }; // default

          if (item.serviceTypeDuration) {
            if (typeof item.serviceTypeDuration === 'object' && item.serviceTypeDuration.value) {
              // Already in correct format
              durationObj = item.serviceTypeDuration;
            } else if (typeof item.serviceTypeDuration === 'string') {
              // Parse string like "24 hours" or "12 hours"
              const match = item.serviceTypeDuration.match(/(\d+)\s*(hours?|minutes?|days?)/i);
              if (match) {
                durationObj = {
                  value: parseInt(match[1]),
                  unit: match[2].toLowerCase()
                };
              }
            }
          }

          return {
            itemName: item.itemName,
            itemId: item.itemId,
            itemCategory: item.itemCategory,
            itemIcon: item.itemIcon,
            quantity: item.quantity,
            serviceType: {
              id: item.serviceTypeId,
              name: item.serviceTypeName,
              description: item.serviceTypeDescription,
              duration: durationObj,
              icon: item.serviceTypeIcon
            },
            basePrice: item.basePrice || item.totalPrice || 0,
            finalPrice: item.totalPrice
          };
        }),
        isExpressService: expressSurcharge?.enabled || false,
        specialRequests: guestDetails?.specialRequests || ''
      },      // Scheduling
      schedule: {
        preferredDate: parsedDate,
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
        currency: 'EGP',        providerEarnings: providerEarnings,
        hotelEarnings: hotelEarnings
      },

      status: paymentMethod === 'cash' ? 'confirmed' : 'pending', // Cash bookings are confirmed immediately

      // Payment information with method selection
      payment: {
        paymentMethod,
        method: paymentMethod === 'online' ? 'credit-card' : 'cash',
        status: paymentMethod === 'cash' ? 'completed' : 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending'
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

    // Create appropriate response message based on payment method
    const successMessage = paymentMethod === 'cash'
      ? 'Laundry booking created successfully. Payment will be collected at the hotel.'
      : 'Laundry booking created successfully. Please proceed to payment.';

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          totalAmount: totalAmount,
          schedule: booking.schedule,
          serviceName: service.name,
          providerName: service.providerId.businessName,
          paymentMethod,
          requiresPayment: paymentMethod === 'online'
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
      location,
      paymentMethod = 'online' // Add payment method selection
    } = req.body;

    // Validate payment method
    if (!['online', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be either "online" or "cash".'
      });
    }

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

    // Validate schedule
    if (!schedule || !schedule.pickupDate || !schedule.pickupTime) {
      return res.status(400).json({
        success: false,
        message: 'Schedule with pickup date and time is required'
      });
    }

    // Validate date format
    const parsedDate = new Date(schedule.pickupDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup date format'
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.pickupTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup time format. Please use HH:MM format (e.g., 14:30)'
      });
    }

    // Validate that booking date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date cannot be in the past'
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

    // Create booking with validated date
    const scheduledDate = new Date(`${parsedDate.toISOString().split('T')[0]}T${schedule.pickupTime}:00.000Z`);

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
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
      status: paymentMethod === 'cash' ? 'confirmed' : 'pending', // Cash bookings are confirmed immediately
      notes: guestDetails.specialRequests || '',

      // Payment information with method selection
      payment: {
        paymentMethod,
        method: paymentMethod === 'online' ? 'credit-card' : 'cash',
        status: paymentMethod === 'cash' ? 'completed' : 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending'
      }
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

    // Send WhatsApp notifications
    try {
      // Send confirmation to guest via WhatsApp
      if (req.user.phone) {
        await sendTransportationBookingConfirmation({
          guestName: `${req.user.firstName} ${req.user.lastName || ''}`,
          guestPhone: req.user.phone,
          bookingNumber,
          hotelName: hotel.name,
          serviceProviderName: service.providerId.businessName,
          vehicleType: transportationItems[0]?.vehicleType || 'مركبة',
          tripDate: schedule.pickupDate,
          departureTime: schedule.pickupTime,
          pickupLocation: location.pickupLocation,
          destinationLocation: location.dropoffLocation,
          totalAmount: totalAmount,
          paymentStatus: 'في انتظار الدفع'
        });
        logger.info('WhatsApp transportation booking confirmation sent to guest', {
          bookingNumber,
          guestPhone: req.user.phone
        });
      }

      // Send notification to service provider via WhatsApp
      if (service.providerId.phone) {
        await sendNewTransportationOrderToProvider({
          providerPhone: service.providerId.phone,
          bookingNumber,
          guestName: `${req.user.firstName} ${req.user.lastName || ''}`,
          hotelName: hotel.name,
          guestPhone: req.user.phone,
          tripDate: schedule.pickupDate,
          departureTime: schedule.pickupTime,
          pickupLocation: location.pickupLocation,
          destinationLocation: location.dropoffLocation,
          vehicleType: transportationItems[0]?.vehicleType || 'مركبة',
          passengerCount: guestDetails.passengerCount || 1,
          baseAmount: providerEarnings
        });
        logger.info('WhatsApp transportation order notification sent to provider', {
          bookingNumber,
          providerPhone: service.providerId.phone
        });
      }
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp notifications for transportation booking', {
        error: whatsappError.message,
        bookingNumber
      });
      // Don't fail the booking if WhatsApp fails
    }

    // Create appropriate response message based on payment method
    const successMessage = paymentMethod === 'cash'
      ? 'Transportation booking created successfully. Payment will be collected at pickup.'
      : 'Transportation booking created successfully. Please proceed to payment.';

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          totalAmount: booking.totalAmount,
          scheduledDate: booking.scheduledDate,
          status: booking.status,
          providerName: service.providerId.businessName,
          paymentMethod,
          requiresPayment: paymentMethod === 'online'
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

/**
 * Client Housekeeping Services Routes
 */

/**
 * @desc    Get housekeeping services for a hotel
 * @route   GET /api/client/hotels/:hotelId/housekeeping-services
 * @access  Public
 */
router.get('/hotels/:hotelId/housekeeping-services', async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Add cache-busting headers to prevent stale service data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    logger.info('🏨 Housekeeping services request:', {
      hotelId,
      timestamp: new Date().toISOString()
    });

    // Verify hotel exists and is active
    const hotel = await Hotel.findOne({ _id: hotelId, isActive: true, isPublished: true });
    if (!hotel) {
      logger.warn('❌ Hotel not found for housekeeping services:', { hotelId });
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    logger.info('✅ Hotel found:', {
      hotelId: hotel._id,
      hotelName: hotel.name
    });

    // Get all housekeeping services from Service collection for this hotel
    const services = await Service.find({
      hotelId: hotelId,
      category: 'housekeeping',
      isActive: true
    }).populate('providerId', 'businessName rating').sort({ createdAt: -1 });

    logger.info('📤 Returning housekeeping services to guest:', {
      hotelId,
      servicesCount: services.length,
      servicesList: services.map(s => s.name)
    });

    res.status(200).json({
      success: true,
      data: services,
      hotel: {
        id: hotel._id,
        name: hotel.name
      }
    });

  } catch (error) {
    logger.error('Get housekeeping services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Book a housekeeping service
 * @route   POST /api/client/bookings/housekeeping
 * @access  Public (but can use authentication if available)
 */
router.post('/bookings/housekeeping', async (req, res) => {
  try {
    // Check if user is authenticated (optional)
    let authenticatedUser = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          authenticatedUser = user;
          console.log('🔧 Housekeeping booking - Authenticated user found:', user.email);
        }
      } catch (error) {
        // Token is invalid, but that's okay - continue as non-authenticated
        console.log('🔧 Housekeeping booking - No valid authentication, continuing as guest');
      }
    }

    console.log('🔧 Housekeeping booking creation - Request body:', req.body);

    const {
      serviceId,
      serviceName,
      serviceCategory,
      specificCategory, // Add the new specific category field
      hotelId,
      guestName,
      roomNumber,
      phoneNumber,
      preferredTime,
      scheduledDateTime,
      specialRequests,
      guestEmail,
      estimatedDuration
    } = req.body;

    // Validate required fields
    if (!serviceId && !serviceName) {
      return res.status(400).json({
        success: false,
        message: 'Service ID or service name is required'
      });
    }

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required'
      });
    }

    // Validate schedule if provided
    if (scheduledDateTime) {
      const parsedDate = new Date(scheduledDateTime);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scheduled date format'
        });
      }

      // Validate that booking date is not in the past (allow same day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);

      if (parsedDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date cannot be in the past'
        });
      }
    }

    console.log('🔧 Housekeeping booking - Extracted data:', {
      serviceId, serviceName, hotelId, guestName, roomNumber, phoneNumber
    });

    // Verify hotel exists
    const hotel = await Hotel.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      console.log('🔧 Housekeeping booking - Hotel not found:', hotelId);
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    console.log('🔧 Housekeeping booking - Hotel found:', hotel.name);
    console.log('🔧 Housekeeping booking - Hotel phone:', hotel.phone);

    // Handle both database services and generic/custom frontend services
    let service = null;
    let serviceProvider = null;

    if (serviceId) {
      // Find service by ID
      service = await Service.findById(serviceId).populate('providerId');
      if (!service) {
        console.log('🔧 Housekeeping booking - Service not found by ID:', serviceId);
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      serviceProvider = service.providerId;
      console.log('🔧 Housekeeping booking - Database service found by ID:', service.name);
      console.log('🔧 Housekeeping booking - Service provider:', serviceProvider?.businessName);
    } else {
      // No serviceId provided, find service by name and category
      console.log('🔧 Housekeeping booking - Finding service by name and category:', { serviceName, serviceCategory });

      // Find service providers for this hotel that offer housekeeping services
      const serviceProviders = await ServiceProvider.find({
        hotelId: hotelId,
        categories: { $in: ['housekeeping', 'cleaning'] }
      });

      if (serviceProviders.length === 0) {
        console.log('🔧 Housekeeping booking - No housekeeping providers found for hotel');
        return res.status(404).json({
          success: false,
          message: 'No housekeeping service providers available for this hotel'
        });
      }

      // Find the specific service by category and subcategory from these providers
      // Map frontend categories to database categories and subcategories
      const categoryMapping = {
        'cleaning': { category: 'housekeeping', subcategory: 'cleaning' },
        'amenities': { category: 'housekeeping', subcategory: 'amenities' },
        'maintenance': { category: 'housekeeping', subcategory: 'maintenance' },
        'housekeeping': { category: 'housekeeping', subcategory: null },
        'laundry': { category: 'laundry', subcategory: null },
        'transportation': { category: 'transportation', subcategory: null }
      };

      const mapping = categoryMapping[serviceCategory] || { category: serviceCategory, subcategory: null };
      console.log('🔧 Housekeeping booking - Mapped category:', serviceCategory, '->', mapping);

      // Build search criteria
      const searchCriteria = {
        category: mapping.category,
        providerId: { $in: serviceProviders.map(sp => sp._id) },
        isActive: true,
        isApproved: true
      };

      // Add subcategory if specified
      if (mapping.subcategory) {
        searchCriteria.subcategory = mapping.subcategory;
      }

      // For housekeeping services, also filter by serviceType
      if (mapping.category === 'housekeeping') {
        searchCriteria.serviceType = 'housekeeping';
      }

      service = await Service.findOne(searchCriteria).populate('providerId');

      console.log('🔧 Housekeeping booking - Search criteria:', searchCriteria);

      if (!service) {
        console.log('🔧 Housekeeping booking - No matching service found:', { serviceName, serviceCategory });
        return res.status(404).json({
          success: false,
          message: `No ${serviceName} service available for this hotel`
        });
      }

      serviceProvider = service.providerId;
      console.log('🔧 Housekeeping booking - Service found by name/category:', service.name);
      console.log('🔧 Housekeeping booking - Service provider:', serviceProvider?.businessName);
    }

    // Create booking with all required fields for housekeeping services
    const bookingData = {
      // Core booking fields - handle both custom and real services
      serviceId: service ? service._id : new mongoose.Types.ObjectId(),
      serviceName: service ? service.name : serviceName,
      serviceType: 'housekeeping',
      category: serviceCategory || 'cleaning', // Store the housekeeping category at the top level
      hotel: hotelId,
      hotelId: hotelId,

      // Use authenticated user ID if available, otherwise create dummy ID
      guestId: authenticatedUser ? authenticatedUser._id : new mongoose.Types.ObjectId(),
      serviceProviderId: serviceProvider._id, // Use the actual service provider ID

      // Guest Information (mapped from our housekeeping form)
      guestDetails: {
        firstName: guestName.split(' ')[0] || guestName,
        lastName: guestName.split(' ').slice(1).join(' ') || 'Guest',
        email: guestEmail || 'no-email@housekeeping.local',
        phone: phoneNumber,
        roomNumber: roomNumber
      },

      // Service Details - store the actual housekeeping category
      serviceDetails: {
        name: service ? service.name : serviceName,
        category: 'housekeeping', // Use 'housekeeping' since that's what the Booking model expects
        specificCategory: specificCategory // Add the specific category for analysis
      },

      // Booking Configuration
      bookingConfig: {
        quantity: 1
      },

      // Schedule - use actual preferred time from request
      schedule: {
        preferredDate: scheduledDateTime ? new Date(scheduledDateTime) : new Date(),
        preferredTime: (() => {
          // Convert special time values to valid HH:MM format
          if (preferredTime === 'now' || preferredTime === 'ASAP') {
            return '09:00'; // Default to 9 AM for ASAP requests
          }
          // If preferredTime is already in HH:MM format, use it
          if (preferredTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(preferredTime)) {
            return preferredTime;
          }
          // Default fallback
          return '09:00';
        })()
      },

      // Pricing (all zero for housekeeping)
      pricing: {
        basePrice: 0,
        quantity: 1,
        subtotal: 0,
        markup: {
          percentage: 0,
          amount: 0
        },
        totalBeforeMarkup: 0,
        totalAmount: 0,
        providerEarnings: 0,
        hotelEarnings: 0
      },

      // Payment - use valid enum values
      payment: {
        method: 'cash', // Use 'cash' as valid enum value for free services
        status: 'completed' // Use 'completed' since it's free
      },

      // Housekeeping specific details
      bookingDetails: {
        preferredTime: preferredTime,
        scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : null,
        specialRequests: specialRequests,
        estimatedDuration: estimatedDuration || 30
      },

      status: 'pending',
      bookingDate: new Date(),
      totalAmount: 0, // Housekeeping services are free
      paymentStatus: 'completed' // Since it's free, mark as completed
    };

    console.log('🔧 Housekeeping booking - Creating booking with data:', bookingData);

    const booking = new Booking(bookingData);

    console.log('🔧 Housekeeping booking - Before save, booking object:', booking);
    await booking.save();
    console.log('🔧 Housekeeping booking - After save, booking ID:', booking._id);

    // Log the booking
    logger.info('Housekeeping service booked:', {
      bookingId: booking._id,
      serviceId,
      serviceName,
      hotelId,
      guestName,
      roomNumber,
      preferredTime
    });

    // Send confirmation email if email provided
    if (guestEmail) {
      try {
        await sendEmail({
          to: guestEmail,
          subject: `Housekeeping Service Booking Confirmation - ${hotel.name}`,
          html: `
            <h2>Housekeeping Service Booking Confirmed</h2>
            <p>Dear ${guestName},</p>
            <p>Your housekeeping service request has been received and confirmed.</p>

            <h3>Booking Details:</h3>
            <ul>
              <li><strong>Service:</strong> ${serviceName}</li>
              <li><strong>Hotel:</strong> ${hotel.name}</li>
              <li><strong>Room:</strong> ${roomNumber}</li>
              <li><strong>Phone:</strong> ${phoneNumber}</li>
              <li><strong>Timing:</strong> ${preferredTime === 'now' ? 'As Soon As Possible' : 'Scheduled'}</li>
              ${scheduledDateTime ? `<li><strong>Scheduled Time:</strong> ${new Date(scheduledDateTime).toLocaleString()}</li>` : ''}
              ${specialRequests ? `<li><strong>Special Requests:</strong> ${specialRequests}</li>` : ''}
            </ul>

            <p>Our housekeeping team will contact you shortly to confirm the service timing.</p>
            <p>This service is provided at no additional charge.</p>

            <p>Thank you for choosing ${hotel.name}!</p>
          `
        });
      } catch (emailError) {
        logger.error('Failed to send housekeeping booking confirmation email:', emailError);
      }
    }

    // Send WhatsApp confirmation to guest if phone number provided
    if (phoneNumber) {
      try {
        await sendHousekeepingBookingConfirmation({
          guestName,
          guestPhone: phoneNumber,
          bookingNumber: booking._id.toString(),
          hotelName: hotel.name,
          serviceType: serviceName,
          preferredTime: preferredTime === 'now' ? 'في أقرب وقت ممكن' : (scheduledDateTime ? new Date(scheduledDateTime).toLocaleString('ar-SA') : 'حسب الوقت المحدد'),
          roomNumber,
          specialRequests: specialRequests || 'لا توجد ملاحظات خاصة'
        });
        logger.info('WhatsApp housekeeping booking confirmation sent to guest');
      } catch (whatsappError) {
        logger.error('Failed to send WhatsApp housekeeping booking confirmation:', whatsappError);
        // Don't fail the booking if WhatsApp fails
      }
    }

    // Send WhatsApp notification to housekeeping team/service provider
    // Find the specific service provider who created this housekeeping service
    try {
      let serviceProvider = null;

      // First, try to find the service provider who has this specific service
      if (serviceId && serviceId.startsWith('custom-')) {
        console.log('🔧 Looking for service provider with specific serviceId:', serviceId);

        const providers = await ServiceProvider.find({
          hotelId: hotelId,
          isActive: true,
          'housekeepingServices.id': serviceId
        });

        console.log('🔧 Found providers with this service:', providers.length);

        if (providers.length > 0) {
          serviceProvider = providers[0]; // Take the first one
          console.log('🔧 Using provider who created this service:', {
            businessName: serviceProvider.businessName,
            id: serviceProvider._id
          });
        }
      }

      // If no specific provider found by serviceId, fallback to laundry category providers
      if (!serviceProvider) {
        console.log('🔧 Falling back to laundry category provider search');

        serviceProvider = await ServiceProvider.findOne({
          hotelId: hotelId,
          isActive: true,
          categories: { $in: ['laundry'] } // Housekeeping is under laundry category
        });

        // If no laundry provider found, try any active provider for this hotel
        if (!serviceProvider) {
          serviceProvider = await ServiceProvider.findOne({
            hotelId: hotelId,
            isActive: true
          });
          console.log('🔧 No laundry provider found, using any available provider for hotel:', hotelId);
        }
      }

      console.log('🔧 Searching for housekeeping service provider for hotel:', hotelId);
      console.log('🔧 Found service provider:', serviceProvider ? {
        businessName: serviceProvider.businessName,
        _id: serviceProvider._id,
        phone: serviceProvider.phone
      } : 'None found');

      let housekeepingProvider = null;
      let providerPhone = null;

      if (serviceProvider) {
        // First try to use the phone from ServiceProvider model
        if (serviceProvider.phone) {
          providerPhone = serviceProvider.phone;
          console.log('🔧 Using ServiceProvider phone directly:', providerPhone);
        } else {
          // If no phone in ServiceProvider, try to find the User that references this ServiceProvider
          housekeepingProvider = await User.findOne({
            role: 'service',
            serviceProviderId: serviceProvider._id,
            isActive: true
          });

          console.log('🔧 Found housekeeping provider user:', housekeepingProvider ? {
            name: housekeepingProvider.firstName,
            phone: housekeepingProvider.phone,
            serviceProviderId: housekeepingProvider.serviceProviderId
          } : 'None found');

          if (housekeepingProvider && housekeepingProvider.phone) {
            providerPhone = housekeepingProvider.phone;
            console.log('🔧 Using User phone:', providerPhone);
          }
        }
      }

      // Format phone number and add fallback logic
      if (!providerPhone) {
        // Fallback to hotel phone if no service provider phone found
        providerPhone = hotel.phone;
        console.log('🔧 Using hotel phone as fallback:', providerPhone);
      }

      if (providerPhone) {
        // Ensure phone number is in international format for WhatsApp
        if (!providerPhone.startsWith('+')) {
          providerPhone = '+' + providerPhone;
        }
        console.log('🔧 Final provider phone for WhatsApp:', providerPhone);

        await sendNewHousekeepingOrderToProvider({
          providerPhone: providerPhone,
          bookingNumber: booking._id.toString(),
          guestName,
          hotelName: hotel.name,
          roomNumber,
          guestPhone: phoneNumber,
          serviceType: serviceName,
          preferredTime: preferredTime === 'now' ? 'في أقرب وقت ممكن' : 'حسب الموعد المحدد',
          scheduledTime: scheduledDateTime ? new Date(scheduledDateTime).toLocaleString('ar-SA') : null,
          estimatedDuration: estimatedDuration || 30,
          specialRequests: specialRequests || 'لا توجد ملاحظات خاصة'
        });
        logger.info('WhatsApp housekeeping order notification sent to provider');
      }
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp housekeeping order notification to provider:', whatsappError);
      // Don't fail the booking if WhatsApp fails
    }

    res.status(201).json({
      success: true,
      data: {
        bookingId: booking._id,
        serviceName: serviceName,
        guestName: guestName,
        roomNumber: roomNumber,
        status: booking.status,
        hotelName: hotel.name
      },
      message: 'Housekeeping service booked successfully'
    });

  } catch (error) {
    logger.error('Create housekeeping booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get housekeeping booking status
 * @route   GET /api/client/bookings/housekeeping/:bookingId
 * @access  Public
 */
router.get('/bookings/housekeeping/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      serviceType: 'housekeeping'
    }).populate('hotel', 'name location phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: booking._id,
        serviceName: booking.serviceName,
        status: booking.status,
        bookingDate: booking.bookingDate,
        guestInfo: booking.guestInfo,
        bookingDetails: booking.bookingDetails,
        hotel: booking.hotel,
        statusHistory: booking.statusHistory || []
      }
    });

  } catch (error) {
    logger.error('Get housekeeping booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Update booking payment method
 * @route   PUT /api/client/bookings/:id/payment-method
 * @access  Private/Guest
 */
router.put('/bookings/:id/payment-method', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    // Validate payment method
    if (!['online', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be either "online" or "cash".'
      });
    }

    // Find the booking
    const booking = await Booking.findOne({
      _id: id,
      guestId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update payment method
    booking.payment.paymentMethod = paymentMethod;
    booking.payment.method = paymentMethod === 'online' ? 'credit-card' : 'cash';

    // Update booking status based on payment method
    if (paymentMethod === 'cash') {
      booking.status = 'pending'; // Use valid status value
      booking.payment.paymentStatus = 'pending';
    } else {
      booking.status = 'pending';
      booking.payment.paymentStatus = 'pending';
    }

    await booking.save();

    // Log the change
    logger.info('Payment method updated', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      paymentMethod,
      guestId: req.user.id
    });

    res.json({
      success: true,
      message: paymentMethod === 'cash'
        ? 'Payment method updated to cash. Payment will be collected at the hotel.'
        : 'Payment method updated to online payment.',
      data: {
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          paymentMethod: booking.payment.paymentMethod,
          paymentStatus: booking.payment.paymentStatus
        }
      }
    });

  } catch (error) {
    logger.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment method'
    });
  }
});

// Import and use feedback routes
const feedbackRoutes = require('./feedback');
router.use('/', feedbackRoutes);

module.exports = router;
