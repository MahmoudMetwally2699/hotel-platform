/**
 * Test Service Filter Endpoints
 * Quick test to verify service filter is working in analytics endpoints
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');

async function testServiceFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test the filter logic
    const hotelId = '68cab5148652dae51624d1e8'; // Replace with actual hotel ID
    const startDate = new Date('2023-10-01');
    const endDate = new Date('2025-10-20');

    console.log('📊 Testing Service Type Filters:\n');

    // Test 1: All services (no filter)
    console.log('1. ALL SERVICES:');
    const allServices = await Feedback.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: 'active',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log(allServices);
    console.log('');

    // Test 2: Laundry only
    console.log('2. LAUNDRY ONLY:');
    const laundryOnly = await Feedback.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      status: 'active',
      serviceType: 'laundry',
      createdAt: { $gte: startDate, $lte: endDate }
    }).countDocuments();
    const laundryAvg = await Feedback.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: 'active',
          serviceType: 'laundry',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    console.log(`  Count: ${laundryOnly}`);
    console.log(`  Avg Rating: ${laundryAvg[0]?.avgRating || 0}`);
    console.log('');

    // Test 3: Maintenance (housekeeping subcategory)
    console.log('3. MAINTENANCE ONLY (Housekeeping subcategory):');
    const maintenanceOnly = await Feedback.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      status: 'active',
      serviceType: 'housekeeping',
      housekeepingType: 'maintenance',
      createdAt: { $gte: startDate, $lte: endDate }
    }).countDocuments();
    const maintenanceAvg = await Feedback.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: 'active',
          serviceType: 'housekeeping',
          housekeepingType: 'maintenance',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    console.log(`  Count: ${maintenanceOnly}`);
    console.log(`  Avg Rating: ${maintenanceAvg[0]?.avgRating || 0}`);
    console.log('');

    // Test 4: Transportation
    console.log('4. TRANSPORTATION ONLY:');
    const transportationOnly = await Feedback.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      status: 'active',
      serviceType: 'transportation',
      createdAt: { $gte: startDate, $lte: endDate }
    }).countDocuments();
    const transportationAvg = await Feedback.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: 'active',
          serviceType: 'transportation',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    console.log(`  Count: ${transportationOnly}`);
    console.log(`  Avg Rating: ${transportationAvg[0]?.avgRating || 0}`);
    console.log('');

    console.log('✅ Service filter test completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testServiceFilter();
