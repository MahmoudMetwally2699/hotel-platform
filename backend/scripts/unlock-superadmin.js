/**
 * Script to unlock the superadmin user account
 * Run with: node scripts/unlock-superadmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform')
  .then(async () => {
    console.log('MongoDB Connected...');

    try {
      // Find superadmin user
      const superadmin = await User.findOne({
        email: 'mahmetwally@gmail.com',
        role: 'superadmin'
      });

      if (!superadmin) {
        console.log('Superadmin user not found.');
        process.exit(0);
      }

      // Reset login attempts and remove lock
      const update = await User.updateOne(
        { _id: superadmin._id },
        {
          $set: {
            loginAttempts: 0,
            isActive: true
          },
          $unset: { lockUntil: 1 }
        }
      );

      // Update password for good measure
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('SuperAdmin@2025', salt);

      await User.updateOne(
        { _id: superadmin._id },
        { $set: { password: hashedPassword } }
      );

      console.log('Superadmin account unlocked and password reset:');
      console.log(`Email: ${superadmin.email}`);
      console.log('Password: SuperAdmin@2025');

      // Verify the update
      const updatedUser = await User.findById(superadmin._id)
        .select('+loginAttempts +lockUntil +isActive');

      console.log('\nVerification:');
      console.log(`Login Attempts: ${updatedUser.loginAttempts}`);
      console.log(`Lock Until: ${updatedUser.lockUntil || 'None'}`);
      console.log(`Is Active: ${updatedUser.isActive}`);

      process.exit(0);
    } catch (err) {
      console.error('Error unlocking superadmin:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
