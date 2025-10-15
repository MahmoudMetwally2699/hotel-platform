/**
 * Find all laundry bookings and show their guestId status
 */

const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const MONGODB_URI = 'mongodb+srv://mahmmetwally99:Mah%401999@cluster0.iefjn43.mongodb.net/hotel-platform';

async function checkLaundryBookings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('Finding all laundry bookings...');
    const bookings = await Booking.find({
      serviceType: 'laundry'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    console.log(`\n📦 Found ${bookings.length} laundry bookings:\n`);
    console.log('─'.repeat(100));

    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking Number: ${booking.bookingNumber}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Created: ${booking.createdAt}`);
      console.log(`   Guest ID: ${booking.guestId || '❌ UNDEFINED'}`);
      console.log(`   FeedbackRequest.isRequested: ${booking.feedbackRequest?.isRequested || false}`);

      // Check the raw document to see if guestId exists at all
      const rawDoc = booking.toObject();
      console.log(`   Raw guestId in document: ${rawDoc.guestId ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    console.log('\n' + '─'.repeat(100));

    // Count bookings without guestId
    const withoutGuest = bookings.filter(b => !b.guestId).length;
    console.log(`\n⚠️  ${withoutGuest} out of ${bookings.length} bookings are missing guestId!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLaundryBookings();
