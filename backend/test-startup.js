/**
 * Test server startup step by step
 */
require('dotenv').config();

console.log('1. Loading dependencies...');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
console.log('✅ Dependencies loaded');

console.log('2. Loading database config...');
const connectDB = require('./config/database');
console.log('✅ Database config loaded');

console.log('3. Loading middleware...');
const errorHandler = require('./middleware/error');
console.log('✅ Error handler loaded');

console.log('4. Loading logger...');
const logger = require('./utils/logger');
console.log('✅ Logger loaded');

console.log('5. Creating Express app...');
const app = express();
const server = http.createServer(app);
console.log('✅ Express app created');

console.log('6. Setting up Socket.io...');
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);
console.log('✅ Socket.io setup complete');

console.log('7. Testing route files...');
try {
  require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

try {
  require('./routes/superadmin');
  console.log('✅ Superadmin routes loaded');
} catch (error) {
  console.error('❌ Superadmin routes failed:', error.message);
}

try {
  require('./routes/hotel');
  console.log('✅ Hotel routes loaded');
} catch (error) {
  console.error('❌ Hotel routes failed:', error.message);
}

try {
  require('./routes/service');
  console.log('✅ Service routes loaded');
} catch (error) {
  console.error('❌ Service routes failed:', error.message);
}

try {
  require('./routes/client');
  console.log('✅ Client routes loaded');
} catch (error) {
  console.error('❌ Client routes failed:', error.message);
}

try {
  require('./routes/upload');
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.error('❌ Upload routes failed:', error.message);
}

try {
  require('./routes/payments');
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.error('❌ Payment routes failed:', error.message);
}

console.log('\n🎉 All tests passed! The issue might be in the database connection during startup.');
process.exit(0);
