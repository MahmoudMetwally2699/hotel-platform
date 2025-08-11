const mongoose = require('mongoose');
const ServiceProvider = require('./models/ServiceProvider');
const User = require('./models/User');
require('dotenv').config();

async function checkServiceProvider() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find all service role users
    const serviceUsers = await User.find({ role: 'service' }).select('_id email firstName lastName');
    console.log('Service users:', serviceUsers.length);

    for (const user of serviceUsers) {
      const provider = await ServiceProvider.findOne({ userId: user._id });
      console.log(`User: ${user.email} (${user.firstName} ${user.lastName}) - Provider: ${provider ? 'Found' : 'NOT FOUND'}`);

      if (!provider) {
        console.log(`Creating ServiceProvider for user: ${user.email}`);
        await ServiceProvider.create({
          userId: user._id,
          businessName: `${user.firstName} ${user.lastName} Services`,
          businessType: 'transportation',
          contactEmail: user.email,
          contactPhone: user.phone || '000-000-0000',
          businessDescription: 'Transportation service provider',
          serviceCategories: ['transportation'],
          isActive: true,
          isVerified: true
        });
        console.log('ServiceProvider created successfully');
      }
    }

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkServiceProvider();
