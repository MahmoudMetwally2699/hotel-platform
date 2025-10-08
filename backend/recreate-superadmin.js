/**
 * Script to delete and recreate the superadmin user with correct password
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Database connection
const connectDB = async () => {
  try {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  // MongoDB Connected (output removed)
  } catch (error) {
  // Database connection error (output removed)
  process.exit(1);
  }
};

// Delete and recreate superadmin user
const recreateSuperAdmin = async () => {
  try {
  // Deleting existing superadmin user (output removed)

    // Delete existing user
    const deleteResult = await User.deleteOne({
      email: 'mahmetwally@gmail.com'
    });

  // Delete result (output removed)

  // Creating new superadmin user (output removed)

    // Create new superadmin user (password will be hashed by pre-save middleware)
    const superAdminData = {
      firstName: 'Mahmoud',
      lastName: 'Metwally',
      email: 'mahmetwally@gmail.com',
      password: 'Mah@1234', // Plain password - will be hashed by mongoose middleware
      role: 'superadmin',      isActive: true,
      permissions: {
        canManageHotels: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageSystem: true,
        canAccessAllData: true
      },
      profile: {
        phoneNumber: '',
        address: '',
        bio: 'Platform Super Administrator'
      },
      loginAttempts: 0
    };

    // Create user
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    // SuperAdmin recreated successfully (output removed)
    // User details (output removed)
    // Login credentials (output removed)

  } catch (error) {
    // Error recreating superadmin (output removed)
    // Validation errors (output removed)
  }
};

// Main execution
const main = async () => {
  // Recreating SuperAdmin user (output removed)

  try {
    await connectDB();
    await recreateSuperAdmin();
  } catch (error) {
  // Script execution failed (output removed)
  } finally {
  // Closing database connection (output removed)
  await mongoose.connection.close();
  // Database connection closed (output removed)
  process.exit(0);
  }
};

// Run the script
main();
