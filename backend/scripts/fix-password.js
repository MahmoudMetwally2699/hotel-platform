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

  const plaintext = u.password; // "Mah@1234"
  console.log('Current plaintext password:', plaintext);

  // Hash it manually and update directly
  const hashed = await bcrypt.hash(plaintext, 12);
  await User.updateOne({ _id: u._id }, { $set: { password: hashed } });

  // Verify
  const updated = await User.findOne({ _id: u._id }).select('+password');
  const matches = await bcrypt.compare(plaintext, updated.password);
  console.log('Is now bcrypt hash:', updated.password.startsWith('$2'));
  console.log('Password "' + plaintext + '" matches:', matches);

  await mongoose.connection.close();
  console.log('\n✅ Done! Login with: hoteladmin1@mockdata.test / ' + plaintext);
})();
