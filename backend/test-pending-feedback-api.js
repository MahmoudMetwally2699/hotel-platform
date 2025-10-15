/**
 * Test the pending-feedback API endpoint logic
 */

const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const MONGODB_URI = 'mongodb+srv://mahmmetwally99:Mah%401999@cluster0.iefjn43.mongodb.net/hotel-platform';
const guestId = '68d64681bd5823296290553e'; // The guest ID from the bookings

async function testPendingFeedbackQuery() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`Testing query for guest: ${guestId}\n`);
    console.log('Query conditions:');
    console.log('  - guestId:', guestId);
    console.log('  - status: completed');
    console.log('  - feedbackRequest.isRequested: true');
    console.log('  - feedbackRequest.isSkipped: false');
    console.log('  - feedbackRequest.isFeedbackSubmitted: false\n');

    const pendingFeedback = await Booking.find({
      guestId: guestId,
      status: 'completed',
      'feedbackRequest.isRequested': true,
      'feedbackRequest.isSkipped': false,
      'feedbackRequest.isFeedbackSubmitted': false
    })
    .sort({ 'feedbackRequest.requestedAt': -1 })
    .limit(1);

    console.log(`📬 Query Result: Found ${pendingFeedback.length} pending feedback request(s)\n`);

    if (pendingFeedback[0]) {
      const booking = pendingFeedback[0];
      console.log('✅ PENDING FEEDBACK FOUND!');
      console.log('─'.repeat(80));
      console.log('Booking Number:', booking.bookingNumber);
      console.log('Status:', booking.status);
      console.log('Service ID:', booking.serviceId || 'N/A');
      console.log('Hotel ID:', booking.hotelId || 'N/A');
      console.log('Created:', booking.createdAt);
      console.log('\nFeedback Request Details:');
      console.log('  isRequested:', booking.feedbackRequest.isRequested);
      console.log('  requestedAt:', booking.feedbackRequest.requestedAt);
      console.log('  isSkipped:', booking.feedbackRequest.isSkipped);
      console.log('  isFeedbackSubmitted:', booking.feedbackRequest.isFeedbackSubmitted);
      console.log('─'.repeat(80));
      console.log('\n🎉 The API should return this booking to the guest!');
    } else {
      console.log('❌ NO PENDING FEEDBACK FOUND');
      console.log('\nLet\'s check what\'s in the database...\n');

      // Check all completed bookings for this guest
      const allCompleted = await Booking.find({
        guestId: guestId,
        status: 'completed'
      }).select('bookingNumber feedbackRequest');

      console.log(`Found ${allCompleted.length} completed bookings for this guest:`);
      allCompleted.forEach((b, i) => {
        console.log(`\n${i+1}. ${b.bookingNumber}`);
        console.log('   isRequested:', b.feedbackRequest?.isRequested);
        console.log('   isSkipped:', b.feedbackRequest?.isSkipped);
        console.log('   isFeedbackSubmitted:', b.feedbackRequest?.isFeedbackSubmitted);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPendingFeedbackQuery();
