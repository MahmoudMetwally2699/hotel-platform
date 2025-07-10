/**
 * Role Mapping Check Script
 * This script verifies the role values between frontend and backend
 * Run with: node scripts/check-role-mapping.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// Get the enum values from the User model
const userRoleEnum = User.schema.path('role').enumValues;
console.log('Backend User Model Role Values:', userRoleEnum);

// Try to read frontend role values from LoginPage.js
try {
  const loginPagePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'auth', 'LoginPage.js');
  const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');

  // Extract role options using regex
  const roleOptions = [];
  const regex = /<option value="([^"]+)">([^<]+)<\/option>/g;
  let match;

  while ((match = regex.exec(loginPageContent)) !== null) {
    roleOptions.push({
      value: match[1],
      label: match[2]
    });
  }

  console.log('\nFrontend LoginPage Role Options:');
  console.table(roleOptions);

  // Check for mismatches
  const frontendRoleValues = roleOptions.map(option => option.value);
  const mismatches = [];

  for (const frontendRole of frontendRoleValues) {
    if (!userRoleEnum.includes(frontendRole)) {
      mismatches.push({
        frontend: frontendRole,
        backend: 'Not found',
        suggestion: userRoleEnum.find(r => r.includes(frontendRole.replace('_', '')) || frontendRole.includes(r))
      });
    }
  }

  for (const backendRole of userRoleEnum) {
    if (!frontendRoleValues.includes(backendRole)) {
      mismatches.push({
        frontend: 'Not found',
        backend: backendRole,
        suggestion: frontendRoleValues.find(r => r.includes(backendRole) || backendRole.includes(r))
      });
    }
  }

  if (mismatches.length > 0) {
    console.log('\n⚠️ Role Value Mismatches Found:');
    console.table(mismatches);
    console.log('\nSuggested fixes:');
    for (const mismatch of mismatches) {
      if (mismatch.frontend !== 'Not found' && mismatch.suggestion) {
        console.log(`- Change frontend "${mismatch.frontend}" to "${mismatch.suggestion}"`);
      }
    }
  } else {
    console.log('\n✅ No role value mismatches found!');
  }

} catch (err) {
  console.error('Error reading LoginPage.js:', err.message);
}

// Disconnect from MongoDB
mongoose.disconnect();
