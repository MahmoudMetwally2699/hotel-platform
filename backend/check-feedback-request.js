/**
 * Check if booking has feedbackRequest set properly
 */

const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const MONGODB_URI = 'mongodb+srv://mahmmetwally99:Mah%401999@cluster0.iefjn43.mongodb.net/hotel-platform';
const bookingId = '68ef54db5bf9b206e380a05d'; // Updated to new booking

async function checkFeedbackRequest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`Checking booking: ${bookingId}`);
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log('❌ Booking not found!');
      process.exit(1);
    }

    console.log('\n📋 Booking Details:');
    console.log('─────────────────────────────');
    console.log('Booking Number:', booking.bookingNumber);
    console.log('Status:', booking.status);
    console.log('Guest ID:', booking.guest);
    console.log('Service Type:', booking.serviceType);
    console.log('Created:', booking.createdAt);
    console.log('Completed At:', booking.completedAt);

    console.log('\n📬 Feedback Request Status:');
    console.log('─────────────────────────────');
    if (booking.feedbackRequest) {
      console.log('✅ feedbackRequest object exists');
      console.log('isRequested:', booking.feedbackRequest.isRequested);
      console.log('requestedAt:', booking.feedbackRequest.requestedAt);
      console.log('isSkipped:', booking.feedbackRequest.isSkipped);
      console.log('skippedAt:', booking.feedbackRequest.skippedAt);
      console.log('isFeedbackSubmitted:', booking.feedbackRequest.isFeedbackSubmitted);
      console.log('submittedAt:', booking.feedbackRequest.submittedAt);
      console.log('feedbackId:', booking.feedbackRequest.feedbackId);
    } else {
      console.log('❌ feedbackRequest object does NOT exist!');
      console.log('This means the booking model update did not apply properly.');
    }

    console.log('\n🔍 Status History (last 3):');
    console.log('─────────────────────────────');
    const lastThree = booking.statusHistory.slice(-3);
    lastThree.forEach(h => {
      console.log(`- ${h.status} at ${h.timestamp} (auto: ${h.automaticUpdate})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFeedbackRequest();
