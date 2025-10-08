const mongoose = require('mongoose');

const checkAndUpdateBookings = async () => {
  try {
    // Connect directly to MongoDB
    await mongoose.connect('mongodb+srv://mahmmetwally99:Mah%401999@cluster0.iefjn43.mongodb.net/hotel-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  // Connected to database (output removed)

    const TransportationBooking = require('./models/TransportationBooking');
    const ServiceProvider = require('./models/ServiceProvider');

    // Find the service provider with ID 68de6a8c0b3a587570af7267
    const serviceProvider = await ServiceProvider.findById('68de6a8c0b3a587570af7267')
      .select('markup businessName hotelId');

    if (!serviceProvider) {
      // Service provider not found (output removed)
      return;
    }

    // Service Provider found (output removed)

    // Find transportation bookings for this service provider
    const bookings = await TransportationBooking.find({
      serviceProviderId: serviceProvider._id
    }).select('bookingReference hotelMarkup serviceProviderId hotelId');

  // Found bookings for this service provider (output removed)

    for (const booking of bookings) {
      // Booking details and update (output removed)

      // Update booking if markup is incorrect
      if (booking.hotelMarkup?.percentage !== serviceProvider.markup?.percentage) {
        booking.hotelMarkup.percentage = serviceProvider.markup.percentage;
        await booking.save();
        // Updated booking markup (output removed)
      }
    }

    process.exit(0);
  } catch (error) {
    // Error occurred; exit with failure
    process.exit(1);
  }
};

checkAndUpdateBookings();
