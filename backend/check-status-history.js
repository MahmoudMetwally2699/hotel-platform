require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Connected to MongoDB (output removed)

  const withHistory = await Booking.countDocuments({
    statusHistory: { $exists: true, $ne: [] }
  });

  const withoutHistory = await Booking.countDocuments({
    $or: [
      { statusHistory: { $exists: false } },
      { statusHistory: [] }
    ]
  });

  const total = await Booking.countDocuments();

  // Total bookings, with/without status history (output removed)

  const categories = await Booking.aggregate([
    {
      $group: {
        _id: '$serviceDetails.category',
        count: { $sum: 1 },
        withHistory: {
          $sum: {
            $cond: [
              { $and: [{ $exists: ['$statusHistory'] }, { $ne: ['$statusHistory', []] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // By category (output removed)

  process.exit();
}).catch(err => {
  // Error occurred; exit with failure
  process.exit(1);
});
