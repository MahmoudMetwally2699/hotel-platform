/**
 * Hotel Service Management Platform - Main Server File
 *
 * This is the entry point for the Express.js backend server
 * Handles all middleware setup, route configuration, and server initialization
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/database');
const { globalErrorHandler } = require('./middleware/error');
const logger = require('./utils/logger');

// Load environment variables
require('dotenv').config();

console.log('🚀 Starting Hotel Platform Server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 5000);

// Connect to MongoDB
console.log('📦 Connecting to database...');
connectDB().catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting to work properly behind proxies
app.set('trust proxy', 1);

console.log('⚡ Express app created, setting up Socket.io...');

try {
  // Socket.io setup for real-time communication
  const io = socketIo(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Make io accessible to controllers
  app.set('io', io);

  console.log('🔐 Setting up security middleware...');

  // Security middleware
  app.use(helmet());
  console.log('✅ Helmet configured');

  // CORS configuration
  const corsOptions = {
    origin: function (origin, callback) {
      try {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch (error) {
        console.error('CORS origin function error:', error);
        callback(error);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };  app.use(cors(corsOptions));
  console.log('✅ CORS configured');

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Too many requests from this IP, please try again later'
    }
  });  app.use('/api/', limiter);
  console.log('✅ Rate limiting configured');

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log('✅ Body parsing configured');

  // Compression middleware
  app.use(compression());
  console.log('✅ Compression configured');

  // Logging middleware
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }  console.log('✅ Logging configured');

  // Serve static files
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
  console.log('✅ Static files configured');

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });  console.log('✅ Health check endpoint configured');
  // API Routes
  console.log('📚 Loading routes...');

  try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth routes loaded');
  } catch (error) {
    console.error('❌ Auth routes failed:', error.message);
  }

  try {
    app.use('/api/superadmin', require('./routes/superadmin'));
    console.log('✅ Superadmin routes loaded');
  } catch (error) {
    console.error('❌ Superadmin routes failed:', error.message);
  }

  try {
    app.use('/api/hotel', require('./routes/hotel'));
    console.log('✅ Hotel routes loaded');
  } catch (error) {
    console.error('❌ Hotel routes failed:', error.message);
  }

  try {
    app.use('/api/service', require('./routes/service'));
    console.log('✅ Service routes loaded');
  } catch (error) {
    console.error('❌ Service routes failed:', error.message);
  }

  try {
    app.use('/api/client', require('./routes/client'));
    console.log('✅ Client routes loaded');
  } catch (error) {
    console.error('❌ Client routes failed:', error.message);
  }

  try {
    app.use('/api/upload', require('./routes/upload'));
    console.log('✅ Upload routes loaded');
  } catch (error) {
    console.error('❌ Upload routes failed:', error.message);
  }
  try {
    app.use('/api/payments', require('./routes/payments'));
    console.log('✅ Payment routes loaded');
  } catch (error) {
    console.error('❌ Payment routes failed:', error.message);
  }

  console.log('✅ All routes configured');

  // Socket.io connection handling
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join user to their role-specific room
    socket.on('join-role-room', (data) => {
      const { userId, role } = data;
      socket.join(`${role}-${userId}`);
      socket.join(role); // General role room
      logger.info(`User ${userId} joined ${role} room`);
    });

    // Join hotel-specific room
    socket.on('join-hotel-room', (data) => {
      const { hotelId } = data;
      socket.join(`hotel-${hotelId}`);
      logger.info(`User joined hotel room: ${hotelId}`);
    });

    // Handle booking updates
    socket.on('booking-update', (data) => {
      socket.to(`hotel-${data.hotelId}`).emit('booking-notification', data);
    });

    // Handle service provider notifications
    socket.on('service-request', (data) => {
      socket.to(`service-provider-${data.providerId}`).emit('new-service-request', data);
    });    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io events configured');
  // 404 handler for API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }
    next();
  });

  // Serve React app in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
  }

  console.log('✅ Server setup completed successfully');

} catch (error) {
  console.error('💥 Server setup failed:', error);
  process.exit(1);
}

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
