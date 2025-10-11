/**
 * Test script to create a superadmin user
 * Usage: node create-superadmin-test.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // MongoDB Connected (output removed)
  } catch (error) {
  // Database connection error (output removed)
  process.exit(1);
  }
};

// Create superadmin user
const createSuperAdmin = async () => {
  try {
  // Checking if superadmin already exists (output removed)

    // Check if superadmin already exists
    const existingUser = await User.findOne({
      email: 'admin@qickroom.com'
    });

    if (existingUser) {
      // User with this email already exists (output removed)
      // User details (output removed)
      return;
    }
    // No existing user found. Creating new superadmin (output removed)

    // Create superadmin user object (password will be hashed by pre-save middleware)
    const superAdminData = {
      firstName: 'Qickroom',
      lastName: 'Admin',
      email:'admin@qickroom.com',      password: 'Qickroom@super@2035', // Plain password - will be hashed by mongoose middleware
      role: 'superadmin',
      isActive: true,
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
      loginAttempts: 0,
      accountLockUntil: undefined
    };

    // Create user
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    // SuperAdmin created successfully (output removed)
    // User details (output removed)
    // Login credentials and access URLs (output removed)

  } catch (error) {
    // Error creating superadmin (output removed)
    // Duplicate key error and validation errors (output removed)
  }
};

// Main execution
const main = async () => {
  // Starting SuperAdmin creation script (output removed)

  try {
    // Connect to database
    await connectDB();

    // Create superadmin
    await createSuperAdmin();

  } catch (error) {
  // Script execution failed (output removed)
  } finally {
    // Close database connection
  // Closing database connection (output removed)
  await mongoose.connection.close();
  // Database connection closed (output removed)
  process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  // Process interrupted. Closing database connection (output removed)
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // Process terminated. Closing database connection (output removed)
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main();
