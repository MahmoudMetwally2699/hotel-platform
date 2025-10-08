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
  // Connected to MongoDB (output removed)

    // Get current date
    const now = new Date();

    // Find all ServiceProviders with expired insurance
    const expiredProviders = await ServiceProvider.find({
      'insurance.expiryDate': { $lte: now }
    });

  // Found providers with expired insurance (output removed)

    for (const provider of expiredProviders) {
      // Provider details and update (output removed)

      // Set new expiry date to one year from now
      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

      // Update using findByIdAndUpdate to avoid triggering full validation
      await ServiceProvider.findByIdAndUpdate(
        provider._id,
        { 'insurance.expiryDate': newExpiryDate },
        { runValidators: false }
      );

      // Updated expiry date (output removed)
    }

  // All expired insurance dates have been updated (output removed)

  } catch (error) {
    // Error fixing expired insurance (output removed)
  } finally {
    await mongoose.disconnect();
  }
}

fixExpiredInsurance();
