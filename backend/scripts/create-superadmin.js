/**
 * Script to create a super admin user
 * Run with: node scripts/create-superadmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// Super admin user data
const superAdminData = {
  firstName: 'Mahmoud',
  lastName: 'Ahmed',
  email: 'mahmetwally@gmail.com',
  phone: '+201211477551',
  password: 'SuperAdmin@2025',  // You should change this to a secure password
  role: 'superadmin',
  isEmailVerified: true,
  isActive: true
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB Connected...');

    try {
      // Check if super admin already exists
      const existingAdmin = await User.findOne({ email: superAdminData.email });

      if (existingAdmin) {
        console.log('Super admin user already exists.');
        process.exit(0);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      superAdminData.password = await bcrypt.hash(superAdminData.password, salt);

      // Create super admin user
      const superAdmin = await User.create(superAdminData);

      console.log('Super admin created successfully:');
      console.log(`Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
      console.log(`Email: ${superAdmin.email}`);
      console.log(`ID: ${superAdmin._id}`);
      console.log('Password: SuperAdmin@2025 (Please change this after first login)');

      process.exit(0);
    } catch (err) {
      console.error('Error creating super admin:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
