/**
 * Migration Script: Populate SLA Timing Fields for Existing Bookings
 *
 * This script calculates and populates SLA timing fields (acceptedAt, startedAt, completedAt,
 * actualResponseTime, actualCompletionTime, actualServiceTime) for existing bookings
 * based on their statusHistory timestamps.
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const TransportationBooking = require('../models/TransportationBooking');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const populateSLATimings = async () => {
  try {
    console.log('\n🔄 Starting SLA timing population...\n');

    // Process regular bookings
    console.log('📋 Processing regular bookings...');
    const bookings = await Booking.find({});
    let updatedBookings = 0;
    let skippedBookings = 0;

    for (const booking of bookings) {
      let updated = false;

      if (!booking.sla) {
        booking.sla = {};
      }

      // Find relevant timestamps from status history
      const acceptedStatuses = ['confirmed', 'assigned'];
      const startedStatuses = ['in-progress', 'in-service', 'picked-up'];
      const completedStatuses = ['completed'];

      // Find acceptedAt from status history
      if (!booking.sla.acceptedAt) {
        const acceptedEntry = booking.statusHistory.find(h => acceptedStatuses.includes(h.status));
        if (acceptedEntry) {
          booking.sla.acceptedAt = acceptedEntry.timestamp;

          // Calculate response time
          const createdTime = booking.createdAt.getTime();
          const acceptedTime = acceptedEntry.timestamp.getTime();
          booking.sla.actualResponseTime = Math.round((acceptedTime - createdTime) / (1000 * 60));

          // Check if response was on time
          const targetResponse = booking.sla.targetResponseTime || 15;
          booking.sla.isResponseOnTime = booking.sla.actualResponseTime <= targetResponse;
          booking.sla.responseDelay = booking.sla.actualResponseTime - targetResponse;

          updated = true;
        }
      }

      // Find startedAt from status history
      if (!booking.sla.startedAt) {
        const startedEntry = booking.statusHistory.find(h => startedStatuses.includes(h.status));
        if (startedEntry) {
          booking.sla.startedAt = startedEntry.timestamp;
          updated = true;
        }
      }

      // Find completedAt from status history
      if (!booking.sla.completedAt && booking.status === 'completed') {
        const completedEntry = booking.statusHistory.find(h => completedStatuses.includes(h.status));
        if (completedEntry) {
          booking.sla.completedAt = completedEntry.timestamp;

          // If acceptedAt was never set (direct completion), set it to createdAt
          if (!booking.sla.acceptedAt) {
            booking.sla.acceptedAt = booking.createdAt;
            booking.sla.actualResponseTime = 0;
            const targetResponse = booking.sla.targetResponseTime || 15;
            booking.sla.isResponseOnTime = true;
            booking.sla.responseDelay = -targetResponse;
          }

          // If startedAt was never set (direct completion), set it to acceptedAt
          if (!booking.sla.startedAt) {
            booking.sla.startedAt = booking.sla.acceptedAt;
          }

          // Calculate completion time
          const createdTime = booking.createdAt.getTime();
          const completedTime = completedEntry.timestamp.getTime();
          booking.sla.actualCompletionTime = Math.round((completedTime - createdTime) / (1000 * 60));

          // Calculate service time if we have startedAt
          if (booking.sla.startedAt) {
            const startedTime = booking.sla.startedAt.getTime();
            booking.sla.actualServiceTime = Math.round((completedTime - startedTime) / (1000 * 60));
          }

          // Check if completion was on time
          const targetCompletion = booking.sla.targetCompletionTime || 120;
          booking.sla.isCompletionOnTime = booking.sla.actualCompletionTime <= targetCompletion;
          booking.sla.completionDelay = booking.sla.actualCompletionTime - targetCompletion;

          // Set overall SLA status
          if (booking.sla.isCompletionOnTime) {
            booking.sla.slaStatus = 'met';
          } else {
            booking.sla.slaStatus = 'missed';
          }

          updated = true;
        }
      }

      // Set pending status for bookings without completion
      if (!booking.sla.slaStatus && booking.status !== 'completed' && booking.status !== 'cancelled') {
        booking.sla.slaStatus = 'pending';
      }

      if (updated) {
        await booking.save({ validateBeforeSave: false });
        updatedBookings++;
        console.log(`  ✓ Updated booking ${booking.bookingNumber} - Response: ${booking.sla.actualResponseTime || 'N/A'}m, Completion: ${booking.sla.actualCompletionTime || 'N/A'}m`);
      } else {
        skippedBookings++;
      }
    }

    console.log(`\n✅ Regular Bookings: ${updatedBookings} updated, ${skippedBookings} skipped (no status history)\n`);

    // Process transportation bookings
    console.log('🚗 Processing transportation bookings...');
    const transportBookings = await TransportationBooking.find({});
    let updatedTransport = 0;
    let skippedTransport = 0;

    for (const booking of transportBookings) {
      let updated = false;

      if (!booking.sla) {
        booking.sla = {};
      }

      // Find relevant timestamps from status history
      const acceptedStatuses = ['quote_sent', 'payment_pending', 'quote_accepted'];
      const startedStatuses = ['service_active'];
      const completedStatuses = ['completed'];

      // Find acceptedAt (when quote was sent)
      if (!booking.sla.acceptedAt) {
        const acceptedEntry = booking.statusHistory.find(h => acceptedStatuses.includes(h.status));
        if (acceptedEntry) {
          booking.sla.acceptedAt = acceptedEntry.timestamp;

          // Calculate response time
          const createdTime = booking.createdAt.getTime();
          const acceptedTime = acceptedEntry.timestamp.getTime();
          booking.sla.actualResponseTime = Math.round((acceptedTime - createdTime) / (1000 * 60));

          // Check if response was on time
          const targetResponse = booking.sla.targetResponseTime || 30;
          booking.sla.isResponseOnTime = booking.sla.actualResponseTime <= targetResponse;
          booking.sla.responseDelay = booking.sla.actualResponseTime - targetResponse;

          updated = true;
        }
      }

      // Find startedAt
      if (!booking.sla.startedAt) {
        const startedEntry = booking.statusHistory.find(h => startedStatuses.includes(h.status));
        if (startedEntry) {
          booking.sla.startedAt = startedEntry.timestamp;
          updated = true;
        }
      }

      // Find completedAt
      if (!booking.sla.completedAt && booking.bookingStatus === 'completed') {
        const completedEntry = booking.statusHistory.find(h => completedStatuses.includes(h.status));
        if (completedEntry) {
          booking.sla.completedAt = completedEntry.timestamp;

          // If acceptedAt was never set (direct completion), set it to createdAt
          if (!booking.sla.acceptedAt) {
            booking.sla.acceptedAt = booking.createdAt;
            booking.sla.actualResponseTime = 0;
            const targetResponse = booking.sla.targetResponseTime || 30;
            booking.sla.isResponseOnTime = true;
            booking.sla.responseDelay = -targetResponse;
          }

          // If startedAt was never set (direct completion), set it to acceptedAt
          if (!booking.sla.startedAt) {
            booking.sla.startedAt = booking.sla.acceptedAt;
          }

          // Calculate completion time
          const createdTime = booking.createdAt.getTime();
          const completedTime = completedEntry.timestamp.getTime();
          booking.sla.actualCompletionTime = Math.round((completedTime - createdTime) / (1000 * 60));

          // Calculate service time if we have startedAt
          if (booking.sla.startedAt) {
            const startedTime = booking.sla.startedAt.getTime();
            booking.sla.actualServiceTime = Math.round((completedTime - startedTime) / (1000 * 60));
          }

          // Check if completion was on time
          const targetCompletion = booking.sla.targetCompletionTime || 240;
          booking.sla.isCompletionOnTime = booking.sla.actualCompletionTime <= targetCompletion;
          booking.sla.completionDelay = booking.sla.actualCompletionTime - targetCompletion;

          // Set overall SLA status
          if (booking.sla.isCompletionOnTime) {
            booking.sla.slaStatus = 'met';
          } else {
            booking.sla.slaStatus = 'missed';
          }

          updated = true;
        }
      }

      // Set pending status for bookings without completion
      if (!booking.sla.slaStatus && booking.bookingStatus !== 'completed' && booking.bookingStatus !== 'cancelled') {
        booking.sla.slaStatus = 'pending';
      }

      if (updated) {
        await booking.save({ validateBeforeSave: false });
        updatedTransport++;
        console.log(`  ✓ Updated transportation ${booking.bookingReference} - Response: ${booking.sla.actualResponseTime || 'N/A'}m, Completion: ${booking.sla.actualCompletionTime || 'N/A'}m`);
      } else {
        skippedTransport++;
      }
    }

    console.log(`\n✅ Transportation Bookings: ${updatedTransport} updated, ${skippedTransport} skipped (no status history)\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`  Total Regular Bookings: ${bookings.length}`);
    console.log(`    - Updated: ${updatedBookings}`);
    console.log(`    - Skipped: ${skippedBookings}`);
    console.log(`  Total Transportation Bookings: ${transportBookings.length}`);
    console.log(`    - Updated: ${updatedTransport}`);
    console.log(`    - Skipped: ${skippedTransport}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await connectDB();
    await populateSLATimings();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

run();
