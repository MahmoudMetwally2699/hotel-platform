const mongoose = require('mongoose');
require('./config/database');
const TransportationBooking = require('./models/TransportationBooking');
const ServiceProvider = require('./models/ServiceProvider');

mongoose.connection.once('open', async () => {
  try {
    // Check existing transportation bookings
    const bookings = await TransportationBooking.find({})
      .select('bookingReference hotelMarkup hotelId serviceProviderId')
      .limit(5);


    // Check if service provider exists with correct markup
    const serviceProvider = await ServiceProvider.findById('68de6a8c0b3a587570af7267')
      .select('markup businessName');



    process.exit(0);
  } catch (error) {
    // Error occurred; exit with failure
    process.exit(1);
  }
});

setTimeout(() => {
  process.exit(1);
}, 10000);
