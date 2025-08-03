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
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create superadmin user
const createSuperAdmin = async () => {
  try {
    console.log('🔍 Checking if superadmin already exists...');

    // Check if superadmin already exists
    const existingUser = await User.findOne({
      email: 'mahmetwally@gmail.com'
    });

    if (existingUser) {
      console.log('❌ User with this email already exists:', existingUser.email);      console.log('📋 User details:', {
        id: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
        createdAt: existingUser.createdAt
      });
      return;
    }    console.log('✅ No existing user found. Creating new superadmin...');

    // Create superadmin user object (password will be hashed by pre-save middleware)
    const superAdminData = {
      firstName: 'Mahmoud',
      lastName: 'Metwally',
      email: 'mahmetwally@gmail.com',      password: 'Mah@1234', // Plain password - will be hashed by mongoose middleware
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

    console.log('🎉 SuperAdmin created successfully!');
    console.log('📋 User details:', {
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
      firstName: superAdmin.firstName,      lastName: superAdmin.lastName,
      isActive: superAdmin.isActive,
      createdAt: superAdmin.createdAt
    });

    console.log('\n🔐 Login credentials:');
    console.log('Email:', superAdmin.email);
    console.log('Password: Mah@1234');
    console.log('\n🌐 Access URLs:');
    console.log('SuperAdmin Login: http://localhost:3000/superadmin/login');
    console.log('SuperAdmin Dashboard: http://localhost:3000/superadmin/dashboard');

  } catch (error) {
    console.error('❌ Error creating superadmin:', error);

    if (error.code === 11000) {
      console.log('🔍 Duplicate key error - user might already exist');
      console.log('Duplicate field:', Object.keys(error.keyValue));
    }

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
  console.log('🚀 Starting SuperAdmin creation script...');
  console.log('📧 Email: mahmetwally@gmail.com');
  console.log('🔑 Password: Mah@1234');
  console.log('👑 Role: superadmin\n');

  try {
    // Connect to database
    await connectDB();

    // Create superadmin
    await createSuperAdmin();

  } catch (error) {
    console.error('💥 Script execution failed:', error);
  } finally {
    // Close database connection
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main();
