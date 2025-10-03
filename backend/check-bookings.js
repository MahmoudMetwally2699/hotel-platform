const mongoose = require('mongoose');
require('./config/database');
const TransportationBooking = require('./models/TransportationBooking');
const ServiceProvider = require('./models/ServiceProvider');

mongoose.connection.once('open', async () => {
  try {
    console.log('📋 Checking existing Transportation Bookings...');

    // Check existing transportation bookings
    const bookings = await TransportationBooking.find({})
      .select('bookingReference hotelMarkup hotelId serviceProviderId')
      .limit(5);

    console.log(`Found ${bookings.length} transportation bookings:`);
    bookings.forEach(booking => {
      console.log({
        ref: booking.bookingReference,
        hotelMarkup: booking.hotelMarkup,
        hotelId: booking.hotelId?.toString(),
        serviceProviderId: booking.serviceProviderId?.toString()
      });
    });

    console.log('\n🔧 Checking Service Provider markup...');

    // Check if service provider exists with correct markup
    const serviceProvider = await ServiceProvider.findById('68de6a8c0b3a587570af7267')
      .select('markup businessName');

    if (serviceProvider) {
      console.log('Service Provider found:', {
        businessName: serviceProvider.businessName,
        markup: serviceProvider.markup
      });
    } else {
      console.log('❌ Service provider not found with that ID');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

setTimeout(() => {
  console.log('❌ Database connection timeout');
  process.exit(1);
}, 10000);
