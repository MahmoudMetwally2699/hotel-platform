/**
 * Auth Route Check Script
 * This script tests the login route implementation in the auth.js file
 * Run with: node scripts/check-auth-route.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform');
    console.log('MongoDB Connected Successfully!');

    // Get the user
    const email = 'mahmetwally@gmail.com';
    console.log(`\nLooking for user with email: ${email}`);

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    console.log('\nUser details:');
    console.log('------------------');
    console.log(`ID: ${user._id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password Hash: ${user.password}`);
    console.log(`isActive: ${user.isActive}`);
    console.log(`isEmailVerified: ${user.isEmailVerified}`);
    console.log(`Login Attempts: ${user.loginAttempts}`);
    console.log(`Lock Until: ${user.lockUntil}`);

    // Test password manually
    const password = 'SuperAdmin@2025';
    console.log(`\nTesting password '${password}'...`);

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log(`Password is ${isPasswordCorrect ? 'CORRECT' : 'INCORRECT'}`);

    // Manually implement the login route logic
    console.log('\nSimulating auth route login logic:');

    // Check if user is active
    if (!user.isActive) {
      console.log('User is not active!');
    } else {
      console.log('User is active: ✓');
    }

    // Check if account is locked
    const isLocked = user.lockUntil && user.lockUntil > Date.now();
    if (isLocked) {
      console.log(`Account is locked until: ${new Date(user.lockUntil)}`);
    } else {
      console.log('Account is not locked: ✓');
    }

    // Reset login attempts if successful
    if (isPasswordCorrect && user.loginAttempts > 0) {
      console.log(`Resetting login attempts from ${user.loginAttempts} to 0`);
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save({ validateBeforeSave: false });
      console.log('Login attempts reset: ✓');
    }

    // Final determination
    if (isPasswordCorrect && !isLocked && user.isActive) {
      console.log('\n✅ Login should SUCCEED with these credentials');
    } else {
      console.log('\n❌ Login would FAIL with these credentials');

      if (!isPasswordCorrect) console.log('- Incorrect password');
      if (isLocked) console.log('- Account is locked');
      if (!user.isActive) console.log('- User is not active');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

run();
