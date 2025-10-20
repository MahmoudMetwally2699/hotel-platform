/**
 * Check Feedback Fields
 * Quick script to inspect feedback documents and their fields
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');

async function checkFeedbackFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a sample feedback document
    const sample = await Feedback.findOne().lean();

    if (!sample) {
      console.log('No feedback documents found');
      return;
    }

    console.log('\n📋 Sample Feedback Document Structure:');
    console.log(JSON.stringify(sample, null, 2));

    // Count feedback documents
    const totalCount = await Feedback.countDocuments();
    console.log(`\n📊 Total Feedback Documents: ${totalCount}`);

    // Check for documents with status field
    const withStatus = await Feedback.countDocuments({ status: { $exists: true } });
    const withoutStatus = await Feedback.countDocuments({ status: { $exists: false } });

    console.log(`\n✅ Documents with 'status' field: ${withStatus}`);
    console.log(`❌ Documents without 'status' field: ${withoutStatus}`);

    // Check for documents with serviceType field
    const withServiceType = await Feedback.countDocuments({ serviceType: { $exists: true } });
    const withoutServiceType = await Feedback.countDocuments({ serviceType: { $exists: false } });

    console.log(`\n✅ Documents with 'serviceType' field: ${withServiceType}`);
    console.log(`❌ Documents without 'serviceType' field: ${withoutServiceType}`);

    // Show distribution of serviceType values
    const serviceTypeDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📈 Service Type Distribution:');
    serviceTypeDistribution.forEach(item => {
      console.log(`  ${item._id || 'null/undefined'}: ${item.count}`);
    });

    // Show distribution of status values
    const statusDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🔄 Status Distribution:');
    statusDistribution.forEach(item => {
      console.log(`  ${item._id || 'null/undefined'}: ${item.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFeedbackFields();
