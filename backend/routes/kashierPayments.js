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
    const paymentData = {
      mid: KASHIER_CONFIG.merchantId,
      amount: paymentAmount,
      currency: KASHIER_CONFIG.currency,
      orderId: booking.bookingReference,
      merchantRedirect: `${process.env.FRONTEND_URL}/bookings/${booking._id}/payment-success`,
      failureRedirect: `${process.env.FRONTEND_URL}/bookings/${booking._id}/payment-failed`,
      webhookUrl: `${process.env.BACKEND_URL}/api/payments/kashier/webhook`,
      displayCurrencyIso: KASHIER_CONFIG.currency,
      mode: KASHIER_CONFIG.mode
    };

    console.log('💰 Payment data prepared:', {
      mid: paymentData.mid,
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
    const webhookData = req.body;
    const signature = req.get('X-Kashier-Signature');

    logger.info('Kashier webhook received', {
      orderId: webhookData.orderId,
      status: webhookData.status,
      transactionId: webhookData.transactionId
    });

    // Verify webhook signature (if configured)
    if (KASHIER_CONFIG.secretKey && !verifyKashierHash(req.body, signature)) {
      logger.error('Kashier webhook hash verification failed', {
        orderId: webhookData.orderId,
        signature: signature
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Find the booking by order ID (booking reference)
    const booking = await TransportationBooking.findOne({
      bookingReference: webhookData.orderId
    });

    if (!booking) {
      logger.error('Booking not found for Kashier webhook', {
        orderId: webhookData.orderId
      });
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Process the payment based on webhook status
    await booking.processKashierPayment(webhookData);

    // Send appropriate notifications based on payment status
    if (webhookData.status === 'SUCCESS' || webhookData.status === 'PAID') {
      logger.info('Payment completed successfully', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        transactionId: webhookData.transactionId,
        amount: booking.payment.totalAmount
      });

      // TODO: Send payment success email to guest
      // TODO: Send payment notification to service provider
      // TODO: Update hotel revenue tracking
    } else if (webhookData.status === 'FAILED' || webhookData.status === 'ERROR') {
      logger.error('Payment failed', {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        transactionId: webhookData.transactionId,
        failureReason: webhookData.failureReason || webhookData.error
      });

      // TODO: Send payment failure notification to guest
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    logger.error('Kashier webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
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
 * Generate hash for Kashier.io API requests
 * Based on Kashier documentation: hash = SHA256(mid + amount + currency + orderId + secret)
 */
function generateKashierHash(data) {
  if (!KASHIER_CONFIG.secretKey) {
    logger.warn('Kashier secret key not configured');
    return null;
  }

  // Extract the path and secret from the secret key
  const secretParts = KASHIER_CONFIG.secretKey.split('$');
  const path = secretParts[0];
  const secret = secretParts[1];

  // Create the hash string according to Kashier documentation
  const hashString = `${data.mid}${data.amount}${data.currency}${data.orderId}${path}`;

  const hash = crypto
    .createHash('sha256')
    .update(hashString)
    .digest('hex');

  logger.info('Generated Kashier hash', {
    hashString: hashString.substring(0, 50) + '...', // Log partial string for debugging
    hash: hash
  });

  return hash;
}

/**
 * Verify Kashier.io webhook hash
 */
function verifyKashierHash(payload, receivedHash) {
  if (!KASHIER_CONFIG.secretKey || !receivedHash) {
    return false;
  }

  const expectedHash = generateKashierHash({
    mid: payload.mid || KASHIER_CONFIG.merchantId,
    amount: payload.amount,
    currency: payload.currency,
    orderId: payload.orderId
  });

  return crypto.timingSafeEqual(
    Buffer.from(receivedHash),
    Buffer.from(expectedHash)
  );
}

module.exports = router;
