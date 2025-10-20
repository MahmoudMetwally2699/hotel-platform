/**
 * Migration Script: Fix Housekeeping Types
 *
 * This script updates existing housekeeping bookings and feedbacks to populate
 * the housekeepingType field based on the specificCategory field.
 *
 * Mapping:
 * - Maintenance: electrical_issues, plumbing_issues, ac_heating, furniture_repair, electronics_issues
 * - Cleaning: general_cleaning, deep_cleaning, stain_removal
 * - Amenities: bathroom_amenities, room_supplies, cleaning_supplies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');

// Category mappings
const CATEGORY_MAPPINGS = {
  maintenance: ['electrical_issues', 'plumbing_issues', 'ac_heating', 'furniture_repair', 'electronics_issues'],
  cleaning: ['general_cleaning', 'deep_cleaning', 'stain_removal'],
  amenities: ['bathroom_amenities', 'room_supplies', 'cleaning_supplies']
};

/**
 * Determine housekeeping type from specific categories
 */
function getHousekeepingType(specificCategories) {
  if (!specificCategories || !Array.isArray(specificCategories) || specificCategories.length === 0) {
    return null;
  }

  // Check which type the first category belongs to
  for (const [type, categories] of Object.entries(CATEGORY_MAPPINGS)) {
    if (specificCategories.some(cat => categories.includes(cat))) {
      return type;
    }
  }

  return null;
}

async function fixHousekeepingTypes() {
  try {
    console.log('🚀 Starting housekeeping types migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ====================
    // FIX BOOKINGS
    // ====================
    console.log('📦 Processing Bookings...');

    // Find all housekeeping bookings without housekeepingType
    const bookingsToFix = await Booking.find({
      serviceType: 'housekeeping',
      'serviceDetails.housekeepingType': { $exists: false }
    });

    console.log(`Found ${bookingsToFix.length} housekeeping bookings without housekeepingType`);

    let bookingsUpdated = 0;
    let bookingsSkipped = 0;

    for (const booking of bookingsToFix) {
      const specificCategories = booking.serviceDetails?.specificCategory;
      const housekeepingType = getHousekeepingType(specificCategories);

      if (housekeepingType) {
        booking.serviceDetails.housekeepingType = housekeepingType;
        await booking.save();
        bookingsUpdated++;
        console.log(`  ✓ Updated booking ${booking.bookingNumber}: ${housekeepingType}`);
      } else {
        bookingsSkipped++;
        console.log(`  ⚠ Skipped booking ${booking.bookingNumber}: No mappable categories`);
      }
    }

    console.log(`\n📊 Bookings Summary:`);
    console.log(`  - Updated: ${bookingsUpdated}`);
    console.log(`  - Skipped: ${bookingsSkipped}`);
    console.log(`  - Total: ${bookingsToFix.length}\n`);

    // ====================
    // FIX FEEDBACKS
    // ====================
    console.log('💬 Processing Feedbacks...');

    // Find all housekeeping feedbacks without housekeepingType
    const feedbacksToFix = await Feedback.find({
      serviceType: 'housekeeping',
      $or: [
        { housekeepingType: { $exists: false } },
        { housekeepingType: null }
      ]
    }).populate('bookingId');

    console.log(`Found ${feedbacksToFix.length} housekeeping feedbacks without housekeepingType`);

    let feedbacksUpdated = 0;
    let feedbacksSkipped = 0;

    for (const feedback of feedbacksToFix) {
      if (!feedback.bookingId) {
        feedbacksSkipped++;
        console.log(`  ⚠ Skipped feedback ${feedback._id}: No booking reference`);
        continue;
      }

      const booking = feedback.bookingId;
      const housekeepingType = booking.serviceDetails?.housekeepingType;

      if (housekeepingType) {
        feedback.housekeepingType = housekeepingType;
        await feedback.save();
        feedbacksUpdated++;
        console.log(`  ✓ Updated feedback ${feedback._id}: ${housekeepingType}`);
      } else {
        // Try to determine from specificCategory if booking doesn't have it
        const specificCategories = booking.serviceDetails?.specificCategory;
        const determinedType = getHousekeepingType(specificCategories);

        if (determinedType) {
          feedback.housekeepingType = determinedType;
          await feedback.save();
          feedbacksUpdated++;
          console.log(`  ✓ Updated feedback ${feedback._id}: ${determinedType} (determined)`);
        } else {
          feedbacksSkipped++;
          console.log(`  ⚠ Skipped feedback ${feedback._id}: Could not determine type`);
        }
      }
    }

    console.log(`\n📊 Feedbacks Summary:`);
    console.log(`  - Updated: ${feedbacksUpdated}`);
    console.log(`  - Skipped: ${feedbacksSkipped}`);
    console.log(`  - Total: ${feedbacksToFix.length}\n`);

    // ====================
    // VERIFICATION
    // ====================
    console.log('🔍 Verification...');

    const bookingsWithType = await Booking.countDocuments({
      serviceType: 'housekeeping',
      'serviceDetails.housekeepingType': { $exists: true, $ne: null }
    });

    const bookingsWithoutType = await Booking.countDocuments({
      serviceType: 'housekeeping',
      $or: [
        { 'serviceDetails.housekeepingType': { $exists: false } },
        { 'serviceDetails.housekeepingType': null }
      ]
    });

    const feedbacksWithType = await Feedback.countDocuments({
      serviceType: 'housekeeping',
      housekeepingType: { $exists: true, $ne: null }
    });

    const feedbacksWithoutType = await Feedback.countDocuments({
      serviceType: 'housekeeping',
      $or: [
        { housekeepingType: { $exists: false } },
        { housekeepingType: null }
      ]
    });

    console.log(`\n✅ Final Status:`);
    console.log(`Bookings:`);
    console.log(`  - With housekeepingType: ${bookingsWithType}`);
    console.log(`  - Without housekeepingType: ${bookingsWithoutType}`);
    console.log(`Feedbacks:`);
    console.log(`  - With housekeepingType: ${feedbacksWithType}`);
    console.log(`  - Without housekeepingType: ${feedbacksWithoutType}`);

    console.log('\n✨ Migration completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixHousekeepingTypes();
