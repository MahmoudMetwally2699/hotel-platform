/**
 * Payment Analytics Service
 *
 * Utility functions for managing payment analytics data
 * Used for calculating outstanding amounts and updating payment records
 */

const Booking = require('../models/Booking');
const HotelPayment = require('../models/HotelPayment');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class PaymentAnalyticsService {
  /**
   * Calculate and update outstanding amounts for all hotels
   * This should be run periodically (e.g., daily) to keep outstanding amounts up to date
   */
  static async updateOutstandingAmounts() {
    try {
      logger.info('Starting outstanding amounts calculation...');

      // Get all unique hotels that have paid bookings
      const hotels = await Booking.distinct('hotelId', {
        'payment.paymentStatus': 'paid',
        'payment.paymentMethod': 'online'
      });

      for (const hotelId of hotels) {
        await this.updateHotelOutstandingAmount(hotelId);
      }

      logger.info(`Outstanding amounts updated for ${hotels.length} hotels`);
      return { success: true, hotelsUpdated: hotels.length };
    } catch (error) {
      logger.error('Error updating outstanding amounts:', error);
      throw error;
    }
  }

  /**
   * Calculate and update outstanding amount for a specific hotel
   */
  static async updateHotelOutstandingAmount(hotelId, startDate = null, endDate = null) {
    try {
      // Default to last 30 days if no dates provided
      if (!startDate) {
        endDate = new Date();
        startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      }

      // Get payment analytics for this hotel
      const analytics = await HotelPayment.getPaymentAnalytics(hotelId, startDate, endDate);

      // Calculate total outstanding amount (only from online payments)
      const outstandingAmount = analytics.online.hotelEarnings;

      if (outstandingAmount > 0) {
        // Check if there's already a pending payment record for this period
        let paymentRecord = await HotelPayment.findOne({
          hotelId: new mongoose.Types.ObjectId(hotelId),
          paymentStatus: 'pending',
          'paymentPeriod.startDate': { $lte: endDate },
          'paymentPeriod.endDate': { $gte: startDate }
        });

        if (!paymentRecord) {
          // Create new payment record
          paymentRecord = new HotelPayment({
            hotelId: new mongoose.Types.ObjectId(hotelId),
            paymentPeriod: {
              startDate: startDate,
              endDate: endDate
            },
            outstandingAmount: outstandingAmount,
            paymentBreakdown: {
              onlinePayments: {
                totalAmount: analytics.online.totalAmount,
                count: analytics.online.count,
                hotelEarnings: analytics.online.hotelEarnings
              },
              cashPayments: {
                totalAmount: analytics.cash.totalAmount,
                count: analytics.cash.count,
                hotelEarnings: analytics.cash.hotelEarnings
              }
            },
            currency: 'USD'
          });

          // Get all booking IDs for this period
          const bookings = await Booking.find({
            hotelId: new mongoose.Types.ObjectId(hotelId),
            'payment.paymentStatus': 'paid',
            createdAt: { $gte: startDate, $lte: endDate }
          }).select('_id');

          paymentRecord.metadata.bookingIds = bookings.map(b => b._id);
          paymentRecord.metadata.totalBookings = bookings.length;

          await paymentRecord.save();
        } else {
          // Update existing record
          paymentRecord.outstandingAmount = outstandingAmount;
          paymentRecord.paymentBreakdown = {
            onlinePayments: {
              totalAmount: analytics.online.totalAmount,
              count: analytics.online.count,
              hotelEarnings: analytics.online.hotelEarnings
            },
            cashPayments: {
              totalAmount: analytics.cash.totalAmount,
              count: analytics.cash.count,
              hotelEarnings: analytics.cash.hotelEarnings
            }
          };
          paymentRecord.metadata.lastCalculatedAt = new Date();

          await paymentRecord.save();
        }

        logger.info(`Updated outstanding amount for hotel ${hotelId}: ${outstandingAmount}`);
        return paymentRecord;
      }

      return null;
    } catch (error) {
      logger.error(`Error updating outstanding amount for hotel ${hotelId}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive payment analytics for dashboard
   */
  static async getPaymentAnalyticsSummary(startDate, endDate, hotelId = null) {
    try {
      let matchFilter = {
        'payment.paymentStatus': 'paid',
        createdAt: { $gte: startDate, $lte: endDate }
      };

      if (hotelId && hotelId !== 'all') {
        matchFilter.hotelId = new mongoose.Types.ObjectId(hotelId);
      }

      const summary = await Booking.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$payment.paymentMethod',
            totalAmount: { $sum: '$pricing.totalAmount' },
            hotelEarnings: { $sum: '$pricing.hotelEarnings' },
            providerEarnings: { $sum: '$pricing.providerEarnings' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Format the results
      const analytics = {
        online: { totalAmount: 0, hotelEarnings: 0, providerEarnings: 0, count: 0 },
        cash: { totalAmount: 0, hotelEarnings: 0, providerEarnings: 0, count: 0 }
      };

      summary.forEach(item => {
        const method = item._id === 'online' ? 'online' : 'cash';
        analytics[method] = {
          totalAmount: item.totalAmount,
          hotelEarnings: item.hotelEarnings,
          providerEarnings: item.providerEarnings,
          count: item.count
        };
      });

      // Calculate totals and percentages
      const totalTransactions = analytics.online.count + analytics.cash.count;
      const totalRevenue = analytics.online.totalAmount + analytics.cash.totalAmount;
      const totalHotelEarnings = analytics.online.hotelEarnings + analytics.cash.hotelEarnings;

      return {
        analytics,
        summary: {
          totalTransactions,
          totalRevenue,
          totalHotelEarnings,
          onlinePercentage: totalTransactions > 0 ? (analytics.online.count / totalTransactions) * 100 : 0,
          cashPercentage: totalTransactions > 0 ? (analytics.cash.count / totalTransactions) * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Error getting payment analytics summary:', error);
      throw error;
    }
  }

  /**
   * Generate invoice data for a payment record
   */
  static async generateInvoiceData(paymentId) {
    try {
      const payment = await HotelPayment.findById(paymentId)
        .populate('hotelId', 'name email address phone')
        .populate('paymentDetails.processedBy', 'name email');

      if (!payment) {
        throw new Error('Payment record not found');
      }

      return {
        invoiceNumber: payment.invoice.invoiceNumber,
        generatedAt: payment.invoice.generatedAt,
        hotel: {
          name: payment.hotelId.name,
          email: payment.hotelId.email,
          address: payment.hotelId.address,
          phone: payment.hotelId.phone
        },
        paymentPeriod: payment.paymentPeriod,
        paymentBreakdown: payment.paymentBreakdown,
        totalEarnings: payment.totalEarnings,
        totalTransactions: payment.totalTransactions,
        paymentDetails: payment.paymentDetails,
        currency: payment.currency,
        metadata: payment.metadata
      };
    } catch (error) {
      logger.error('Error generating invoice data:', error);
      throw error;
    }
  }

  /**
   * Mark multiple payments as completed (bulk operation)
   */
  static async markMultiplePaymentsCompleted(paymentIds, paymentDetails, processedBy) {
    try {
      const results = [];

      for (const paymentId of paymentIds) {
        const payment = await HotelPayment.findByIdAndUpdate(
          paymentId,
          {
            $set: {
              paymentStatus: 'completed',
              'paymentDetails.paidAmount': paymentDetails.amount,
              'paymentDetails.paymentDate': new Date(),
              'paymentDetails.paymentMethod': paymentDetails.paymentMethod,
              'paymentDetails.transactionReference': paymentDetails.transactionReference,
              'paymentDetails.notes': paymentDetails.notes,
              'paymentDetails.processedBy': processedBy,
              'invoice.generatedAt': new Date(),
              'invoice.generatedBy': processedBy
            }
          },
          { new: true }
        ).populate('hotelId', 'name');

        if (payment) {
          results.push(payment);
          logger.info(`Payment ${paymentId} marked as completed by ${processedBy}`);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error marking multiple payments as completed:', error);
      throw error;
    }
  }
}

module.exports = PaymentAnalyticsService;
