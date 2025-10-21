const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const TransportationBooking = require('./models/TransportationBooking');
require('dotenv').config();

const completePendingBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform');
    console.log('✅ Connected to MongoDB\n');

    // Find all hotels with pending bookings
    const pendingBookings = await Booking.find({
      status: { $in: ['pending', 'confirmed', 'in-progress'] }
    }).limit(5);

    console.log(`📋 Found ${pendingBookings.length} pending/in-progress bookings\n`);

    if (pendingBookings.length === 0) {
      console.log('No bookings to complete. All bookings are already completed or cancelled.');
      mongoose.disconnect();
      return;
    }

    console.log('Do you want to mark these bookings as completed? (This will generate revenue data)\n');

    for (const booking of pendingBookings) {
      console.log(`Booking: ${booking.bookingNumber}`);
      console.log(`  Hotel ID: ${booking.hotelId}`);
      console.log(`  Service: ${booking.serviceType}`);
      console.log(`  Current Status: ${booking.status}`);
      console.log(`  Revenue: EGP ${booking.pricing?.totalAmount || 0}`);

      // Update to completed
      booking.status = 'completed';
      booking.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        notes: 'Completed for testing revenue analytics',
        automaticUpdate: true
      });

      // Set SLA completion time
      if (!booking.sla.completedAt) {
        booking.sla.completedAt = new Date();
        booking.sla.actualCompletionTime = Math.round((new Date() - booking.createdAt) / (1000 * 60));
        booking.sla.isCompletionOnTime = booking.sla.actualCompletionTime <= (booking.sla.targetCompletionTime || 120);
        booking.sla.completionDelay = booking.sla.actualCompletionTime - (booking.sla.targetCompletionTime || 120);
        booking.sla.slaStatus = booking.sla.isCompletionOnTime ? 'met' : 'missed';
      }

      await booking.save({ validateBeforeSave: false });
      console.log(`  ✅ Marked as COMPLETED\n`);
    }

    // Also complete some transportation bookings
    const pendingTransport = await TransportationBooking.find({
      bookingStatus: { $in: ['pending_quote', 'quote_sent', 'confirmed'] }
    }).limit(3);

    if (pendingTransport.length > 0) {
      console.log(`\n🚗 Found ${pendingTransport.length} pending transportation bookings\n`);

      for (const transport of pendingTransport) {
        console.log(`Transport: ${transport.bookingReference}`);
        console.log(`  Hotel ID: ${transport.hotelId}`);
        console.log(`  Current Status: ${transport.bookingStatus}`);
        console.log(`  Revenue: EGP ${transport.quote?.finalPrice || transport.payment?.totalAmount || 0}`);

        transport.bookingStatus = 'completed';
        transport.statusHistory.push({
          status: 'completed',
          timestamp: new Date(),
          automaticUpdate: true
        });

        // Set SLA completion
        if (!transport.sla) {
          transport.sla = {};
        }
        if (!transport.sla.completedAt) {
          transport.sla.completedAt = new Date();
          transport.sla.actualCompletionTime = Math.round((new Date() - transport.createdAt) / (1000 * 60));
          transport.sla.isCompletionOnTime = transport.sla.actualCompletionTime <= 240;
          transport.sla.slaStatus = transport.sla.isCompletionOnTime ? 'met' : 'missed';
        }

        await transport.save({ validateBeforeSave: false });
        console.log(`  ✅ Marked as COMPLETED\n`);
      }
    }

    console.log('\n🎉 Bookings completed! Now refresh your Revenue Analysis page.\n');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

completePendingBookings();
