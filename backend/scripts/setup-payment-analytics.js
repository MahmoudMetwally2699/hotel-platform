/**
 * Payment Analytics Setup Script
 *
 * This script initializes the payment analytics system by:
 * 1. Calculating outstanding amounts for all hotels
 * 2. Creating initial payment records
 * 3. Setting up periodic calculation job
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PaymentAnalyticsService = require('../utils/paymentAnalyticsService');
const Hotel = require('../models/Hotel');
const logger = require('../utils/logger');

async function setupPaymentAnalytics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Get all active hotels
    const hotels = await Hotel.find({ isActive: true }).select('_id name');

    // Calculate outstanding amounts for the last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    let processedHotels = 0;
    let hotelsPending = 0;

    for (const hotel of hotels) {
      try {

        const paymentRecord = await PaymentAnalyticsService.updateHotelOutstandingAmount(
          hotel._id,
          startDate,
          endDate
        );

        if (paymentRecord) {
          hotelsPending++;
        } else {
        }

        processedHotels++;
      } catch (error) {
        console.error(`✗ Error processing ${hotel.name}:`, error.message);
      }
    }

    // Get summary of all outstanding payments
    const HotelPayment = require('../models/HotelPayment');
    const outstandingPayments = await HotelPayment.find({ paymentStatus: 'pending' })
      .populate('hotelId', 'name');

    if (outstandingPayments.length > 0) {
      let totalOutstanding = 0;

      outstandingPayments.forEach(payment => {
        const amount = payment.totalEarnings || payment.outstandingAmount;
        totalOutstanding += amount;
      });

    } else {
    }

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  process.exit(0);
}

// Parse days argument
const daysArg = args.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;

if (isNaN(days) || days <= 0) {
  console.error('Error: --days must be a positive number');
  process.exit(1);
}

setupPaymentAnalytics();
