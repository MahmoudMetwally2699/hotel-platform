/**
 * Script to fix expired insurance dates for ServiceProviders
 * This will update any ServiceProviders with expired insurance to have a future expiry date
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ServiceProvider = require('./models/ServiceProvider');

async function fixExpiredInsurance() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get current date
    const now = new Date();

    // Find all ServiceProviders with expired insurance
    const expiredProviders = await ServiceProvider.find({
      'insurance.expiryDate': { $lte: now }
    });

    console.log(`Found ${expiredProviders.length} providers with expired insurance:`);

    for (const provider of expiredProviders) {
      console.log(`- ${provider.name}: expires ${provider.insurance.expiryDate}`);

      // Set new expiry date to one year from now
      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

      // Update using findByIdAndUpdate to avoid triggering full validation
      await ServiceProvider.findByIdAndUpdate(
        provider._id,
        { 'insurance.expiryDate': newExpiryDate },
        { runValidators: false }
      );

      console.log(`  -> Updated to expire on: ${newExpiryDate}`);
    }

    console.log('\n✅ All expired insurance dates have been updated!');

  } catch (error) {
    console.error('❌ Error fixing expired insurance:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixExpiredInsurance();
