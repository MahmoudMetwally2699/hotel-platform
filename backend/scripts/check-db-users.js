/**
 * Database User Check Script
 * This script connects directly to MongoDB and verifies user data
 * Run with: node scripts/check-db-users.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB Connected Successfully!');

    try {
      // Check if super admin exists
      const email = 'mahmetwally@gmail.com';
      console.log(`\nLooking for user with email: ${email}`);

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        console.log('User not found in the database. Please run create-superadmin.js first.');
        process.exit(0);
      }

      console.log('\nUser found!');
      console.log('------------------');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Email Verified: ${user.isEmailVerified}`);
      console.log(`Last Login: ${user.lastLogin || 'Never'}`);

      // Test password verification
      console.log('\nTesting password...');
      const testPassword = 'SuperAdmin@2025';

      // Use the correctPassword method from the User schema
      const isPasswordCorrect = await user.correctPassword(testPassword, user.password);

      if (isPasswordCorrect) {
        console.log('Password is correct! Authentication should work.');
      } else {
        console.log('Password is incorrect! Please check create-superadmin.js');

        // Try to update password
        console.log('\nUpdating password to ensure it works...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);

        user.password = hashedPassword;
        await user.save();

        console.log('Password updated successfully!');
      }

      // Count all users by role
      console.log('\nUser statistics:');
      const userCounts = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      for (const roleCount of userCounts) {
        console.log(`${roleCount._id}: ${roleCount.count} users`);
      }

      process.exit(0);
    } catch (err) {
      console.error('Error checking users:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
