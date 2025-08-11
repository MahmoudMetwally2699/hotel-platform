/**
 * Kashier.io Payment Integration Routes
 * Handles payment processing for transportation bookings using Kashier.io
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const TransportationBooking = require('../models/TransportationBooking');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

// Kashier.io configuration
const KASHIER_CONFIG = {
  apiUrl: process.env.KASHIER_API_URL || 'https://payments.kashier.io',
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
    const { bookingId } = req.body;

    console.log('🔵 Create Kashier session request:', { bookingId, userId: req.user._id });

    if (!bookingId) {
      console.log('❌ Booking ID missing');
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Find the booking
    const booking = await TransportationBooking.findOne({
      _id: bookingId,
      guestId: req.user._id,
      bookingStatus: { $in: ['quote_accepted', 'payment_pending'] } // Support both statuses
    }).populate('guest', 'firstName lastName email phone')
      .populate('hotel', 'name');

    console.log('🔍 Booking lookup result:', {
      found: !!booking,
      bookingId: bookingId,
      userId: req.user._id,
      bookingStatus: booking?.bookingStatus,
      hasQuote: !!booking?.quote
    });

    if (!booking) {
      console.log('❌ Booking not found or not ready for payment');
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not ready for payment'
      });
    }

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

    // Prepare payment session data for Kashier.io
    const paymentAmount = booking.payment.totalAmount || booking.quote.finalPrice; // Use payment.totalAmount first

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
      // Find the booking by merchant order ID (booking reference)
      const booking = await TransportationBooking.findOne({
        bookingReference: data.merchantOrderId
      });

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
    const { paymentData } = req.body;
    const { bookingId } = req.params;

    console.log('🔵 Payment confirmation request:', { bookingId, userId: req.user._id, paymentData });

    // Find the booking
    const booking = await TransportationBooking.findOne({
      _id: bookingId,
      guestId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment is already completed
    if (booking.bookingStatus === 'payment_completed') {
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

    // Find the booking (no user restriction for public endpoint)
    const booking = await TransportationBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify the merchantOrderId matches for security
    if (paymentData.merchantOrderId !== booking.bookingReference) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment data'
      });
    }

    // Check if payment is already completed
    if (booking.bookingStatus === 'payment_completed') {
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: { 
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.payment.status 
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

      // Process the payment
      await booking.processKashierPayment(webhookData);

      logger.info('Payment confirmed via public redirect', {
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
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.payment.status
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
