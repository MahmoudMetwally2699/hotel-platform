/**
 * Check Transportation Bookings and Feedback
 * Quick script to see which transportation bookings have feedback
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TransportationBooking = require('./models/TransportationBooking');
const Feedback = require('./models/Feedback');

async function checkTransportationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all transportation bookings
    const transportationBookings = await TransportationBooking.find()
      .select('bookingReference guestId serviceProviderId status payment createdAt')
      .populate('guestId', 'firstName lastName email')
      .lean();

    console.log('📦 Transportation Bookings:\n');

    for (const booking of transportationBookings) {
      const feedback = await Feedback.findOne({ bookingId: booking._id });

      console.log(`Booking: ${booking.bookingReference}`);
      console.log(`  Guest: ${booking.guestId?.firstName} ${booking.guestId?.lastName}`);
      console.log(`  Email: ${booking.guestId?.email}`);
      console.log(`  Status: ${booking.status?.current}`);
      console.log(`  Payment Status: ${booking.payment?.status}`);
      console.log(`  Created: ${booking.createdAt?.toLocaleDateString()}`);
      console.log(`  Has Feedback: ${feedback ? `YES (Rating: ${feedback.rating}/5)` : 'NO'}`);
      console.log('');
    }

    // Summary
    const totalBookings = transportationBookings.length;
    const bookingsWithFeedback = await Feedback.countDocuments({
      bookingId: { $in: transportationBookings.map(b => b._id) }
    });

    console.log('\n📊 Summary:');
    console.log(`Total Transportation Bookings: ${totalBookings}`);
    console.log(`Bookings with Feedback: ${bookingsWithFeedback}`);
    console.log(`Bookings without Feedback: ${totalBookings - bookingsWithFeedback}`);

    // Check completed bookings specifically
    const completedBookings = transportationBookings.filter(b =>
      b.status?.current === 'completed' ||
      (b.payment?.status === 'completed' && b.status?.current !== 'cancelled')
    );

    console.log(`\nCompleted Bookings: ${completedBookings.length}`);

    for (const booking of completedBookings) {
      const hasFeedback = await Feedback.findOne({ bookingId: booking._id });
      if (!hasFeedback) {
        console.log(`  ❌ No feedback: ${booking.bookingReference} - ${booking.guestId?.email}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTransportationData();
