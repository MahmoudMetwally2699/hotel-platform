require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const u = await User.findOne({ email: 'hoteladmin1@mockdata.test' }).select('+password');
  
  if (!u) {
    console.log('User not found!');
    await mongoose.connection.close();
    return;
  }
  
  console.log('Email:', u.email);
  console.log('Role:', u.role);
  console.log('Is bcrypt hash:', u.password && u.password.startsWith('$2'));
  console.log('Password stored length:', u.password?.length);
  console.log('Password preview:', u.password?.substring(0, 10) + '...');
  
  const matchOriginal = await bcrypt.compare('password123', u.password);
  console.log('\n"password123" matches:', matchOriginal);
  
  // Check if the password itself is stored as plaintext
  console.log('Is plaintext "password123":', u.password === 'password123');
  
  await mongoose.connection.close();
})();
