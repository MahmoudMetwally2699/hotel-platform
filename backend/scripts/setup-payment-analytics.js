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
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all active hotels
    const hotels = await Hotel.find({ isActive: true }).select('_id name');
    console.log(`Found ${hotels.length} active hotels`);

    // Calculate outstanding amounts for the last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    console.log(`Calculating outstanding amounts from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    let processedHotels = 0;
    let hotelsPending = 0;

    for (const hotel of hotels) {
      try {
        console.log(`Processing hotel: ${hotel.name}...`);

        const paymentRecord = await PaymentAnalyticsService.updateHotelOutstandingAmount(
          hotel._id,
          startDate,
          endDate
        );

        if (paymentRecord) {
          console.log(`✓ Created payment record for ${hotel.name} - Outstanding: EGP ${paymentRecord.outstandingAmount.toLocaleString()}`);
          hotelsPending++;
        } else {
          console.log(`- No outstanding payments for ${hotel.name}`);
        }

        processedHotels++;
      } catch (error) {
        console.error(`✗ Error processing ${hotel.name}:`, error.message);
      }
    }

    console.log('\n=== Setup Complete ===');
    console.log(`Hotels processed: ${processedHotels}/${hotels.length}`);
    console.log(`Hotels with pending payments: ${hotelsPending}`);

    // Get summary of all outstanding payments
    const HotelPayment = require('../models/HotelPayment');
    const outstandingPayments = await HotelPayment.find({ paymentStatus: 'pending' })
      .populate('hotelId', 'name');

    if (outstandingPayments.length > 0) {
      console.log('\n=== Outstanding Payments Summary ===');
      let totalOutstanding = 0;

      outstandingPayments.forEach(payment => {
        const amount = payment.totalEarnings || payment.outstandingAmount;
        totalOutstanding += amount;
        console.log(`${payment.hotelId.name}: EGP ${amount.toLocaleString()}`);
      });

      console.log(`\nTotal Outstanding: EGP ${totalOutstanding.toLocaleString()}`);
    } else {
      console.log('\nNo outstanding payments found.');
    }

    console.log('\n=== Next Steps ===');
    console.log('1. Access the Super Admin dashboard');
    console.log('2. Navigate to Analytics > Payment Management tab');
    console.log('3. Review outstanding payments and mark them as paid');
    console.log('4. Set up a periodic job to run updateOutstandingAmounts() daily');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Payment Analytics Setup Script');
  console.log('');
  console.log('Usage: node setup-payment-analytics.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --days=N       Calculate for N days back (default: 30)');
  console.log('');
  console.log('Examples:');
  console.log('  node setup-payment-analytics.js');
  console.log('  node setup-payment-analytics.js --days=7');
  process.exit(0);
}

// Parse days argument
const daysArg = args.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;

if (isNaN(days) || days <= 0) {
  console.error('Error: --days must be a positive number');
  process.exit(1);
}

console.log('=== Hotel Platform Payment Analytics Setup ===');
console.log(`Calculating outstanding amounts for the last ${days} days...`);
console.log('');

setupPaymentAnalytics();
