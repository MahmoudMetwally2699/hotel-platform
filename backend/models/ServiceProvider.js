/**
 * Service Provider Model
 *
 * MongoDB schema for service providers in the hotel platform
 * Handles business information, services offered, and performance metrics
 */

const mongoose = require('mongoose');
const validator = require('validator');

const serviceProviderSchema = new mongoose.Schema({
  // Basic Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters'],
    index: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    required: [true, 'Business description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  // Service Categories (Multi-category support)
  categories: [{
    type: String,
    enum: {
      values: ['laundry', 'transportation', 'tours', 'spa', 'dining', 'entertainment', 'shopping', 'fitness', 'housekeeping'],
      message: 'Category must be one of: laundry, transportation, tours, spa, dining, entertainment, shopping, fitness, housekeeping'
    }
  }],

  // Available service templates for each category
  serviceTemplates: {
    laundry: {
      isActive: { type: Boolean, default: false },
      services: [{
        name: String,
        options: [{
          type: String,
          priceModifier: Number
        }]
      }]
    },
    transportation: {
      isActive: { type: Boolean, default: false },
      services: [{
        vehicleType: String,
        capacity: Number,
        features: [String],
        pricePerKm: Number,
        minimumFare: Number
      }]
    },
    tours: {
      isActive: { type: Boolean, default: false },
      services: [{
        tourType: String,
        duration: String,
        groupSize: Number,
        inclusions: [String],
        pricePerPerson: Number
      }]
    },
    spa: {
      isActive: { type: Boolean, default: false },
      services: [{
        treatmentType: String,
        duration: Number,
        price: Number
      }]
    },
    dining: {
      isActive: { type: Boolean, default: false },
      services: [{
        cuisineType: String,
        mealType: String,
        priceRange: String
      }]
    },
    entertainment: {
      isActive: { type: Boolean, default: false },
      services: [{
        eventType: String,
        capacity: Number,
        pricePerPerson: Number
      }]
    },
    shopping: {
      isActive: { type: Boolean, default: false },
      services: [{
        storeType: String,
        deliveryAvailable: Boolean,
        minimumOrder: Number
      }]
    },
    fitness: {
      isActive: { type: Boolean, default: false },
      services: [{
        activityType: String,
        duration: Number,
        equipmentIncluded: Boolean,
        pricePerSession: Number
      }]
    }
  },

  // Contact Information
  email: {
    type: String,
    required: [true, 'Business email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },

  phone: {
    type: String,
    required: [true, 'Business phone is required'],
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },

  website: {
    type: String,
    validate: [validator.isURL, 'Please provide a valid website URL']
  },

  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    }
  },

  // Geographic Information
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },

  // Business Registration
  businessLicense: {
    number: {
      type: String,
      required: [true, 'Business license number is required']
    },
    issuedBy: {
      type: String,
      required: [true, 'License issuing authority is required']
    },
    issuedDate: {
      type: Date,
      required: [true, 'License issue date is required']
    },
    expiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: 'License expiry date must be in the future'
      }
    }
  },

  taxId: {
    type: String,
    required: [true, 'Tax ID is required']
  },

  // Insurance Information
  insurance: {
    provider: {
      type: String,
      required: [true, 'Insurance provider is required']
    },
    policyNumber: {
      type: String,
      required: [true, 'Insurance policy number is required']
    },
    coverage: {
      type: Number,
      required: [true, 'Insurance coverage amount is required'],
      min: [0, 'Coverage amount cannot be negative']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Insurance expiry date is required'],
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: 'Insurance expiry date must be in the future'
      }
    }
  },

  // Associated Hotel
  hotelId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel association is required'],
    index: true
  },

  // Currency (inherited from hotel)
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SAR', 'EGP']
  },

  // Admin Information
  adminId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Service provider admin is required']
  },

  // Operational Settings
  operatingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '18:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '18:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '18:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '18:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '18:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '17:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: false },
      openTime: { type: String, default: '10:00' },
      closeTime: { type: String, default: '16:00' }
    }
  },

  // Service Areas
  serviceAreas: [{
    name: String,
    radius: {
      type: Number,
      min: [1, 'Service radius must be at least 1 km'],
      max: [100, 'Service radius cannot exceed 100 km']
    },
    additionalCharge: {
      type: Number,
      default: 0,
      min: [0, 'Additional charge cannot be negative']
    }
  }],

  // Capacity and Resources
  capacity: {
    maxOrdersPerDay: {
      type: Number,
      required: [true, 'Maximum orders per day is required'],
      min: [1, 'Must be able to handle at least 1 order per day']
    },
    maxOrdersPerHour: {
      type: Number,
      min: [1, 'Must be able to handle at least 1 order per hour']
    },
    currentLoad: {
      type: Number,
      default: 0,
      min: [0, 'Current load cannot be negative']
    }
  },

  // Fleet Information (for transportation services)
  fleet: [{
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'van', 'bus', 'luxury', 'motorcycle']
    },
    count: {
      type: Number,
      min: [1, 'Vehicle count must be at least 1']
    },
    features: [String],
    licensePlates: [String]
  }],

  // Equipment Information (for laundry services)
  equipment: [{
    type: {
      type: String,
      enum: ['washing-machine', 'dryer', 'iron', 'pressing-machine', 'dry-cleaning-machine']
    },
    count: {
      type: Number,
      min: [1, 'Equipment count must be at least 1']
    },
    capacity: String,
    features: [String]
  }],

  // Staff Information
  staff: {
    totalEmployees: {
      type: Number,
      required: [true, 'Total employees count is required'],
      min: [1, 'Must have at least 1 employee']
    },
    managers: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least 1 manager']
    },
    operators: {
      type: Number,
      min: [0, 'Operators count cannot be negative']
    },
    drivers: {
      type: Number,
      min: [0, 'Drivers count cannot be negative']
    }
  },

  // Performance Metrics
  performance: {
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative']
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: [0, 'Completed orders cannot be negative']
    },
    cancelledOrders: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled orders cannot be negative']
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: [0, 'Response time cannot be negative']
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 0,
      min: [0, 'Delivery rate cannot be negative'],
      max: [100, 'Delivery rate cannot exceed 100%']
    }
  },

  // Financial Information
  financials: {
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, 'Total earnings cannot be negative']
    },
    currentMonthEarnings: {
      type: Number,
      default: 0,
      min: [0, 'Current month earnings cannot be negative']
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Average order value cannot be negative']
    },
    commissionRate: {
      type: Number,
      default: 5,
      min: [0, 'Commission rate cannot be negative'],
      max: [50, 'Commission rate cannot exceed 50%']
    }
  },

  // Payment Settings
  paymentSettings: {
    acceptedMethods: [{
      type: String,
      enum: ['cash', 'credit-card', 'debit-card', 'digital-wallet', 'bank-transfer']
    }],
    paymentTerms: {
      type: String,
      enum: ['immediate', 'weekly', 'monthly'],
      default: 'weekly'
    },
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountHolderName: String
    }
  },

  // Media
  media: {
    logo: String,
    coverImage: String,
    gallery: [String],
    documents: [{
      type: {
        type: String,
        enum: ['license', 'insurance', 'certification', 'contract']
      },
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Status and Verification
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  verificationStatus: {
    type: String,
    enum: ['pending', 'in-review', 'approved', 'rejected'],
    default: 'pending'
  },

  verificationNotes: String,

  // Special Features
  features: [{
    type: String,
    enum: [
      'express-service', 'pickup-delivery', '24-7-available', 'eco-friendly',
      'luxury-service', 'bulk-discount', 'loyalty-program', 'insurance-included'
    ]
  }],

  // Policies
  policies: {
    cancellation: {
      type: String,
      maxlength: [500, 'Cancellation policy cannot exceed 500 characters']
    },
    refund: {
      type: String,
      maxlength: [500, 'Refund policy cannot exceed 500 characters']
    },
    terms: {
      type: String,
      maxlength: [1000, 'Terms and conditions cannot exceed 1000 characters']
    }
  },

  // Provider Type Classification
  providerType: {
    type: String,
    enum: {
      values: ['internal', 'external'],
      message: 'Provider type must be either internal or external'
    },
    default: 'internal',
    required: [true, 'Provider type is required']
  },

  // Hotel Markup Settings
  markup: {
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Markup percentage cannot be negative'],
      max: [100, 'Markup percentage cannot exceed 100%']
    },
    setBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    setAt: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: [200, 'Markup notes cannot exceed 200 characters']
    },
    reason: {
      type: String,
      maxlength: [300, 'Markup reason cannot exceed 300 characters']
    }
  },

  // Metadata
  metadata: {
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    source: {
      type: String,
      enum: ['hotel-admin', 'super-admin', 'api'],
      default: 'hotel-admin'
    },
    notes: String
  },

  // Inside Hotel Services - Services provided within hotel premises
  insideServices: [{
    id: {
      type: String,
      required: true
    },
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['dining', 'assistance', 'maintenance']
    },
    operatingHours: {
      start: String,
      end: String
    },
    features: [String],
    basePrice: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Housekeeping Services - Specific to room and guest services
  housekeepingServices: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['cleaning', 'maintenance', 'amenities', 'laundry'],
      required: true
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 30
    },
    availability: {
      type: String,
      enum: ['always', 'business-hours'],
      default: 'always'
    },
    requirements: [{
      type: String
    }],
    instructions: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
serviceProviderSchema.index({ businessName: 'text', description: 'text' });
serviceProviderSchema.index({ categories: 1 });
serviceProviderSchema.index({ hotelId: 1, isActive: 1 });
serviceProviderSchema.index({ 'performance.averageRating': -1 });
serviceProviderSchema.index({ adminId: 1 });
serviceProviderSchema.index({ categories: 1, hotelId: 1, isActive: 1 });

// Virtual fields
serviceProviderSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

serviceProviderSchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'providerId'
});

serviceProviderSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'serviceProviderId'
});

serviceProviderSchema.virtual('completionRate').get(function() {
  const total = this.performance.completedOrders + this.performance.cancelledOrders;
  if (total === 0) return 0;
  return (this.performance.completedOrders / total) * 100;
});

// Pre-save middleware
serviceProviderSchema.pre('save', async function(next) {
  // Generate slug from business name
  if (this.isModified('businessName')) {
    this.slug = this.businessName
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }

  // Set currency from hotel if not already set or if hotel is modified
  if (this.isNew || this.isModified('hotelId')) {
    try {
      const Hotel = mongoose.model('Hotel');
      const hotel = await Hotel.findById(this.hotelId).select('paymentSettings.currency');

      if (hotel && hotel.paymentSettings && hotel.paymentSettings.currency) {
        this.currency = hotel.paymentSettings.currency;
      }
    } catch (error) {
      // If hotel lookup fails, continue with default currency
      console.error('Error fetching hotel currency:', error);
    }
  }

  // Enforce markup rules for internal providers
  if (this.providerType === 'internal') {
    // Internal providers must have 0% markup
    if (!this.markup) {
      this.markup = {};
    }
    this.markup.percentage = 0;

    // Set reason if not already set
    if (!this.markup.reason) {
      this.markup.reason = 'Internal provider - No markup applied (all revenue goes to hotel)';
    }

    // Set setAt timestamp if not already set
    if (!this.markup.setAt) {
      this.markup.setAt = new Date();
    }
  }

  next();
});

