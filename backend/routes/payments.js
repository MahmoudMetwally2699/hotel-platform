const express = require('express');
const router = express.Router();

// Initialize Stripe only if valid API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ Stripe not configured - payment routes will be disabled');
}

const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const ServiceProvider = require('../models/ServiceProvider');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

/**
 * Middleware to check if Stripe is configured
 */
const checkStripeConfigured = (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Payment service is not configured. Please contact support.'
    });
  }
  next();
};

/**
 * @desc    Create payment intent for booking
 * @route   POST /api/payments/create-intent
 * @access  Private (Guest)
 */
router.post('/create-intent', protect, restrictTo('guest'), checkStripeConfigured, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
      status: 'pending'
    }).populate('serviceId', 'name').populate('hotelId', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: booking.currency || 'egp',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id.toString(),
        hotelId: booking.hotelId._id.toString(),
        serviceProviderId: booking.serviceProviderId.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent ID in booking
    booking.paymentDetails = booking.paymentDetails || {};
    booking.paymentDetails.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.totalAmount
      }
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing error'
    });
  }
});

/**
 * @desc    Confirm payment
 * @route   POST /api/payments/confirm
 * @access  Private (Guest)
 */
router.post('/confirm', protect, restrictTo('guest'), checkStripeConfigured, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    const bookingId = paymentIntent.metadata.bookingId;

    // Update booking status
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to confirm this payment'
      });
    }

    booking.status = 'confirmed';
    booking.paymentDetails = {
      ...booking.paymentDetails,
      status: 'paid',
      method: 'credit_card',
      paymentIntentId: paymentIntentId,
      paidAt: new Date()
    };
    await booking.save();

    // Send confirmation emails
    try {
      // To guest
      await sendEmail({
        email: req.user.email,
        subject: 'Payment Confirmation - Your Booking is Confirmed',
        message: `
          Dear ${req.user.firstName},

          Your payment of ${booking.totalAmount} ${booking.currency} has been successfully processed.
          Your booking is now confirmed.

          Booking ID: ${booking._id}
          Date: ${new Date(booking.bookingDate).toLocaleDateString()}

          Thank you for your booking!
          Hotel Service Platform
        `
      });

      // Also notify service provider
      const provider = await ServiceProvider.findById(booking.serviceProviderId)
        .populate('userId', 'email firstName lastName');

      if (provider && provider.userId && provider.userId.email) {
        await sendEmail({
          email: provider.userId.email,
          subject: 'New Booking Confirmed',
          message: `
            Dear ${provider.userId.firstName},

            A new booking has been confirmed for your service.

            Booking ID: ${booking._id}
            Date: ${new Date(booking.bookingDate).toLocaleDateString()}
            Amount: ${booking.providerAmount} ${booking.currency}

            Please check your dashboard for details.

            Hotel Service Platform
          `
        });
      }
    } catch (emailError) {
      logger.error('Failed to send payment confirmation email', { error: emailError });
    }

    res.json({
      success: true,
      data: {
        booking: {
          id: booking._id,
          status: booking.status
        }
      }
    });
  } catch (error) {
    logger.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing error'
    });
  }
});

/**
 * @desc    Process refund
 * @route   POST /api/payments/refund
 * @access  Private (Hotel Admin)
 */
router.post('/refund', protect, restrictTo('hotel'), checkStripeConfigured, async (req, res) => {
  try {
    const { bookingId, amount, reason } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      hotelId: req.user.hotelId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.paymentDetails || !booking.paymentDetails.paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this booking'
      });
    }

    if (booking.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been refunded'
      });
    }

    // Calculate refund amount
    const refundAmount = amount ? Math.round(amount * 100) : Math.round(booking.totalAmount * 100);

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentDetails.paymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer'
    });

    // Update booking
    booking.status = 'refunded';
    booking.paymentDetails.refundId = refund.id;
    booking.paymentDetails.refundAmount = refundAmount / 100;
    booking.paymentDetails.refundReason = reason || 'Customer request';
    booking.paymentDetails.refundedAt = new Date();
    await booking.save();

    // Notify guest about refund
    try {
      const user = await User.findById(booking.userId);
      await sendEmail({
        email: user.email,
        subject: 'Refund Processed for Your Booking',
        message: `
          Dear ${user.firstName},

          A refund of ${refundAmount / 100} ${booking.currency} has been processed for your booking.

          Booking ID: ${booking._id}
          Refund Amount: ${refundAmount / 100} ${booking.currency}
          Reason: ${reason || 'Customer request'}

          If you have any questions, please contact customer support.

          Hotel Service Platform
        `
      });
    } catch (emailError) {
      logger.error('Failed to send refund notification email', { error: emailError });
    }

    logger.info(`Refund processed for booking ${bookingId}`, {
      bookingId,
      refundId: refund.id,
      amount: refundAmount / 100,
      processedBy: req.user.id
    });

    res.json({
      success: true,
      data: {
        refund: {
          id: refund.id,
          amount: refundAmount / 100,
          status: refund.status
        }
      }
    });
  } catch (error) {
    logger.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing error'
    });
  }
});

/**
 * @desc    Get service provider payout summary
 * @route   GET /api/payments/provider/payout-summary
 * @access  Private (Service Provider)
 */
router.get('/provider/payout-summary', protect, restrictTo('service'), async (req, res) => {
  try {
    const providerId = req.user.serviceProviderId;

    // Time range filters
    const timeRange = req.query.timeRange || '30days'; // default to last 30 days

    let dateFilter = { serviceProviderId: providerId };
    const now = new Date();

    switch (timeRange) {
      case '7days':
        dateFilter.bookingDate = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case '30days':
        dateFilter.bookingDate = { $gte: new Date(now.setDate(now.getDate() - 30)) };
        break;
      case '90days':
        dateFilter.bookingDate = { $gte: new Date(now.setDate(now.getDate() - 90)) };
        break;
      case 'all':
        // No additional filter
        break;
      default:
        dateFilter.bookingDate = { $gte: new Date(now.setDate(now.getDate() - 30)) };
    }

    // Get completed bookings with payments
    const bookings = await Booking.find({
      ...dateFilter,
      status: 'completed',
      'paymentDetails.status': 'paid'
    }).select('providerAmount hotelCommission totalAmount bookingDate serviceId');

    // Group by date and service
    const payoutsByDate = {};
    const payoutsByService = {};
    let totalEarnings = 0;

    bookings.forEach(booking => {
      // Add to total
      totalEarnings += booking.providerAmount;

      // Group by date (use date without time)
      const dateKey = new Date(booking.bookingDate).toISOString().split('T')[0];
      if (!payoutsByDate[dateKey]) {
        payoutsByDate[dateKey] = {
          date: dateKey,
          amount: 0,
          bookings: 0
        };
      }
      payoutsByDate[dateKey].amount += booking.providerAmount;
      payoutsByDate[dateKey].bookings += 1;

      // Group by service
      const serviceId = booking.serviceId.toString();
      if (!payoutsByService[serviceId]) {
        payoutsByService[serviceId] = {
          serviceId,
          amount: 0,
          bookings: 0
        };
      }
      payoutsByService[serviceId].amount += booking.providerAmount;
      payoutsByService[serviceId].bookings += 1;
    });

    res.json({
      success: true,
      data: {
        totalEarnings,
        bookingsCount: bookings.length,
        payoutsByDate: Object.values(payoutsByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
        payoutsByService: Object.values(payoutsByService).sort((a, b) => b.amount - a.amount),
        timeRange
      }
    });
  } catch (error) {
    logger.error('Get payout summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payout data'
    });
  }
});

module.exports = router;
