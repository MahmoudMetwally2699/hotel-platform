const mongoose = require('mongoose');

const checkAndUpdateBookings = async () => {
  try {
    // Connect directly to MongoDB
    await mongoose.connect('mongodb+srv://mahmmetwally99:Mah%401999@cluster0.iefjn43.mongodb.net/hotel-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to database');

    const TransportationBooking = require('./models/TransportationBooking');
    const ServiceProvider = require('./models/ServiceProvider');

    // Find the service provider with ID 68de6a8c0b3a587570af7267
    const serviceProvider = await ServiceProvider.findById('68de6a8c0b3a587570af7267')
      .select('markup businessName hotelId');

    if (!serviceProvider) {
      console.log('❌ Service provider not found');
      return;
    }

    console.log('🔧 Service Provider found:', {
      businessName: serviceProvider.businessName,
      markup: serviceProvider.markup,
      hotelId: serviceProvider.hotelId
    });

    // Find transportation bookings for this service provider
    const bookings = await TransportationBooking.find({
      serviceProviderId: serviceProvider._id
    }).select('bookingReference hotelMarkup serviceProviderId hotelId');

    console.log(`📋 Found ${bookings.length} bookings for this service provider:`);

    for (const booking of bookings) {
      console.log({
        ref: booking.bookingReference,
        currentMarkup: booking.hotelMarkup,
        needsUpdate: booking.hotelMarkup?.percentage !== serviceProvider.markup?.percentage
      });

      // Update booking if markup is incorrect
      if (booking.hotelMarkup?.percentage !== serviceProvider.markup?.percentage) {
        booking.hotelMarkup.percentage = serviceProvider.markup.percentage;
        await booking.save();
        console.log(`✅ Updated booking ${booking.bookingReference} markup to ${serviceProvider.markup.percentage}%`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAndUpdateBookings();
