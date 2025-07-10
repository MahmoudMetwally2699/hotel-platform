/**
 * Script to verify user password hash in the database
 * Run with: node scripts/check-password.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// Email to check
const email = 'mahmetwally@gmail.com';
const plainPassword = 'SuperAdmin@2025';

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform')
  .then(async () => {
    console.log('MongoDB Connected...');

    try {
      // Find the user
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        console.log(`User with email ${email} not found in the database.`);
        process.exit(1);
      }

      console.log('User found:');
      console.log('--------------');
      console.log('ID:', user._id);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Password Hash:', user.password);
      console.log('--------------');

      // Test the password
      console.log('Verifying password...');
      const isMatch = await bcrypt.compare(plainPassword, user.password);

      if (isMatch) {
        console.log('Password is correct!');
      } else {
        console.log('Password is INCORRECT!');

        // Update the password
        console.log('Updating password to ensure it works...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        user.password = hashedPassword;
        await user.save();

        console.log('Password updated successfully!');
        console.log('New password hash:', hashedPassword);
      }

      process.exit(0);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
