require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');

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

  console.log('Total bookings:', total);
  console.log('With status history:', withHistory);
  console.log('Without status history:', withoutHistory);

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

  console.log('By category:', categories);

  process.exit();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
