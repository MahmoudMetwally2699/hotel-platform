const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/database');
const { globalErrorHandler } = require('./middleware/error');
const logger = require('./utils/logger');
const checkoutScheduler = require('./utils/checkoutScheduler');

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

// Start checkout scheduler
console.log('⏰ Starting checkout scheduler...');
checkoutScheduler.start();
console.log('✅ Checkout scheduler started');

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
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
          return;
        }

        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'https://qickroom.cloud',
          'https://www.qickroom.cloud'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      } catch (error) {
        console.error('CORS origin function error:', error);
        callback(error);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
  console.log('✅ CORS configured');
  // Rate limiting disabled
  console.log('✅ Rate limiting disabled');

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log('✅ Body parsing configured');

  // Compression middleware
  app.use(compression());
  console.log('✅ Compression configured');
  // Logging middleware
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }
  console.log('✅ Logging configured');

  // Serve static files (disabled for serverless deployment)
  // app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
  console.log('✅ Static files configured');

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // CORS test endpoint
  app.get('/test-cors', (req, res) => {
    res.status(200).json({
      status: 'CORS working',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      message: 'If you can see this, CORS is configured correctly'
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

  // Upload routes disabled for serverless deployment
  // try {
  //   app.use('/api/upload', require('./routes/upload'));
  //   console.log('✅ Upload routes loaded');
  // } catch (error) {
  //   console.error('❌ Upload routes failed:', error.message);
  // }

  try {
    app.use('/api/payments', require('./routes/payments'));
    console.log('✅ Payment routes loaded');
  } catch (error) {
    console.error('❌ Payment routes failed:', error.message);
  }

  try {
    app.use('/api/payments/kashier', require('./routes/kashierPayments'));
    console.log('✅ Kashier payment routes loaded');
  } catch (error) {
    console.error('❌ Kashier payment routes failed:', error.message);
  }

  try {
    app.use('/api/transportation-bookings', require('./routes/transportationBookings'));
    console.log('✅ Transportation booking routes loaded');
  } catch (error) {
    console.error('❌ Transportation booking routes failed:', error.message);
  }

  try {
    app.use('/api/whatsapp', require('./routes/whatsapp'));
    console.log('✅ WhatsApp webhook routes loaded');
  } catch (error) {
    console.error('❌ WhatsApp webhook routes failed:', error.message);
  }

  try {
    app.use('/api/admin', require('./routes/admin'));
    console.log('✅ Super Hotel admin routes loaded');
  } catch (error) {
    console.error('❌ Super Hotel admin routes failed:', error.message);
  }

  try {
    app.use('/api/loyalty', require('./routes/loyalty'));
    console.log('✅ Loyalty routes loaded');
  } catch (error) {
    console.error('❌ Loyalty routes failed:', error.message);
  }

  try {
    app.use('/api/feedback', require('./routes/feedback'));
    console.log('✅ Feedback routes loaded');
  } catch (error) {
    console.error('❌ Feedback routes failed:', error.message);
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
    });    // Handle service provider notifications
    socket.on('service-request', (data) => {
      socket.to(`service-provider-${data.providerId}`).emit('new-service-request', data);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
  console.log('✅ Socket.io events configured');

  // Serve React app in production
  if (process.env.NODE_ENV === 'production') {
    //app.use(express.static(path.join(__dirname, '../frontend/build')));
  }  // 404 handler for API routes - temporarily disabled
  // app.use('/api', (req, res, next) => {
  //   if (req.url.startsWith('/')) {
  //     return res.status(404).json({
  //       success: false,
  //       message: 'API endpoint not found'
  //     });
  //   }
  //   next();
  // });

  // Handle React routing in production - serve index.html for non-API routes
  if (process.env.NODE_ENV === 'production') {
    //app.use((req, res) => {
      //res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    //});
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
  checkoutScheduler.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  checkoutScheduler.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
