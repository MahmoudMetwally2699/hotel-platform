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
const Service = require('../models/Service'); // Add service model to get provider info
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

  // ...removed console.log for production...

    if (!bookingId) {
  // ...removed console.log for production...
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

    // ...removed console.log for production...

    if (!booking) {
  // ...removed console.log for production...
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not ready for payment'
      });
    }

    // Validate payment amount based on booking type
    let paymentAmount;
    if (bookingType === 'laundry') {
      if (!booking.pricing || !booking.pricing.total) {
        // ...removed console.log for production...
        return res.status(400).json({
          success: false,
          message: 'No valid pricing found for this booking'
        });
      }
      paymentAmount = booking.pricing.total;
    } else {
      // Transportation booking
      if (!booking.quote || (!booking.payment.totalAmount && !booking.quote.finalPrice)) {
        // ...removed console.log for production...
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

  // ...removed console.log for production...

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

    // ...removed console.log for production...

    // Generate hash signature for Kashier.io
    const hash = generateKashierHash(paymentData);
    paymentData.hash = hash;

  // ...removed console.log for production...

    // Create payment session with Kashier.io
  // ...removed console.log for production...

    // Since Kashier API endpoints are not working, use hosted payment page approach
    // Generate payment URL directly
    const paymentUrl = `${KASHIER_CONFIG.apiUrl}?${new URLSearchParams(paymentData).toString()}`;

  // ...removed console.log for production...

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
    // ...removed console.log for production...

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

  // ...removed console.log for production...

    if (!bookingData || !amount) {
  // ...removed console.log for production...
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

  // ...removed console.log for production...

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

    // ...removed console.log for production...

    // Generate hash signature for Kashier.io
    const hash = generateKashierHash(paymentData);
    paymentData.hash = hash;

  // ...removed console.log for production...

    // Try using the simple URL construction like the original working version
    const paymentUrl = `${KASHIER_CONFIG.apiUrl}?${new URLSearchParams(paymentData).toString()}`;

  // ...removed console.log for production...

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
  // ...removed console.log for production...
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
            // ...removed console.log for production...

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
                          roomNumber: newBooking.location?.pickup?.address || newBooking.guestDetails?.roomNumber || 'سيتم التأكيد',
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
                          roomNumber: newBooking.location?.pickup?.address || newBooking.guestDetails?.roomNumber || 'سيتم التأكيد',
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

  // ...removed console.log for production...

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
    // ...removed console.log for production...
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

  // ...removed console.log for production...

    // Prevent concurrent processing of the same transaction
    const lockKey = `payment_lock_${paymentData.transactionId}`;
    global.paymentLocks = global.paymentLocks || {};

    if (global.paymentLocks[lockKey]) {
      // ...removed console.log for production...
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const completedBooking = await Booking.findOne({
        'payment.transactionId': paymentData.transactionId
      });

      if (completedBooking) {
        // ...removed console.log for production...
        return res.json({
          success: true,
          message: 'Payment already confirmed',
          data: { booking: completedBooking }
        });
      } else {
        // ...removed console.log for production...
        return res.status(202).json({
          success: false,
          message: 'Payment is being processed, please try again in a moment',
          data: { booking: null }
        });
      }
    }

    // Set lock
    global.paymentLocks[lockKey] = true;

    try {

    // Find the booking (try both transportation and laundry models)
    let booking = null;
    let bookingType = 'transportation';

    // Check if it's a temporary laundry booking ID
    if (bookingId.startsWith('TEMP_LAUNDRY_')) {
      // For temporary laundry bookings, look in the Booking model by bookingNumber
      booking = await Booking.findOne({ bookingNumber: bookingId });
      bookingType = 'laundry';
      // ...removed console.log for production...

      // If booking not found, check if we need to create it from temp data
      if (!booking) {
        // Double-check for existing booking with this transaction ID
        const existingBooking = await Booking.findOne({
          'payment.transactionId': paymentData.transactionId
        });

        if (existingBooking) {
          // ...removed console.log for production...
          return res.json({
            success: true,
            message: 'Payment already confirmed',
            data: { booking: existingBooking }
          });
        }        global.tempBookingData = global.tempBookingData || {};
        const tempData = global.tempBookingData[bookingId];

        // ...removed console.log for production...

        if (tempData && paymentData.paymentStatus === 'SUCCESS') {
          // ...removed console.log for production...

          // Debug location data from frontend
          // ...removed console.log for production...

          // Get the service to find the actual provider ID
          const service = await Service.findById(tempData.bookingData?.serviceId).populate('providerId');
          if (!service) {
            // ...removed console.log for production...
            return res.status(404).json({
              success: false,
              message: 'Service not found for booking'
            });
          }

          // ...removed console.log for production...

          // Get user details for missing fields
          const user = await User.findById(tempData.guestId);

          if (!user) {
            // ...removed console.log for production...
            return res.status(404).json({
              success: false,
              message: 'User not found for booking'
            });
          }

          // Generate proper booking number
          const bookingNumber = `LAU${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          // Create booking with all required fields, using defaults where necessary
          const bookingData = tempData.bookingData || {};

          // Debug: Check location data before saving
          // ...removed console.log for production...

          booking = new Booking({
            bookingNumber,
            guestId: tempData.guestId,
            serviceId: bookingData.serviceId,
            serviceProviderId: service.providerId._id, // Use the actual service provider ID
            hotelId: bookingData.hotelId,
            serviceType: 'laundry', // Set the correct service type for the booking

            // Guest details - use user data with fallbacks
            guestDetails: {
              firstName: user.firstName || 'Guest',
              lastName: user.lastName || 'User', // Cannot be empty
              email: user.email,
              phone: user.phone || '',
              roomNumber: bookingData.guestDetails?.roomNumber || user.roomNumber || '' // Don't default to 101
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
                ? bookingData.laundryItems.map(item => {
                    // Parse duration string to object format
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
                      ...item,
                      finalPrice: item.finalPrice || item.totalPrice || parseFloat(paymentData.amount) || 0,
                      serviceType: {
                        id: item.serviceTypeId || 'default-service-type',
                        name: item.serviceTypeName || 'Standard Laundry Service',
                        description: item.serviceTypeDescription || 'Professional laundry service',
                        duration: durationObj,
                        icon: item.serviceTypeIcon || 'wash'
                      }
                    };
                  })
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
              isExpressService: bookingData.expressSurcharge?.enabled || bookingData.isExpressService || false,
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
              pickup: {
                address: bookingData.location?.pickupLocation || user.roomNumber || '',
                instructions: bookingData.location?.pickupInstructions || ''
              },
              delivery: {
                address: bookingData.location?.deliveryLocation || user.roomNumber || '',
                instructions: bookingData.location?.deliveryInstructions || ''
              }
            },

            // Pricing - calculate from payment amount
            pricing: {
              basePrice: parseFloat(paymentData.amount) || 0,
              quantity: bookingData.laundryItems?.length || 1,
              subtotal: parseFloat(paymentData.amount) || 0,
              expressSurcharge: 0,
              markup: {
                percentage: 0, // Will be calculated from hotel settings
                amount: 0 // Will be calculated from hotel settings
              },
              tax: {
                rate: 0,
                amount: 0
              },
              totalBeforeMarkup: parseFloat(paymentData.amount) || 0, // Will be recalculated
              totalAmount: parseFloat(paymentData.amount) || 0,
              currency: 'EGP', // Use valid enum value instead of EGP
              providerEarnings: parseFloat(paymentData.amount) || 0, // Will be recalculated
              hotelEarnings: 0 // Will be recalculated
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

            // ...removed console.log for production...

            logger.info('Laundry booking created from payment confirmation', {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              tempId: bookingId,
              amount: paymentData.amount,
              transactionId: paymentData.transactionId
            });

            // Clean up temporary booking data
            delete global.tempBookingData[bookingId];

            // ...removed console.log for production...
          } catch (saveError) {
            // Check if this is a duplicate transaction error
            if (saveError.code === 11000 || saveError.message.includes('duplicate') || saveError.message.includes('transactionId')) {
              // ...removed console.log for production...
              const existingBooking = await Booking.findOne({
                'payment.transactionId': paymentData.transactionId
              });

              if (existingBooking) {
                // ...removed console.log for production...
                booking = existingBooking;
              } else {
                return res.status(500).json({
                  success: false,
                  message: 'Duplicate transaction error but no existing booking found'
                });
              }
            } else {
              return res.status(500).json({
                success: false,
                message: 'Failed to create booking after payment',
                error: saveError.message
              });
            }
          }
        }
      }
    } else if (bookingId.startsWith('TEMP_RESTAURANT_') || bookingId.includes('RESTAURANT') || bookingId.includes('RESTAAURANT')) {
      // For temporary restaurant bookings, look in the Booking model by bookingNumber
      booking = await Booking.findOne({ bookingNumber: bookingId });
      bookingType = 'restaurant';
      // ...removed console.log for production...

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
            // ...removed console.log for production...
          }
        }

        // ...removed console.log for production...

        // ...removed console.log for production...

        if (tempData && paymentData.paymentStatus === 'SUCCESS') {
          // Double-check for existing booking with this transaction ID
          const existingBooking = await Booking.findOne({
            'payment.transactionId': paymentData.transactionId
          });

          if (existingBooking) {
            // ...removed console.log for production...
            return res.json({
              success: true,
              message: 'Payment already confirmed',
              data: { booking: existingBooking }
            });
          }
          // ...removed console.log for production...

          // Get the service to find the actual provider ID
          const service = await Service.findById(tempData.bookingData?.serviceId).populate('providerId');
          if (!service) {
            // ...removed console.log for production...
            return res.status(404).json({
              success: false,
              message: 'Service not found for booking'
            });
          }

          // ...removed console.log for production...

          // Get user details for missing fields
          const user = await User.findById(tempData.guestId);

          if (!user) {
            // ...removed console.log for production...
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
            serviceProviderId: service.providerId._id, // Use the actual service provider ID
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
              pickup: {
                address: bookingData.location?.pickupLocation || user.roomNumber || '',
                instructions: bookingData.location?.pickupInstructions || ''
              },
              delivery: {
                address: bookingData.location?.deliveryLocation || user.roomNumber || '',
                instructions: bookingData.location?.deliveryInstructions || ''
              }
            },

            // Pricing - calculate from payment amount
            pricing: {
              basePrice: parseFloat(paymentData.amount) || 0,
              quantity: bookingData.menuItems?.length || 1,
              subtotal: parseFloat(paymentData.amount) || 0,
              expressSurcharge: 0,
              markup: {
                percentage: 0, // Will be calculated from hotel settings
                amount: 0 // Will be calculated from hotel settings
              },
              tax: {
                rate: 0,
                amount: 0
              },
              totalBeforeMarkup: parseFloat(paymentData.amount) || 0, // Will be recalculated
              totalAmount: parseFloat(paymentData.amount) || 0,
              currency: 'EGP',
              providerEarnings: parseFloat(paymentData.amount) || 0, // Will be recalculated
              hotelEarnings: 0 // Will be recalculated
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

            // ...removed console.log for production...

            logger.info('Restaurant booking created from payment confirmation', {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              tempId: bookingId,
              amount: paymentData.amount,
              transactionId: paymentData.transactionId
            });

            // Clean up temporary booking data
            delete global.tempBookingData[bookingId];

            // ...removed console.log for production...
          } catch (saveError) {
            // Check if this is a duplicate transaction error
            if (saveError.code === 11000 || saveError.message.includes('duplicate') || saveError.message.includes('transactionId')) {
              // ...removed console.log for production...
              const existingBooking = await Booking.findOne({
                'payment.transactionId': paymentData.transactionId
              });

              if (existingBooking) {
                // ...removed console.log for production...
                booking = existingBooking;
              } else {
                return res.status(500).json({
                  success: false,
                  message: 'Duplicate transaction error but no existing booking found'
                });
              }
            } else {
              return res.status(500).json({
                success: false,
                message: 'Failed to create restaurant booking after payment',
                error: saveError.message
              });
            }
          }
        } else if (paymentData.paymentStatus === 'SUCCESS') {
          // No temp data found, but payment was successful
          // This could happen if server restarted or temp data was cleared
          // ...removed console.log for production...

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
        // ...removed console.log for production...
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

    // ...removed console.log for production...

    // Verify the merchantOrderId matches for security
    let expectedReference = bookingType === 'laundry' ? booking.bookingNumber : booking.bookingReference;

    // For laundry bookings created from temp data, the merchantOrderId will be the temp ID
    // But the booking has a generated booking number, so we need to check the Kashier session ID instead
    if (bookingType === 'laundry' && booking.payment?.kashier?.sessionId) {
      expectedReference = booking.payment.kashier.sessionId;
    }

    if (paymentData.merchantOrderId !== expectedReference) {
      // ...removed console.log for production...
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

    // ...removed console.log for production...

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
              const whatsappParams = {
                guestName: `${guest.firstName} ${guest.lastName || ''}`,
                guestPhone: guest.phone,
                bookingNumber: booking.bookingNumber,
                hotelName: hotel?.name || '',
                serviceProviderName: service?.providerId?.businessName || '',
                serviceType: service?.name || 'خدمة الغسيل',
                pickupDate: new Date(booking.schedule?.preferredDate).toLocaleDateString('ar-EG'),
                pickupTime: booking.schedule?.preferredTime || 'سيتم التأكيد',
                roomNumber: booking.location?.pickup?.address || booking.guestDetails?.roomNumber || 'سيتم التأكيد',
                totalAmount: `${booking.pricing?.totalAmount || paymentData.amount} ${booking.pricing?.currency || 'EGP'}`,
                paymentStatus: 'تم الدفع'
              };

              // ...removed console.log for production...

              await whatsapp.sendLaundryBookingConfirmation(whatsappParams);
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
                roomNumber: booking.location?.pickup?.address || booking.guestDetails?.roomNumber || 'سيتم التأكيد',
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

    } catch (innerError) {
      throw innerError;
    } finally {
      // Release lock
      if (global.paymentLocks) {
        delete global.paymentLocks[lockKey];
      }
    }

  } catch (error) {
    // ...removed console.log for production...
    logger.error('Public payment confirmation error:', error);

    // Ensure lock is released on error
    const lockKey = `payment_lock_${req.body.paymentData?.transactionId}`;
    if (global.paymentLocks) {
      delete global.paymentLocks[lockKey];
    }

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

// Test route to check location data structure
router.get('/test-location/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingNumber: bookingId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      bookingNumber: booking.bookingNumber,
      location: booking.location,
      locationStructure: {
        hasPickupAddress: !!booking.location?.pickup?.address,
        hasDeliveryAddress: !!booking.location?.delivery?.address,
        hasPickupLocation: !!booking.location?.pickupLocation,
        hasDeliveryLocation: !!booking.location?.deliveryLocation,
        pickupValue: booking.location?.pickup?.address || booking.location?.pickupLocation,
        deliveryValue: booking.location?.delivery?.address || booking.location?.deliveryLocation
      }
    });
  } catch (error) {
    // ...removed console.log for production...
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