// Instance methods
serviceProviderSchema.methods.isOperational = function() {
  return this.isActive && this.isVerified && this.verificationStatus === 'approved';
};

serviceProviderSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const daySchedule = this.operatingHours[dayName];
  if (!daySchedule || !daySchedule.isOpen) return false;

  return currentTime >= daySchedule.openTime && currentTime <= daySchedule.closeTime;
};

serviceProviderSchema.methods.canAcceptOrder = function() {
  return (
    this.isOperational() &&
    this.capacity.currentLoad < this.capacity.maxOrdersPerDay
  );
};

serviceProviderSchema.methods.updatePerformance = function(orderData) {
  // Update completion stats
  if (orderData.status === 'completed') {
    this.performance.completedOrders += 1;
  } else if (orderData.status === 'cancelled') {
    this.performance.cancelledOrders += 1;
  }

  // Update ratings
  if (orderData.rating) {
    const totalRatingPoints = this.performance.averageRating * this.performance.totalReviews;
    this.performance.totalReviews += 1;
    this.performance.averageRating = (totalRatingPoints + orderData.rating) / this.performance.totalReviews;
  }

  // Update financial data
  if (orderData.earnings) {
    this.financials.totalEarnings += orderData.earnings;
    this.financials.currentMonthEarnings += orderData.earnings;

    // Recalculate average order value
    const totalOrders = this.performance.completedOrders;
    if (totalOrders > 0) {
      this.financials.averageOrderValue = this.financials.totalEarnings / totalOrders;
    }
  }

  return this.save();
};

serviceProviderSchema.methods.getAvailableServices = function() {
  return this.model('Service').find({
    providerId: this._id,
    isActive: true
  });
};

serviceProviderSchema.methods.calculateServiceRadius = function(destination) {
  if (!this.location.coordinates || !destination) return 0;

  // Simple distance calculation (you might want to use a proper geolocation library)
  const [lng1, lat1] = this.location.coordinates;
  const [lng2, lat2] = destination;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

// Static methods
serviceProviderSchema.statics.findByHotel = function(hotelId) {
  return this.find({
    hotelId,
    isActive: true,
    isVerified: true
  });
};

serviceProviderSchema.statics.findByCategory = function(category, hotelId = null) {
  const query = {
    category,
    isActive: true,
    isVerified: true
  };

  if (hotelId) {
    query.hotelId = hotelId;
  }

  return this.find(query);
};

serviceProviderSchema.statics.findNearby = function(coordinates, maxDistance = 10000, category = null) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    isVerified: true
  };

  if (category) {
    query.category = category;
  }

  return this.find(query);
};

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);

module.exports = ServiceProvider;
