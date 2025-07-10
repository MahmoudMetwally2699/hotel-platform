/**
 * Test script for bcrypt password hashing and comparison
 * Run with: node scripts/test-bcrypt.js
 */

const bcrypt = require('bcryptjs');

// Plain text password to test
const password = 'SuperAdmin@2025';

async function testBcrypt() {
  try {
    console.log('Testing bcrypt functionality...');
    console.log('Password:', password);

    // Generate a salt
    console.log('\nGenerating salt...');
    const salt = await bcrypt.genSalt(10);
    console.log('Salt:', salt);

    // Hash the password
    console.log('\nHashing password...');
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hashedPassword);

    // Test correct password comparison
    console.log('\nTesting correct password...');
    const isCorrect = await bcrypt.compare(password, hashedPassword);
    console.log('Is password correct?', isCorrect);

    // Test incorrect password comparison
    console.log('\nTesting incorrect password...');
    const wrongPassword = 'WrongPassword123';
    const isIncorrect = await bcrypt.compare(wrongPassword, hashedPassword);
    console.log('Is wrong password correct?', isIncorrect);

    // Create a fake hash
    console.log('\nTesting with manually created hash...');
    const manualHash = '$2a$10$NME7YxVMB97EAM03C.YNSeB7SdVssB.NtPlQ8.JaWqJNT9FzgCRfK';
    console.log('Manual hash:', manualHash);

    const manualIsCorrect = await bcrypt.compare(password, manualHash);
    console.log('Is manual hash correct?', manualIsCorrect);

    console.log('\nBcrypt test completed successfully!');
  } catch (error) {
    console.error('Error in bcrypt test:', error);
  }
}

testBcrypt();
