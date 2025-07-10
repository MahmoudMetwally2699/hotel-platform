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
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        // More flexible phone validation - allows +, -, spaces, parentheses
        return /^[\+]?[\d\s\-\(\)\.]{7,20}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
    validate: {
      validator: function(password) {
        // Password must contain at least one uppercase, one lowercase, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
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
  },

  checkInDate: {
    type: Date,
    required: function() {
      return this.role === 'guest';
    }
  },

  checkOutDate: {
    type: Date,
    required: function() {
      return this.role === 'guest';
    },
    validate: {
      validator: function(checkOut) {
        return !this.checkInDate || checkOut > this.checkInDate;
      },
      message: 'Check-out date must be after check-in date'
    }
  },

  roomNumber: {
    type: String,
    required: function() {
      return this.role === 'guest';
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    select: false
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isPhoneVerified: {
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

  emailVerificationToken: {
    type: String,
    select: false
  },

  emailVerificationExpires: {
    type: Date,
    select: false
  },

  // Login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date
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

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
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
    if (!this.selectedHotelId || !this.checkInDate || !this.checkOutDate || !this.roomNumber) {
      return next(new Error('Guest users must have hotel selection, check-in/out dates, and room number'));
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

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = function() {
  // Skip incrementing login attempts for superadmin users
  if (this.role === 'superadmin') {
    return Promise.resolve();
  }

  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();

  // Remove sensitive fields
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;

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

const User = mongoose.model('User', userSchema);

module.exports = User;
