/**
 * SuperHotel Model
 *
 * MongoDB schema for super hotels that can supervise multiple hotels
 * Includes credentials management and hotel assignments
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const superHotelSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Super hotel name is required'],
    trim: true,
    maxlength: [100, 'Super hotel name cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Authentication Credentials
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    index: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // Assigned Hotels - These are the hotels this super hotel can supervise
  assignedHotels: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel'
  }],

  // Contact Information
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    email: {
      type: String,
      validate: [validator.isEmail, 'Please provide a valid contact email']
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[\+]?[\d\s\-\(\)\.]{7,20}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    }
  },

  // Status and Management
  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  lastLoginAt: {
    type: Date
  },

  // Settings and Permissions
  permissions: {
    canViewStatistics: {
      type: Boolean,
      default: true
    },
    canViewClients: {
      type: Boolean,
      default: true
    },
    canViewAnalytics: {
      type: Boolean,
      default: true
    },
    canViewBookings: {
      type: Boolean,
      default: true
    },
    canViewRevenue: {
      type: Boolean,
      default: false // Sensitive data, default to false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
superHotelSchema.index({ email: 1 });
superHotelSchema.index({ isActive: 1 });
superHotelSchema.index({ createdBy: 1 });

// Virtual for hotel count
superHotelSchema.virtual('hotelCount').get(function() {
  return this.assignedHotels ? this.assignedHotels.length : 0;
});

// Pre-save middleware to hash password
superHotelSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save middleware to update updatedAt
superHotelSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Instance method to check password
superHotelSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
superHotelSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method to find by credentials
superHotelSchema.statics.findByCredentials = async function(email, password) {
  const superHotel = await this.findOne({ email, isActive: true }).select('+password');

  if (!superHotel || !(await superHotel.correctPassword(password, superHotel.password))) {
    return null;
  }

  return superHotel;
};

// Update lastLoginAt when accessed
superHotelSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};

const SuperHotel = mongoose.model('SuperHotel', superHotelSchema);

module.exports = SuperHotel;
