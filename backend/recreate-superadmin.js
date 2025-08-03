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
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Delete and recreate superadmin user
const recreateSuperAdmin = async () => {
  try {
    console.log('🗑️  Deleting existing superadmin user...');

    // Delete existing user
    const deleteResult = await User.deleteOne({
      email: 'mahmetwally@gmail.com'
    });

    console.log('Delete result:', deleteResult);

    console.log('✅ Creating new superadmin user...');

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

    console.log('🎉 SuperAdmin recreated successfully!');
    console.log('📋 User details:', {
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,      isActive: superAdmin.isActive,
      createdAt: superAdmin.createdAt
    });

    console.log('\n🔐 Login credentials:');
    console.log('Email:', superAdmin.email);
    console.log('Password: Mah@1234');

  } catch (error) {
    console.error('❌ Error recreating superadmin:', error);

    if (error.errors) {
      console.log('📋 Validation errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`- ${field}: ${error.errors[field].message}`);
      });
    }
  }
};

// Main execution
const main = async () => {
  console.log('🔄 Recreating SuperAdmin user...\n');

  try {
    await connectDB();
    await recreateSuperAdmin();
  } catch (error) {
    console.error('💥 Script execution failed:', error);
  } finally {
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  }
};

// Run the script
main();
