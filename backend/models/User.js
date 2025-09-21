/**
 * User Model
 *
 * MongoDB schema for all user types in the hotel platform
 * Supports Super Admin, Hotel Admin, Service Provider, and Guest roles
 * Includes authentication, role-based permissions, and profile management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },

  lastName: {
    type: String,
    required: function() {
      // Only require lastName for service providers and admins, make it optional for guests
      return this.role !== 'guest';
    },
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },  phone: {
    type: String,
    required: function() {
      // Only require phone for guest users
      return this.role === 'guest';
    },
    validate: {
      validator: function(v) {
        // More flexible phone validation - allows +, -, spaces, parentheses
        return !v || /^[\+]?[\d\s\-\(\)\.]{7,20}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
  minlength: [4, 'Password must be at least 4 characters'],
    select: false,
  // No complexity validation for guest registration
  },

  // Role and Permissions
  role: {
    type: String,
    enum: {
      values: ['superadmin', 'hotel', 'service', 'guest'],
      message: 'Role must be one of: superadmin, hotel, service, guest'
    },
    required: [true, 'User role is required'],
    index: true
  },

  // Profile Information
  avatar: {
    type: String,
    default: 'default-avatar.jpg'
  },

  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        return date < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },

  // Address Information
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },

  // Role-specific References
  hotelId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: function() {
      return this.role === 'hotel';
    }
  },

  serviceProviderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ServiceProvider',
    required: function() {
      return this.role === 'service';
    }
  },

  // Guest-specific fields
  selectedHotelId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: function() {
      return this.role === 'guest';
    }
  },  checkInDate: {
    type: Date,
    required: function() {
      // Only require when making actual bookings
      return this.role === 'guest' && this.hasActiveBooking;
    }
  },

  checkOutDate: {
    type: Date,
    required: function() {
      // Only require when making actual bookings
      return this.role === 'guest' && this.hasActiveBooking;
    },
    validate: {
      validator: function(checkOut) {
        return !this.checkInDate || !checkOut || checkOut > this.checkInDate;
      },
      message: 'Check-out date must be after check-in date'
    }
  },

  roomNumber: {
    type: String,
    required: function() {
      // Only require when making actual bookings
      return this.role === 'guest' && this.hasActiveBooking;
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
    // Removed select: false so hotel admins can manage guest status
  },

  // Checkout-related fields
  checkoutTime: {
    type: Date,
    default: function() {
      if (this.checkOutDate && this.role === 'guest') {
        const checkoutDateTime = new Date(this.checkOutDate);
        checkoutDateTime.setHours(16, 0, 0, 0); // Set to 4:00 PM
        return checkoutDateTime;
      }
      return null;
    }
  },

  autoDeactivatedAt: {
    type: Date,
    default: null
  },

  deactivationReason: {
    type: String,
    enum: ['checkout_expired', 'manual', 'admin_action'],
    default: null
  },

  // Booking status
  hasActiveBooking: {
    type: Boolean,
    default: false
  },

  // Security
  passwordChangedAt: {
    type: Date,
    select: false
  },

  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },

  // Login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },

  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'admin'],
      default: 'web'
    },
    referralCode: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ hotelId: 1, role: 1 });
userSchema.index({ serviceProviderId: 1, role: 1 });
userSchema.index({ selectedHotelId: 1, role: 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Set password changed timestamp
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

userSchema.pre('save', function(next) {
  // Validate role-specific requirements
  if (this.role === 'guest') {
    // Only require hotel selection during registration
    if (!this.selectedHotelId) {
      console.log('Guest validation failed: missing selectedHotelId');
      return next(new Error('Guest users must select a hotel'));
    }
    // Check-in/out dates and room number are only required when hasActiveBooking is true
    if (this.hasActiveBooking && (!this.checkInDate || !this.checkOutDate || !this.roomNumber ||
        (typeof this.roomNumber === 'string' && this.roomNumber.trim() === ''))) {
      console.log('Guest booking validation failed:', {
        selectedHotelId: this.selectedHotelId,
        checkInDate: this.checkInDate,
        checkOutDate: this.checkOutDate,
        roomNumber: this.roomNumber
      });
      return next(new Error('Guest users with active bookings must have check-in/out dates and room number'));
    }
  }

  if (this.role === 'hotel' && !this.hotelId) {
    return next(new Error('Hotel admin users must be associated with a hotel'));
  }

  if (this.role === 'service' && !this.serviceProviderId) {
    return next(new Error('Service provider users must be associated with a service provider'));
  }

  next();
});

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();

  // Remove sensitive fields
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;

  return userObject;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

userSchema.statics.findByHotel = function(hotelId) {
  return this.find({
    $or: [
      { hotelId },
      { selectedHotelId: hotelId }
    ],
    isActive: true
  });
};

// Auto-deactivation methods
userSchema.methods.deactivateAccount = function(reason = 'checkout_expired') {
  this.isActive = false;
  this.autoDeactivatedAt = new Date();
  this.deactivationReason = reason;
  return this.save();
};

userSchema.methods.isCheckoutExpired = function() {
  if (!this.checkoutTime || this.role !== 'guest') {
    return false;
  }
  return new Date() >= this.checkoutTime;
};

userSchema.statics.findExpiredCheckouts = function() {
  const now = new Date();
  return this.find({
    role: 'guest',
    isActive: true,
    checkoutTime: { $lte: now }
  });
};

userSchema.statics.deactivateExpiredCheckouts = async function() {
  const expiredUsers = await this.findExpiredCheckouts();
  const results = [];

  for (const user of expiredUsers) {
    try {
      await user.deactivateAccount('checkout_expired');
      results.push({
        userId: user._id,
        email: user.email,
        status: 'deactivated',
        checkoutTime: user.checkoutTime
      });
    } catch (error) {
      results.push({
        userId: user._id,
        email: user.email,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
