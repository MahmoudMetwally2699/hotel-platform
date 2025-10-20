/**
 * Migration Script: Fix Transportation Feedback
 *
 * This script ensures all transportation-related feedback has the correct serviceType
 * and verifies the relationship with TransportationBooking records.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const TransportationBooking = require('../models/TransportationBooking');

async function fixTransportationFeedback() {
  try {
    console.log('🚀 Starting transportation feedback migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ====================
    // CHECK TRANSPORTATION BOOKINGS
    // ====================
    console.log('🚗 Checking Transportation Bookings...');

    const totalTransportationBookings = await TransportationBooking.countDocuments();
    console.log(`Total transportation bookings: ${totalTransportationBookings}`);

    const completedTransportation = await TransportationBooking.countDocuments({
      'status.current': 'completed'
    });
    console.log(`Completed transportation bookings: ${completedTransportation}\n`);

    // ====================
    // CHECK TRANSPORTATION FEEDBACK
    // ====================
    console.log('💬 Checking Transportation Feedback...');

    // Count feedback with serviceType = 'transportation'
    const transportationFeedbackCount = await Feedback.countDocuments({
      serviceType: 'transportation'
    });
    console.log(`Feedback with serviceType 'transportation': ${transportationFeedbackCount}`);

    // Find all transportation feedback
    const transportationFeedbacks = await Feedback.find({
      serviceType: 'transportation'
    }).lean();

    console.log('\nTransportation Feedback Details:');
    for (const feedback of transportationFeedbacks) {
      console.log(`  - Feedback ID: ${feedback._id}`);
      console.log(`    Booking ID: ${feedback.bookingId}`);
      console.log(`    Rating: ${feedback.rating}/5`);
      console.log(`    Created: ${feedback.createdAt}`);
      console.log(`    Has housekeepingType: ${feedback.housekeepingType || 'No'}\n`);
    }

    // ====================
    // FIX FEEDBACK WITH TRANSPORTATION BOOKING REFERENCES
    // ====================
    console.log('🔧 Fixing feedback linked to TransportationBooking...');

    // Find all TransportationBooking IDs
    const transportationBookingIds = await TransportationBooking.find().distinct('_id');
    console.log(`Found ${transportationBookingIds.length} transportation booking IDs`);

    // Find feedback that references TransportationBookings but might have wrong serviceType
    const feedbackToFix = await Feedback.find({
      bookingId: { $in: transportationBookingIds }
    });

    console.log(`Found ${feedbackToFix.length} feedback records linked to transportation bookings\n`);

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const feedback of feedbackToFix) {
      if (feedback.serviceType !== 'transportation') {
        console.log(`  ⚠️  Fixing feedback ${feedback._id}: changing serviceType from '${feedback.serviceType}' to 'transportation'`);
        feedback.serviceType = 'transportation';

        // Remove housekeepingType if it exists (shouldn't be on transportation)
        if (feedback.housekeepingType) {
          console.log(`     Removing housekeepingType: ${feedback.housekeepingType}`);
          feedback.housekeepingType = undefined;
        }

        await feedback.save();
        fixed++;
      } else {
        alreadyCorrect++;
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`  - Fixed: ${fixed}`);
    console.log(`  - Already Correct: ${alreadyCorrect}`);
    console.log(`  - Total Processed: ${feedbackToFix.length}\n`);

    // ====================
    // VERIFICATION
    // ====================
    console.log('🔍 Final Verification...');

    const finalTransportationCount = await Feedback.countDocuments({
      serviceType: 'transportation'
    });

    const transportationWithHousekeeping = await Feedback.countDocuments({
      serviceType: 'transportation',
      housekeepingType: { $exists: true, $ne: null }
    });

    console.log(`\n✅ Final Status:`);
    console.log(`Transportation Feedback:`);
    console.log(`  - Total: ${finalTransportationCount}`);
    console.log(`  - With housekeepingType (should be 0): ${transportationWithHousekeeping}`);

    // Show service type distribution
    const serviceTypeDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`\n📈 Service Type Distribution:`);
    serviceTypeDistribution.forEach(item => {
      console.log(`  ${item._id || 'null/undefined'}: ${item.count}`);
    });

    console.log('\n✨ Migration completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixTransportationFeedback();
