/**
 * Fix Super Admin Script
 * This script fixes the superadmin account by:
 * 1. Updating the password
 * 2. Resetting login attempts
 * 3. Ensuring the isActive flag is set to true
 * Run with: node scripts/fix-superadmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// New password
const PASSWORD = 'SuperAdmin@2025';

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform')
  .then(async () => {
    console.log('MongoDB Connected...');

    try {      // Find the super admin
      const email = 'mahmetwally@gmail.com';
      const user = await User.findOne({ email }).select('+isActive');

      if (!user) {
        console.error('Super admin not found!');
        process.exit(1);
      }

      console.log('Super admin found:');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(PASSWORD, salt);      // Check the schema fields
      console.log('\nChecking User schema fields:');
      console.log('Schema paths:', Object.keys(User.schema.paths));

      // Update the user with all possible isActive field variations
      const result = await User.updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            isActive: true,
            'isActive': true,
            loginAttempts: 0
          },
          $unset: {
            lockUntil: 1
          }
        }
      );

      console.log('\nUpdate result:', result);
        // Verify the update
      const updatedUser = await User.findOne({ email }).select('+password +loginAttempts +isActive');

      console.log('\nUpdated super admin:');
      console.log(`ID: ${updatedUser._id}`);
      console.log(`isActive: ${updatedUser.isActive}`);
      console.log(`Login Attempts: ${updatedUser.loginAttempts}`);
      console.log(`Lock Until: ${updatedUser.lockUntil || 'Not set (unlocked)'}`);

      // Test password
      const isPasswordCorrect = await bcrypt.compare(PASSWORD, updatedUser.password);
      console.log(`\nPassword verification: ${isPasswordCorrect ? 'CORRECT' : 'INCORRECT'}`);

      if (updatedUser.isActive && isPasswordCorrect && !updatedUser.lockUntil && updatedUser.loginAttempts === 0) {
        console.log('\n✅ Super admin account has been fixed successfully!');
        console.log('You can now log in with:');
        console.log(`- Email: ${email}`);
        console.log(`- Password: ${PASSWORD}`);
        console.log(`- Role: ${updatedUser.role}`);
      } else {
        console.log('\n❌ Some issues remain with the super admin account:');
        if (!updatedUser.isActive) console.log('- Account is still inactive');
        if (!isPasswordCorrect) console.log('- Password is still incorrect');
        if (updatedUser.lockUntil) console.log('- Account is still locked');
        if (updatedUser.loginAttempts !== 0) console.log('- Login attempts were not reset');
      }

      process.exit(0);
    } catch (err) {
      console.error('Error fixing super admin:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
