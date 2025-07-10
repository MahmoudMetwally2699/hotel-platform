/**
 * Test server startup with detailed error tracking
 */
require('dotenv').config();

// Catch all unhandled errors
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

async function testServer() {
  try {
    console.log('🚀 Testing server startup...');

    // Load dependencies step by step
    console.log('1. Loading Express...');
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const morgan = require('morgan');
    const rateLimit = require('express-rate-limit');
    const compression = require('compression');
    const path = require('path');
    const http = require('http');
    const socketIo = require('socket.io');
    console.log('✅ Dependencies loaded');    console.log('2. Loading utilities...');
    const { connectDB } = require('./config/database');
    const { globalErrorHandler } = require('./middleware/error');
    const logger = require('./utils/logger');
    console.log('✅ Utilities loaded');

    console.log('3. Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    console.log('4. Creating Express app...');
    const app = express();
    const server = http.createServer(app);
    console.log('✅ Express app created');

    console.log('5. Setting up Socket.io...');
    const io = socketIo(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    app.set('io', io);
    console.log('✅ Socket.io configured');

    console.log('6. Setting up middleware...');
    app.use(helmet());
    app.use(cors({
      origin: ['http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    }));
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(compression());
    console.log('✅ Middleware configured');

    console.log('7. Setting up routes...');
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Test loading route files
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth routes loaded');

    app.use('/api/superadmin', require('./routes/superadmin'));
    console.log('✅ Superadmin routes loaded');

    app.use('/api/hotel', require('./routes/hotel'));
    console.log('✅ Hotel routes loaded');

    app.use('/api/service', require('./routes/service'));
    console.log('✅ Service routes loaded');

    app.use('/api/client', require('./routes/client'));
    console.log('✅ Client routes loaded');

    app.use('/api/upload', require('./routes/upload'));
    console.log('✅ Upload routes loaded');

    app.use('/api/payments', require('./routes/payments'));
    console.log('✅ Payment routes loaded');    console.log('8. Setting up error handling...');
    app.use(globalErrorHandler);
    console.log('✅ Error handler configured');

    console.log('9. Starting server...');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log('✅ Server started successfully!');
    });

    // Setup socket events
    io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.id}`);
      });
    });

  } catch (error) {
    console.error('💥 Server test failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testServer();
