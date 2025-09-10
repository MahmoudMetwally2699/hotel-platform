/**
 * Kashier.io Payment Integration Routes
 * Handles payment processing for transportation bookings using Kashier.io
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const TransportationBooking = require('../models/TransportationBooking');
const Booking = require('../models/Booking'); // Add laundry booking model
const User = require('../models/User'); // Add user model for guest details
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');
const whatsapp = require('../utils/whatsapp');

// Kashier.io configuration
const KASHIER_CONFIG = {
  apiUrl: process.env.KASHIER_API_URL || 'https://checkout.kashier.io',
  merchantId: process.env.KASHIER_MERCHANT_ID,
  apiKey: process.env.KASHIER_API_KEY,
  secretKey: process.env.KASHIER_SECRET_KEY,
  currency: process.env.KASHIER_CURRENCY || 'EGP',
  mode: process.env.KASHIER_MODE || 'test'
};

/**
 * @desc    Create Kashier payment session
 * @route   POST /api/payments/kashier/create-session
 * @access  Private/Guest
 */
router.post('/create-session', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { bookingId, bookingType = 'transportation' } = req.body;

    console.log('🔵 Create Kashier session request:', { bookingId, bookingType, userId: req.user._id });

    if (!bookingId) {
      console.log('❌ Booking ID missing');
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    let booking;
    let BookingModel;

    // Determine which model to use based on booking type
    if (bookingType === 'laundry') {
      BookingModel = Booking;
      booking = await Booking.findOne({
        _id: bookingId,
        guestId: req.user._id,
        status: { $in: ['pending', 'payment_pending'] }
      }).populate('guestId', 'firstName lastName email phone')
        .populate('hotelId', 'name');
    } else {
      // Default to transportation
      BookingModel = TransportationBooking;
      booking = await TransportationBooking.findOne({
        _id: bookingId,
        guestId: req.user._id,
        bookingStatus: { $in: ['quote_accepted', 'payment_pending'] }
      }).populate('guest', 'firstName lastName email phone')
        .populate('hotel', 'name');
    }

    console.log('🔍 Booking lookup result:', {
      found: !!booking,
      bookingId: bookingId,
      userId: req.user._id,
      bookingStatus: booking?.bookingStatus || booking?.status,
      hasQuote: !!booking?.quote,
      hasPricing: !!booking?.pricing
    });

    if (!booking) {
      console.log('❌ Booking not found or not ready for payment');
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not ready for payment'
      });
    }

    // Validate payment amount based on booking type
    let paymentAmount;
    if (bookingType === 'laundry') {
      if (!booking.pricing || !booking.pricing.total) {
        console.log('❌ No valid pricing found for laundry booking:', {
          hasPricing: !!booking.pricing,
          total: booking.pricing?.total
        });
        return res.status(400).json({
          success: false,
          message: 'No valid pricing found for this booking'
        });
      }
      paymentAmount = booking.pricing.total;
    } else {
      // Transportation booking
      if (!booking.quote || (!booking.payment.totalAmount && !booking.quote.finalPrice)) {
        console.log('❌ No valid quote or payment amount found:', {
          hasQuote: !!booking.quote,
          finalPrice: booking.quote?.finalPrice,
          totalAmount: booking.payment?.totalAmount
        });
        return res.status(400).json({
          success: false,
          message: 'No valid quote or payment amount found for this booking'
        });
      }
      paymentAmount = booking.payment.totalAmount || booking.quote.finalPrice;
    }

    // Get URLs with fallbacks
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://hotel-platform-teud.vercel.app';
    const backendUrl = process.env.BACKEND_URL || frontendUrl; // Use same as frontend if backend URL not set

    console.log('🌐 URLs being used:', { frontendUrl, backendUrl });

    const paymentData = {
      merchantId: KASHIER_CONFIG.merchantId,
      orderId: booking.bookingReference,
      amount: paymentAmount,
      currency: KASHIER_CONFIG.currency,
      mode: KASHIER_CONFIG.mode,
      merchantRedirect: `${frontendUrl}/guest/payment-success?booking=${booking._id}`,
      failureRedirect: `${frontendUrl}/guest/payment-failed?booking=${booking._id}`,
      serverWebhook: `${backendUrl}/api/payments/kashier/webhook`
    };

    console.log('💰 Payment data prepared:', {
      merchantId: paymentData.merchantId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderId: paymentData.orderId,
      mode: paymentData.mode
    });

    // Generate hash signature for Kashier.io
    const hash = generateKashierHash(paymentData);
    paymentData.hash = hash;

    console.log('🔒 Hash generated:', { hash: hash ? 'Generated' : 'Failed' });

    // Create payment session with Kashier.io
    console.log('🌐 Creating Kashier payment session');

    // Since Kashier API endpoints are not working, use hosted payment page approach
    // Generate payment URL directly
    const paymentUrl = `${KASHIER_CONFIG.apiUrl}?${new URLSearchParams(paymentData).toString()}`;

    console.log('💳 Generated payment URL:', paymentUrl);

    // Update booking with Kashier session information
    await booking.createKashierPaymentSession(
      booking.bookingReference, // Use booking reference as session ID
      paymentUrl
    );

    logger.info('Kashier payment session created (hosted page)', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      orderId: booking.bookingReference,
      amount: paymentAmount,
      currency: KASHIER_CONFIG.currency,
      paymentUrl: paymentUrl
    });

    res.json({
      success: true,
      message: 'Payment session created successfully',
      data: {
        sessionId: booking.bookingReference,
        paymentUrl: paymentUrl,
        amount: paymentAmount,
        currency: KASHIER_CONFIG.currency,
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.bookingStatus
        }
      }
    });

  } catch (error) {
    console.log('❌ Create Kashier payment session error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    logger.error('Create Kashier payment session error:', error);

    // Handle Kashier API errors
    if (error.response && error.response.data) {
      return res.status(400).json({
        success: false,
        message: 'Payment session creation failed',
        error: error.response.data.message || 'Kashier API error',
        debug: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating payment session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Create Kashier payment session with booking data (pay-first flow)
 * @route   POST /api/payments/kashier/create-payment-session
 * @access  Private/Guest
 */
router.post('/create-payment-session', protect, restrictTo('guest'), async (req, res) => {
  try {
  const { bookingData, bookingType = 'laundry', amount } = req.body;
  const currency = 'EGP';

    console.log('🔵 Create direct payment session request:', { bookingType, amount, userId: req.user._id });

    if (!bookingData || !amount) {
      console.log('❌ Booking data or amount missing');
      return res.status(400).json({
        success: false,
        message: 'Booking data and amount are required'
      });
    }

    // Generate a temporary booking reference for payment tracking
    const tempBookingRef = `TEMP_${bookingType.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Construct URLs with proper fallbacks
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://hotel-platform-teud.vercel.app';
    const backendUrl = process.env.BACKEND_URL || process.env.API_BASE_URL || frontendUrl;

    console.log('🌐 URLs being used for payment session:', { frontendUrl, backendUrl });

    // Create Kashier payment payload (match EXACTLY the working transportation format)
    const paymentData = {
      merchantId: KASHIER_CONFIG.merchantId,
      orderId: tempBookingRef,
      amount: amount,
      currency: currency,
      mode: KASHIER_CONFIG.mode,
      merchantRedirect: `${frontendUrl}/guest/payment-success?bookingRef=${tempBookingRef}`,
      failureRedirect: `${frontendUrl}/guest/payment-failed?bookingRef=${tempBookingRef}`,
      serverWebhook: `${backendUrl}/api/payments/kashier/webhook`
      // REMOVED: customerName, customerEmail, customerPhone, description, customFields
      // These extra parameters were causing Kashier to reject the URL
    };

    // Store the booking data separately for webhook processing
    // We'll store this in memory or a temporary storage since we can't pass it in the URL
    global.tempBookingData = global.tempBookingData || {};
    global.tempBookingData[tempBookingRef] = {
      bookingType,
      bookingData,
      guestId: req.user._id,
      tempBookingRef
    };

    console.log('💰 Payment data prepared:', {
      merchantId: paymentData.merchantId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderId: paymentData.orderId,
      mode: paymentData.mode
    });

    // Generate hash signature for Kashier.io
    const hash = generateKashierHash(paymentData);
    paymentData.hash = hash;

    console.log('🔒 Hash generated:', { hash: hash ? 'Generated' : 'Failed' });

    // Try using the simple URL construction like the original working version
    const paymentUrl = `${KASHIER_CONFIG.apiUrl}?${new URLSearchParams(paymentData).toString()}`;

    console.log('💳 Generated direct payment URL:', paymentUrl);

    logger.info('Kashier direct payment session created', {
      tempBookingRef,
      bookingType,
      amount,
      currency,
      paymentUrl
    });

    res.json({
      success: true,
      message: 'Payment session created successfully',
      data: {
        sessionId: tempBookingRef,
        paymentUrl: paymentUrl,
        amount: amount,
        currency: currency,
        tempBookingRef
      }
    });

  } catch (error) {
    console.log('❌ Create direct payment session error:', error);
    logger.error('Create direct payment session error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while creating payment session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Handle Kashier webhook notifications
 * @route   POST /api/payments/kashier/webhook
 * @access  Public (but secured with signature verification)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    const kashierSignature = req.get('x-kashier-signature');

    logger.info('Kashier webhook received', {
      event: event,
      merchantOrderId: data?.merchantOrderId,
      status: data?.status,
      transactionId: data?.transactionId,
      amount: data?.amount
    });

    // Verify webhook signature
    if (KASHIER_CONFIG.apiKey && !verifyKashierWebhookSignature(data, kashierSignature)) {
      logger.error('Kashier webhook signature verification failed', {
        merchantOrderId: data?.merchantOrderId,
        receivedSignature: kashierSignature
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Handle different event types
    if (event === 'pay' || event === 'authorize') {
      // Check if this is a temporary booking reference (pay-first flow)
      if (data.merchantOrderId && data.merchantOrderId.startsWith('TEMP_')) {
        try {
          // Get booking data from temporary storage (since we can't pass custom_fields in URL)
          global.tempBookingData = global.tempBookingData || {};
          const tempData = global.tempBookingData[data.merchantOrderId];

          if (tempData && tempData.bookingData && data.status === 'SUCCESS') {
            console.log('🔵 Processing pay-first booking creation for:', data.merchantOrderId);

            const { bookingData, bookingType, guestId } = tempData;
            let newBooking;

            if (bookingType === 'laundry') {
              // Create the actual laundry booking after successful payment
              newBooking = new Booking({
                ...bookingData,
                guestId: guestId,
                status: 'payment_completed',
                bookingNumber: `LAU${Date.now()}`,
                payment: {
                  method: 'credit-card',
                  status: 'completed',
                  paidAmount: data.amount,
                  paymentDate: new Date(),
                  transactionId: data.transactionId
                },
                kashier: {
                  sessionId: data.merchantOrderId,
                  transactionId: data.transactionId,
                  webhookData: data
                }
              });

              await newBooking.save();

              logger.info('Laundry booking created after payment', {
                bookingId: newBooking._id,
                bookingNumber: newBooking.bookingNumber,
                amount: data.amount,
                transactionId: data.transactionId
              });

              // Update booking status to confirmed
              newBooking.status = 'confirmed';
              await newBooking.save();

              // Clean up temporary booking data
              delete global.tempBookingData[data.merchantOrderId];
            } else if (bookingType === 'restaurant') {
              // Create the actual restaurant booking after successful payment
              newBooking = new Booking({
                ...bookingData,
                guestId: guestId,
                category: 'restaurant',
                status: 'payment_completed',
                bookingNumber: `REST${Date.now()}`,
                payment: {
                  method: 'credit-card',
                  status: 'completed',
                  paidAmount: data.amount,
                  paymentDate: new Date(),
                  transactionId: data.transactionId
                },
                kashier: {
                  sessionId: data.merchantOrderId,
                  transactionId: data.transactionId,
                  webhookData: data
                }
              });

              await newBooking.save();

              logger.info('Restaurant booking created after payment', {
                bookingId: newBooking._id,
                bookingNumber: newBooking.bookingNumber,
                amount: data.amount,
                transactionId: data.transactionId
              });

              // Update booking status to confirmed
              newBooking.status = 'confirmed';
              await newBooking.save();

              // Clean up temporary booking data
              delete global.tempBookingData[data.merchantOrderId];
            }

                  // WhatsApp notification logic (guest & provider)
                  try {
                    // Fetch guest and hotel details for WhatsApp
                    const guest = await User.findById(newBooking.guestId);
                    const hotel = await mongoose.model('Hotel').findById(newBooking.hotelId);
                    const service = await mongoose.model('Service').findById(newBooking.serviceId).populate('providerId');

                    // Send confirmation to guest
                    if (guest?.phone) {
                      try {
                        await whatsapp.sendLaundryBookingConfirmation({
                          guestName: `${guest.firstName} ${guest.lastName || ''}`,
                          guestPhone: guest.phone,
                          bookingNumber: newBooking.bookingNumber,
                          hotelName: hotel?.name || '',
                          serviceProviderName: service?.providerId?.businessName || '',
                          serviceType: service?.name || '',
                          pickupDate: new Date(newBooking.schedule?.preferredDate).toLocaleDateString('ar-EG'),
                          pickupTime: newBooking.schedule?.preferredTime || 'سيتم التأكيد',
                          roomNumber: newBooking.guestDetails?.roomNumber || '',
                          totalAmount: newBooking.pricing?.total || '',
                          paymentStatus: 'تم الدفع'
                        });
                        logger.info('WhatsApp booking confirmation sent to guest (webhook)', {
                          bookingNumber: newBooking.bookingNumber,
                          guestPhone: guest.phone
                        });
                      } catch (waGuestErr) {
                        logger.error('WhatsApp guest notification error (webhook)', {
                          error: waGuestErr.message,
                          bookingNumber: newBooking.bookingNumber
                        });
                      }
                    }

                    // Send notification to service provider
                    if (service?.providerId?.phone) {
                      try {
                        await whatsapp.sendNewLaundryOrderToProvider({
                          providerPhone: service.providerId.phone,
                          bookingNumber: newBooking.bookingNumber,
                          guestName: `${guest.firstName} ${guest.lastName || ''}`,
                          hotelName: hotel?.name || '',
                          roomNumber: newBooking.guestDetails?.roomNumber || '',
                          guestPhone: guest.phone,
                          pickupDate: new Date(newBooking.schedule?.preferredDate).toLocaleDateString('ar-EG'),
                          pickupTime: newBooking.schedule?.preferredTime || 'سيتم التأكيد',
                          serviceType: service?.name || '',
                          specialNotes: newBooking.guestDetails?.specialRequests || '',
                          baseAmount: newBooking.pricing?.subtotal || ''
                        });
                        logger.info('WhatsApp order notification sent to provider (webhook)', {
                          bookingNumber: newBooking.bookingNumber,
                          providerPhone: service.providerId.phone
                        });
                      } catch (waProviderErr) {
                        logger.error('WhatsApp provider notification error (webhook)', {
                          error: waProviderErr.message,
                          bookingNumber: newBooking.bookingNumber
                        });
                      }
                    }
                  } catch (whatsappError) {
                    logger.error('Failed to send WhatsApp notifications (webhook)', {
                      error: whatsappError.message,
                      bookingNumber: newBooking.bookingNumber
                    });
                  }
            return res.json({
              success: true,
              message: 'Payment processed and booking created successfully'
            });
          }
        } catch (error) {
          logger.error('Error processing pay-first booking:', error);
          return res.status(500).json({
            success: false,
            message: 'Error creating booking after payment'
          });
        }
      }

      // Original booking lookup logic for existing bookings
      // Find the booking by merchant order ID (booking reference)
      // First try transportation booking
      let booking = await TransportationBooking.findOne({
        bookingReference: data.merchantOrderId
      });

      let bookingType = 'transportation';

      // If not found in transportation bookings, try laundry bookings
      if (!booking) {
        booking = await Booking.findOne({
          bookingNumber: data.merchantOrderId
        });
        bookingType = 'laundry';
      }

      if (!booking) {
        logger.error('Booking not found for Kashier webhook', {
          merchantOrderId: data.merchantOrderId,
          event: event
        });
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      logger.info('Processing Kashier webhook payment', {
        bookingId: booking._id,
        bookingType: bookingType,
        merchantOrderId: data.merchantOrderId,
        status: data.status,
        amount: data.amount
      });

      // Process the payment based on webhook data
      await booking.processKashierPayment({
        event: event,
        status: data.status,
        transactionId: data.transactionId,
        kashierOrderId: data.kashierOrderId,
        orderReference: data.orderReference,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        creationDate: data.creationDate,
        transactionResponseCode: data.transactionResponseCode,
        transactionResponseMessage: data.transactionResponseMessage,
        card: data.card,
        merchantDetails: data.merchantDetails
      });

      // Send appropriate notifications based on payment status
      if (data.status === 'SUCCESS') {
        logger.info('Payment completed successfully via webhook', {
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          transactionId: data.transactionId,
          amount: data.amount,
          currency: data.currency
        });

        // TODO: Send payment success email to guest
        // TODO: Send payment notification to service provider
        // TODO: Update hotel revenue tracking
      } else if (data.status === 'FAILED' || data.status === 'ERROR') {
        logger.error('Payment failed via webhook', {
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          transactionId: data.transactionId,
          status: data.status,
          responseCode: data.transactionResponseCode,
          responseMessage: data.transactionResponseMessage
        });

        // TODO: Send payment failure notification to guest
      }
    } else if (event === 'refund') {
      // Handle refund events
      logger.info('Refund event received', {
        merchantOrderId: data.merchantOrderId,
        amount: data.amount,
        status: data.status
      });

      // TODO: Implement refund handling logic
    } else {
      logger.warn('Unknown webhook event type', {
        event: event,
        merchantOrderId: data?.merchantOrderId
      });
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    logger.error('Kashier webhook processing error:', error);

    // Still respond with 200 to prevent retries for processing errors
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed but acknowledged'
    });
  }
});

/**
 * @desc    Get payment status for a booking
 * @route   GET /api/payments/kashier/status/:bookingId
 * @access  Private/Guest
 */
router.get('/status/:bookingId', protect, restrictTo('guest'), async (req, res) => {
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

    res.json({
      success: true,
      data: {
        paymentStatus: booking.payment.status,
        bookingStatus: booking.bookingStatus,
        totalAmount: booking.payment.totalAmount,
        paidAmount: booking.payment.paidAmount,
        currency: booking.payment.currency,
        paymentDate: booking.payment.paymentDate,
        transactionId: booking.payment.kashier.transactionId,
        paymentReference: booking.payment.kashier.paymentReference
      }
    });

  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment status'
    });
  }
});

/**
 * @desc    Confirm payment success from redirect
 * @route   POST /api/payments/kashier/confirm-payment/:bookingId
 * @access  Private/Guest
 */
router.post('/confirm-payment/:bookingId', protect, restrictTo('guest'), async (req, res) => {
  try {
    const { paymentData, bookingType = 'transportation' } = req.body;
    const { bookingId } = req.params;

    console.log('🔵 Payment confirmation request:', { bookingId, bookingType, userId: req.user._id, paymentData });

    let booking;

    // Find the booking based on type
    if (bookingType === 'laundry') {
      booking = await Booking.findOne({
        _id: bookingId,
        guestId: req.user._id
      });
    } else {
      booking = await TransportationBooking.findOne({
        _id: bookingId,
        guestId: req.user._id
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment is already completed
    const isCompleted = bookingType === 'laundry'
      ? booking.status === 'confirmed' && booking.payment.status === 'completed'
      : booking.bookingStatus === 'payment_completed';

    if (isCompleted) {
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: { booking: booking }
      });
    }

    // Process the payment confirmation
    if (paymentData.paymentStatus === 'SUCCESS') {
      // Create webhook-style data for processing
      const webhookData = {
        event: 'pay',
        status: 'SUCCESS',
        transactionId: paymentData.transactionId,
        kashierOrderId: paymentData.orderReference,
        orderReference: paymentData.orderReference,
        merchantOrderId: paymentData.merchantOrderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: 'card',
        creationDate: new Date().toISOString(),
        transactionResponseCode: '00',
        transactionResponseMessage: {
          en: 'Approved',
          ar: 'تمت الموافقة'
        },
        card: {
          cardInfo: {
            cardBrand: paymentData.cardBrand,
            maskedCard: paymentData.maskedCard
          }
        }
      };

      // Process the payment
      await booking.processKashierPayment(webhookData);

      logger.info('Payment confirmed via redirect', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          booking: booking,
          paymentStatus: booking.payment.status,
          bookingStatus: booking.bookingStatus
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        data: { paymentStatus: paymentData.paymentStatus }
      });
    }

  } catch (error) {
    console.error('❌ Payment confirmation error:', error);
    logger.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming payment'
    });
  }
});

/**
 * @desc    Confirm payment success from redirect (public endpoint)
 * @route   POST /api/payments/kashier/confirm-payment-public/:bookingId
 * @access  Public (for redirect handling)
 */
router.post('/confirm-payment-public/:bookingId', async (req, res) => {
  try {
    const { paymentData } = req.body;
    const { bookingId } = req.params;

    console.log('🔵 Public payment confirmation request:', { bookingId, paymentData });

    // Find the booking (try both transportation and laundry models)
    let booking = null;
    let bookingType = 'transportation';

    // Check if it's a temporary laundry booking ID
    if (bookingId.startsWith('TEMP_LAUNDRY_')) {
      // For temporary laundry bookings, look in the Booking model by bookingNumber
      booking = await Booking.findOne({ bookingNumber: bookingId });
      bookingType = 'laundry';
      console.log('🧺 Looking for laundry booking with temp ID:', bookingId);

      // If booking not found, check if we need to create it from temp data
      if (!booking) {
        global.tempBookingData = global.tempBookingData || {};
        const tempData = global.tempBookingData[bookingId];

        console.log('🔍 Temp data lookup for:', bookingId);
        console.log('📊 Available temp booking keys:', Object.keys(global.tempBookingData));
        console.log('📋 Temp data found:', tempData ? 'Yes' : 'No');

        if (tempData && paymentData.paymentStatus === 'SUCCESS') {
          console.log('🏗️ Creating laundry booking from temp data for:', bookingId);
          console.log('📋 Available temp data:', tempData);

          // Get user details for missing fields
          const user = await User.findById(tempData.guestId);

          if (!user) {
            console.log('❌ User not found for temp booking:', tempData.guestId);
            return res.status(404).json({
              success: false,
              message: 'User not found for booking'
            });
          }

          // Generate proper booking number
          const bookingNumber = `LAU${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          // Create booking with all required fields, using defaults where necessary
          const bookingData = tempData.bookingData || {};

          booking = new Booking({
            bookingNumber,
            guestId: tempData.guestId,
            serviceId: bookingData.serviceId,
            serviceProviderId: bookingData.serviceProviderId || tempData.serviceProviderId || new mongoose.Types.ObjectId(), // Provide default ObjectId
            hotelId: bookingData.hotelId,

            // Guest details - use user data with fallbacks
            guestDetails: {
              firstName: user.firstName || 'Guest',
              lastName: user.lastName || 'User', // Cannot be empty
              email: user.email,
              phone: user.phone || '',
              roomNumber: bookingData.guestDetails?.roomNumber || user.roomNumber || '101' // Cannot be empty
            },

            // Service details
            serviceDetails: {
              name: bookingData.serviceDetails?.name || 'Laundry Service',
              category: 'laundry',
              subcategory: bookingData.serviceDetails?.subcategory || 'general',
              description: bookingData.serviceDetails?.description || 'Laundry service booking'
            },

            // Booking configuration
            bookingConfig: {
              quantity: bookingData.laundryItems?.length || 1,
              laundryItems: (bookingData.laundryItems || []).length > 0
                ? bookingData.laundryItems.map(item => ({
                    ...item,
                    finalPrice: item.finalPrice || item.totalPrice || parseFloat(paymentData.amount) || 0,
                    serviceType: {
                      id: item.serviceType?.id || 'default-service-type',
                      name: item.serviceType?.name || 'Standard Laundry Service',
                      description: item.serviceType?.description || 'Professional laundry service',
                      duration: item.serviceType?.duration || {
                        value: 24,
                        unit: 'hours'
                      },
                      icon: item.serviceType?.icon || 'wash'
                    }
                  }))
                : [{
                    itemName: 'Default Laundry Item',
                    itemId: 'default-item',
                    itemCategory: 'general',
                    itemIcon: 'shirt',
                    quantity: 1,
                    serviceType: {
                      id: 'default-service-type',
                      name: 'Standard Laundry Service',
                      description: 'Professional laundry service',
                      duration: {
                        value: 24,
                        unit: 'hours'
                      },
                      icon: 'wash'
                    },
                    basePrice: parseFloat(paymentData.amount) || 0,
                    finalPrice: parseFloat(paymentData.amount) || 0
                  }],
              isExpressService: bookingData.isExpressService || false,
              specialRequests: bookingData.specialRequests || ''
            },

            // Scheduling - use current date if not provided
            schedule: {
              preferredDate: bookingData.schedule?.preferredDate ? new Date(bookingData.schedule.preferredDate) : new Date(),
              preferredTime: bookingData.schedule?.preferredTime || '09:00',
              estimatedDuration: {
                value: 24,
                unit: 'hours'
              }
            },

            // Location
            location: {
              pickupLocation: bookingData.location?.pickupLocation || user.roomNumber || '',
              deliveryLocation: bookingData.location?.deliveryLocation || user.roomNumber || '',
              pickupInstructions: bookingData.location?.pickupInstructions || ''
            },

            // Pricing - calculate from payment amount
            pricing: {
              basePrice: parseFloat(paymentData.amount) || 0,
              quantity: bookingData.laundryItems?.length || 1,
              subtotal: parseFloat(paymentData.amount) || 0,
              expressSurcharge: 0,
              markup: {
                percentage: 15, // Default markup
                amount: (parseFloat(paymentData.amount) * 0.15) || 0
              },
              tax: {
                rate: 0,
                amount: 0
              },
              totalBeforeMarkup: (parseFloat(paymentData.amount) / 1.15) || 0,
              totalAmount: parseFloat(paymentData.amount) || 0,
              currency: 'EGP', // Use valid enum value instead of EGP
              providerEarnings: (parseFloat(paymentData.amount) / 1.15) || 0,
              hotelEarnings: (parseFloat(paymentData.amount) * 0.15 / 1.15) || 0
            },

            status: 'confirmed',

            // Payment information
            payment: {
              method: 'credit-card',
              status: 'completed',
              paidAmount: parseFloat(paymentData.amount) || 0,
              paymentDate: new Date(),
              transactionId: paymentData.transactionId,

              // Kashier payment details
              kashier: {
                sessionId: bookingId,
                transactionId: paymentData.transactionId,
                paymentReference: paymentData.orderReference,
                webhookData: paymentData
              }
            }
          });

          try {
            await booking.save();

            console.log('🔍 Booking saved with kashier data:', {
              sessionId: booking.payment?.kashier?.sessionId,
              transactionId: booking.payment?.kashier?.transactionId,
              bookingNumber: booking.bookingNumber
            });

            logger.info('Laundry booking created from payment confirmation', {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              tempId: bookingId,
              amount: paymentData.amount,
              transactionId: paymentData.transactionId
            });

            // Clean up temporary booking data
            delete global.tempBookingData[bookingId];

            console.log('✅ Laundry booking created successfully:', booking.bookingNumber);
          } catch (saveError) {
            console.error('❌ Error saving laundry booking:', saveError);
            return res.status(500).json({
              success: false,
              message: 'Failed to create booking after payment',
              error: saveError.message
            });
          }
        }
      }
    } else if (bookingId.startsWith('TEMP_RESTAURANT_') || bookingId.includes('RESTAURANT') || bookingId.includes('RESTAAURANT')) {
      // For temporary restaurant bookings, look in the Booking model by bookingNumber
      booking = await Booking.findOne({ bookingNumber: bookingId });
      bookingType = 'restaurant';
      console.log('🍽️ Looking for restaurant booking with temp ID:', bookingId);

      // If booking not found, check if we need to create it from temp data
      if (!booking) {
        global.tempBookingData = global.tempBookingData || {};

        // Try exact match first, then try to find any restaurant booking with similar ID
        let tempData = global.tempBookingData[bookingId];

        if (!tempData) {
        // Look for similar booking IDs (in case of typos)
        const restaurantKeys = Object.keys(global.tempBookingData).filter(key =>
          (key.includes('RESTAURANT') || key.includes('RESTAAURANT')) &&
          key.includes(bookingId.split('_')[2])
        );          if (restaurantKeys.length > 0) {
            tempData = global.tempBookingData[restaurantKeys[0]];
            console.log(`🔄 Found similar restaurant booking key: ${restaurantKeys[0]} for ${bookingId}`);
          }
        }

        console.log('🔍 Temp data lookup for restaurant:', bookingId);
        console.log('📊 Available temp booking keys:', Object.keys(global.tempBookingData));
        console.log('📋 Temp data found:', tempData ? 'Yes' : 'No');

        if (tempData) {
          console.log('📋 Temp data details:', {
            bookingType: tempData.bookingType,
            guestId: tempData.guestId,
            hasBookingData: !!tempData.bookingData
          });
        }

        if (tempData && paymentData.paymentStatus === 'SUCCESS') {
          console.log('🏗️ Creating restaurant booking from temp data for:', bookingId);
          console.log('📋 Available temp data:', tempData);

          // Get user details for missing fields
          const user = await User.findById(tempData.guestId);

          if (!user) {
            console.log('❌ User not found for temp booking:', tempData.guestId);
            return res.status(404).json({
              success: false,
              message: 'User not found for booking'
            });
          }

          // Generate proper booking number
          const bookingNumber = `REST${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          // Create booking with all required fields, using defaults where necessary
          const bookingData = tempData.bookingData || {};

          booking = new Booking({
            bookingNumber,
            guestId: tempData.guestId,
            serviceId: bookingData.serviceId,
            serviceProviderId: bookingData.serviceProviderId || tempData.serviceProviderId || new mongoose.Types.ObjectId(),
            hotelId: bookingData.hotelId,

            // Set service type for restaurant
            serviceType: 'restaurant',
            category: 'restaurant',

            // Guest details - use user data with fallbacks
            guestDetails: {
              firstName: user.firstName || 'Guest',
              lastName: user.lastName || 'User',
              email: user.email,
              phone: user.phone || '+20123456789', // Provide default phone if missing
              roomNumber: bookingData.guestDetails?.roomNumber || user.roomNumber || '101',
              specialRequests: bookingData.guestDetails?.specialRequests || ''
            },

            // Menu items
            menuItems: bookingData.menuItems || [],

            // Service details - provide defaults for required fields
            serviceDetails: {
              name: bookingData.serviceDetails?.name || 'Restaurant Service',
              category: 'restaurant',
              subcategory: 'dining',
              description: bookingData.serviceDetails?.description || 'Restaurant service',
              requirements: bookingData.serviceDetails?.requirements || [],
              estimatedDuration: {
                value: 60,
                unit: 'minutes'
              },
              items: bookingData.menuItems?.map(item => ({
                name: item.itemName || 'Menu Item',
                description: item.description || '',
                quantity: item.quantity || 1,
                icon: 'utensils'
              })) || []
            },

            // Booking Configuration - add required quantity field
            bookingConfig: {
              quantity: bookingData.menuItems?.reduce((total, item) => total + (item.quantity || 1), 0) || 1,
              menuItems: bookingData.menuItems || [],
              isExpressService: false,
              additionalServices: [],
              selectedOptions: [],
              serviceCombination: { serviceTypes: [] },
              laundryItems: []
            },

            // Scheduling - use current date if not provided
            schedule: {
              preferredDate: bookingData.schedule?.preferredDate ? new Date(bookingData.schedule.preferredDate) : new Date(),
              preferredTime: (() => {
                const prefTime = bookingData.schedule?.preferredTime;
                // If preferredTime is "lunch", "dinner", etc., convert to a valid time format
                if (prefTime) {
                  if (prefTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                    return prefTime; // Already in HH:MM format
                  } else if (prefTime.toLowerCase() === 'lunch') {
                    return '12:00';
                  } else if (prefTime.toLowerCase() === 'dinner') {
                    return '19:00';
                  } else if (prefTime.toLowerCase() === 'breakfast') {
                    return '08:00';
                  }
                }
                return '12:00'; // Default fallback
              })(),
              estimatedDuration: {
                value: 60,
                unit: 'minutes'
              }
            },

            // Location
            location: {
              pickupLocation: bookingData.location?.pickupLocation || user.roomNumber || '',
              deliveryLocation: bookingData.location?.deliveryLocation || user.roomNumber || '',
              pickupInstructions: bookingData.location?.pickupInstructions || ''
            },

            // Pricing - calculate from payment amount
            pricing: {
              basePrice: parseFloat(paymentData.amount) || 0,
              quantity: bookingData.menuItems?.length || 1,
              subtotal: parseFloat(paymentData.amount) || 0,
              expressSurcharge: 0,
              markup: {
                percentage: 15, // Default markup
                amount: (parseFloat(paymentData.amount) * 0.15) || 0
              },
              tax: {
                rate: 0,
                amount: 0
              },
              totalBeforeMarkup: (parseFloat(paymentData.amount) / 1.15) || 0,
              totalAmount: parseFloat(paymentData.amount) || 0,
              currency: 'EGP',
              providerEarnings: (parseFloat(paymentData.amount) / 1.15) || 0,
              hotelEarnings: (parseFloat(paymentData.amount) * 0.15 / 1.15) || 0
            },

            status: 'confirmed',

            // Payment information
            payment: {
              method: 'credit-card',
              status: 'completed',
              paidAmount: parseFloat(paymentData.amount) || 0,
              paymentDate: new Date(),
              transactionId: paymentData.transactionId,

              // Kashier payment details
              kashier: {
                sessionId: bookingId,
                transactionId: paymentData.transactionId,
                paymentReference: paymentData.orderReference,
                webhookData: paymentData
              }
            }
          });

          try {
            await booking.save();

            console.log('🔍 Restaurant booking saved with kashier data:', {
              sessionId: booking.payment?.kashier?.sessionId,
              transactionId: booking.payment?.kashier?.transactionId,
              bookingNumber: booking.bookingNumber
            });

            logger.info('Restaurant booking created from payment confirmation', {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              tempId: bookingId,
              amount: paymentData.amount,
              transactionId: paymentData.transactionId
            });

            // Clean up temporary booking data
            delete global.tempBookingData[bookingId];

            console.log('✅ Restaurant booking created successfully:', booking.bookingNumber);
          } catch (saveError) {
            console.error('❌ Error saving restaurant booking:', saveError);
            return res.status(500).json({
              success: false,
              message: 'Failed to create restaurant booking after payment',
              error: saveError.message
            });
          }
        } else if (paymentData.paymentStatus === 'SUCCESS') {
          // No temp data found, but payment was successful
          // This could happen if server restarted or temp data was cleared
          console.log('⚠️ No temp data found for restaurant booking, but payment successful');
          console.log('🔧 Attempting to create basic restaurant booking from payment data only');

          // Try to extract user ID from the booking ID if possible or use a fallback approach
          // For now, return an error asking user to contact support
          return res.status(202).json({
            success: false,
            message: 'Payment successful but booking data not found. Please contact support.',
            data: {
              bookingId,
              transactionId: paymentData.transactionId,
              amount: paymentData.amount,
              status: 'payment_confirmed_booking_pending'
            }
          });
        }
      }
    } else {
      // Try transportation booking first
      try {
        booking = await TransportationBooking.findById(bookingId);
        bookingType = 'transportation';
      } catch (error) {
        console.log('🚗 Not a valid transportation booking ID, trying laundry...');
        // If not found in transportation, try laundry bookings
        booking = await Booking.findById(bookingId);
        bookingType = 'laundry';
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log(`📋 Found ${bookingType} booking:`, booking._id);

    // Verify the merchantOrderId matches for security
    let expectedReference = bookingType === 'laundry' ? booking.bookingNumber : booking.bookingReference;

    // For laundry bookings created from temp data, the merchantOrderId will be the temp ID
    // But the booking has a generated booking number, so we need to check the Kashier session ID instead
    if (bookingType === 'laundry' && booking.payment?.kashier?.sessionId) {
      expectedReference = booking.payment.kashier.sessionId;
    }

    if (paymentData.merchantOrderId !== expectedReference) {
      console.log('❌ Merchant order ID mismatch:', {
        provided: paymentData.merchantOrderId,
        expected: expectedReference,
        bookingType,
        bookingNumber: booking.bookingNumber,
        kashierSessionId: booking.payment?.kashier?.sessionId
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment data - merchant order ID mismatch',
        debug: {
          provided: paymentData.merchantOrderId,
          expected: expectedReference,
          bookingType
        }
      });
    }

    console.log('✅ Merchant order ID verified:', paymentData.merchantOrderId);

    // Check if payment is already completed (handle both booking types)
    const isPaymentCompleted = bookingType === 'laundry'
      ? booking.status === 'payment_completed' || booking.paymentStatus === 'completed'
      : booking.bookingStatus === 'payment_completed';

    if (isPaymentCompleted) {
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: {
          bookingStatus: bookingType === 'laundry' ? booking.status : booking.bookingStatus,
          paymentStatus: bookingType === 'laundry' ? booking.paymentStatus : booking.payment?.status
        }
      });
    }

    // Process the payment confirmation
    if (paymentData.paymentStatus === 'SUCCESS') {
      // Create webhook-style data for processing
      const webhookData = {
        event: 'pay',
        status: 'SUCCESS',
        transactionId: paymentData.transactionId,
        kashierOrderId: paymentData.orderReference,
        orderReference: paymentData.orderReference,
        merchantOrderId: paymentData.merchantOrderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: 'card',
        creationDate: new Date().toISOString(),
        transactionResponseCode: '00',
        transactionResponseMessage: {
          en: 'Approved',
          ar: 'تمت الموافقة'
        },
        card: {
          cardInfo: {
            cardBrand: paymentData.cardBrand,
            maskedCard: paymentData.maskedCard
          }
        }
      };

      // Process the payment (both booking types have this method)
      await booking.processKashierPayment(webhookData);

      // Send WhatsApp notifications after successful payment processing
      try {
        if (bookingType === 'laundry') {
          // Fetch guest and hotel details for WhatsApp
          const guest = await User.findById(booking.guestId);
          const hotel = await mongoose.model('Hotel').findById(booking.hotelId);
          const service = await mongoose.model('Service').findById(booking.serviceId).populate('providerId');

          // Send confirmation to guest
          if (guest?.phone) {
            try {
              await whatsapp.sendLaundryBookingConfirmation({
                guestName: `${guest.firstName} ${guest.lastName || ''}`,
                guestPhone: guest.phone,
                bookingNumber: booking.bookingNumber,
                hotelName: hotel?.name || '',
                serviceProviderName: service?.providerId?.businessName || '',
                serviceType: service?.name || 'خدمة الغسيل',
                pickupDate: new Date(booking.schedule?.preferredDate).toLocaleDateString('ar-EG'),
                pickupTime: booking.schedule?.preferredTime || 'سيتم التأكيد',
                roomNumber: booking.guestDetails?.roomNumber || '',
                totalAmount: `${booking.pricing?.totalAmount || paymentData.amount} ${booking.pricing?.currency || 'EGP'}`,
                paymentStatus: 'تم الدفع'
              });
              logger.info('WhatsApp booking confirmation sent to guest (public)', {
                bookingNumber: booking.bookingNumber,
                guestPhone: guest.phone
              });
            } catch (waGuestErr) {
              logger.error('WhatsApp guest notification error (public)', {
                error: waGuestErr.message,
                bookingNumber: booking.bookingNumber
              });
            }
          }

          // Send notification to service provider
          if (service?.providerId?.phone) {
            try {
              await whatsapp.sendNewLaundryOrderToProvider({
                providerPhone: service.providerId.phone,
                bookingNumber: booking.bookingNumber,
                guestName: `${guest.firstName} ${guest.lastName || ''}`,
                hotelName: hotel?.name || '',
                roomNumber: booking.guestDetails?.roomNumber || '',
                guestPhone: guest.phone,
                pickupDate: new Date(booking.schedule?.preferredDate).toLocaleDateString('ar-EG'),
                pickupTime: booking.schedule?.preferredTime || 'سيتم التأكيد',
                serviceType: service?.name || 'خدمة الغسيل',
                specialNotes: booking.guestDetails?.specialRequests || booking.bookingConfig?.specialRequests || '',
                baseAmount: `${booking.pricing?.providerEarnings || booking.pricing?.totalBeforeMarkup || paymentData.amount} ${booking.pricing?.currency || 'EGP'}`
              });
              logger.info('WhatsApp order notification sent to provider (public)', {
                bookingNumber: booking.bookingNumber,
                providerPhone: service.providerId.phone
              });
            } catch (waProviderErr) {
              logger.error('WhatsApp provider notification error (public)', {
                error: waProviderErr.message,
                bookingNumber: booking.bookingNumber
              });
            }
          }
        }
        // TODO: Add transportation WhatsApp notifications here if needed
      } catch (whatsappError) {
        logger.error('Failed to send WhatsApp notifications (public)', {
          error: whatsappError.message,
          bookingNumber: bookingType === 'laundry' ? booking.bookingNumber : booking.bookingReference
        });
        // Don't fail the payment confirmation if WhatsApp fails
      }

      logger.info('Payment confirmed via public redirect', {
        bookingId: booking._id,
        bookingReference: bookingType === 'laundry' ? booking.bookingNumber : booking.bookingReference,
        bookingType,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          bookingType,
          bookingStatus: bookingType === 'laundry' ? booking.status : booking.bookingStatus,
          paymentStatus: bookingType === 'laundry' ? booking.paymentStatus : booking.payment?.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        data: { paymentStatus: paymentData.paymentStatus }
      });
    }

  } catch (error) {
    console.error('❌ Public payment confirmation error:', error);
    logger.error('Public payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming payment'
    });
  }
});

/**
 * @desc    Retry failed payment
 * @route   POST /api/payments/kashier/retry/:bookingId
 * @access  Private/Guest
 */
router.post('/retry/:bookingId', protect, restrictTo('guest'), async (req, res) => {
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

    if (booking.payment.status !== 'failed' && booking.bookingStatus !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment retry not allowed for this booking status'
      });
    }

    // Reset payment status and create new session
    booking.payment.status = 'pending';
    booking.payment.kashier.sessionId = null;
    booking.payment.kashier.paymentUrl = null;
    booking.bookingStatus = 'quote_accepted';

    await booking.save();

    // Redirect to create new payment session
    res.json({
      success: true,
      message: 'Payment reset successfully. Please create a new payment session.',
      data: {
        booking: {
          id: booking._id,
          status: booking.bookingStatus,
          paymentStatus: booking.payment.status
        }
      }
    });

  } catch (error) {
    logger.error('Retry payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrying payment'
    });
  }
});

/**
 * @desc    Get payment history for hotel/provider
 * @route   GET /api/payments/kashier/transactions
 * @access  Private/Hotel Admin or Service Provider
 */
router.get('/transactions', protect, restrictTo('hotel-admin', 'service-provider'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    let filter = {};

    if (req.user.role === 'hotel-admin') {
      // Get hotel ID from user
      const hotel = await Hotel.findOne({ adminId: req.user._id });
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }
      filter.hotelId = hotel._id;
    } else if (req.user.role === 'service-provider') {
      // Get service provider ID from user
      const serviceProvider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }
      filter.serviceProviderId = serviceProvider._id;
    }

    if (status) {
      filter['payment.status'] = status;
    }

    if (startDate && endDate) {
      filter['payment.paymentDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await TransportationBooking.find(filter)
      .populate('guest', 'firstName lastName email')
      .populate('serviceProvider', 'businessName')
      .populate('hotel', 'name')
      .select('bookingReference payment tripDetails vehicleDetails createdAt')
      .sort({ 'payment.paymentDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TransportationBooking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// Helper functions

/**
 * Generate hash for Kashier.io Hosted Payment Page
 * Based on Kashier documentation: HMAC SHA256 with path format
 */
function generateKashierHash(data) {
  if (!KASHIER_CONFIG.apiKey) {
    logger.warn('Kashier API key not configured');
    return null;
  }

  // Create the path according to Kashier documentation
  // Format: /?payment=merchantId.orderId.amount.currency
  const path = `/?payment=${data.merchantId}.${data.orderId}.${data.amount}.${data.currency}`;

  const hash = crypto
    .createHmac('sha256', KASHIER_CONFIG.apiKey)
    .update(path)
    .digest('hex');

  logger.info('Generated Kashier hash', {
    path: path,
    hash: hash
  });

  return hash;
}

/**
 * Verify Kashier.io webhook signature
 * Based on official documentation: https://developers.kashier.io/payment/webhook
 */
function verifyKashierWebhookSignature(data, receivedSignature) {
  if (!KASHIER_CONFIG.apiKey || !receivedSignature || !data || !data.signatureKeys) {
    logger.warn('Missing requirements for signature verification', {
      hasApiKey: !!KASHIER_CONFIG.apiKey,
      hasSignature: !!receivedSignature,
      hasData: !!data,
      hasSignatureKeys: !!data?.signatureKeys
    });
    return false;
  }

  try {
    // Sort the signature keys alphabetically as per documentation
    const sortedKeys = [...data.signatureKeys].sort();

    // Pick only the keys specified in signatureKeys from data
    const signaturePayload = {};
    sortedKeys.forEach(key => {
      if (data.hasOwnProperty(key)) {
        signaturePayload[key] = data[key];
      }
    });

    // Convert to query string format
    const queryString = require('querystring');
    const payloadString = queryString.stringify(signaturePayload);

    // Generate HMAC SHA256 signature using API key
    const expectedSignature = crypto
      .createHmac('sha256', KASHIER_CONFIG.apiKey)
      .update(payloadString)
      .digest('hex');

    logger.info('Webhook signature verification', {
      sortedKeys: sortedKeys,
      payloadString: payloadString.substring(0, 100) + '...',
      expectedSignature: expectedSignature,
      receivedSignature: receivedSignature,
      match: expectedSignature === receivedSignature
    });

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Verify Kashier.io webhook hash
 */
function verifyKashierHash(payload, receivedHash) {
  if (!KASHIER_CONFIG.apiKey || !receivedHash) {
    return false;
  }

  const expectedHash = generateKashierHash({
    merchantId: payload.merchantId || KASHIER_CONFIG.merchantId,
    orderId: payload.orderId,
    amount: payload.amount,
    currency: payload.currency
  });

  return crypto.timingSafeEqual(
    Buffer.from(receivedHash),
    Buffer.from(expectedHash)
  );
}

module.exports = router;
