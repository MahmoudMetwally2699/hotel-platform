/**
 * Hotel Model
 *
 * MongoDB schema for hotel entities in the platform
 * Includes business information, location, amenities, and markup settings
 */

const mongoose = require('mongoose');
const validator = require('validator');

const hotelSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true,
    maxlength: [100, 'Hotel name cannot exceed 100 characters'],
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
    required: [true, 'Hotel description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Contact Information
  email: {
    type: String,
    required: [true, 'Hotel email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Hotel phone is required'],
    validate: {
      validator: function(v) {
        // More flexible phone validation - allows +, -, spaces, parentheses
        return /^[\+]?[\d\s\-\(\)\.]{7,20}$/.test(v);
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

  // Hotel Classification
  category: {
    type: String,
    required: [true, 'Hotel category is required'],
    enum: {
      values: ['budget', 'mid-range', 'luxury', 'boutique', 'resort'],
      message: 'Category must be one of: budget, mid-range, luxury, boutique, resort'
    }
  },

  starRating: {
    type: Number,
    min: [1, 'Star rating must be at least 1'],
    max: [5, 'Star rating cannot exceed 5'],
    required: [true, 'Star rating is required']
  },

  // Capacity Information
  totalRooms: {
    type: Number,
    required: [true, 'Total rooms count is required'],
    min: [1, 'Hotel must have at least 1 room']
  },

  totalFloors: {
    type: Number,
    required: [true, 'Total floors count is required'],
    min: [1, 'Hotel must have at least 1 floor']
  },

  // Room Types
  roomTypes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    amenities: [String],
    maxOccupancy: {
      type: Number,
      required: true,
      min: 1
    }
  }],

  // Amenities and Services
  amenities: {
    general: [{
      type: String,
      enum: [
        'wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar',
        'conference-rooms', 'business-center', 'concierge', 'room-service',
        'laundry', 'pet-friendly', 'wheelchair-accessible', 'elevator',
        'air-conditioning', 'heating', 'safe', 'minibar'
      ]
    }],

    dining: [{
      name: String,
      type: {
        type: String,
        enum: ['restaurant', 'bar', 'cafe', 'room-service']
      },
      cuisine: String,
      openingHours: String
    }],

    recreation: [{
      name: String,
      type: {
        type: String,
        enum: ['pool', 'gym', 'spa', 'sports', 'entertainment']
      },
      description: String,
      openingHours: String
    }]
  },

  // Business Information
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

  // Platform Settings
  markupSettings: {
    global: {
      percentage: {
        type: Number,
        default: 20,
        min: [0, 'Markup percentage cannot be negative'],
        max: [100, 'Markup percentage cannot exceed 100%']
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },

    categories: [{
      category: {
        type: String,
        enum: ['laundry', 'transportation', 'tours'],
        required: true
      },
      percentage: {
        type: Number,
        required: true,
        min: [0, 'Markup percentage cannot be negative'],
        max: [100, 'Markup percentage cannot exceed 100%']
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],

    seasonal: [{
      name: String,
      startDate: Date,
      endDate: Date,
      multiplier: {
        type: Number,
        min: [0.5, 'Seasonal multiplier cannot be less than 0.5'],
        max: [3, 'Seasonal multiplier cannot exceed 3']
      }
    }]  },

  // Category-specific service providers (one provider per category)
  categoryServiceProviders: {
    laundry: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    transportation: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    tours: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    spa: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    dining: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    entertainment: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    shopping: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    },
    fitness: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null
    }
  },

  // Payment Settings
  paymentSettings: {
    acceptedMethods: [{
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'stripe', 'cash']
    }],

    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SAR', 'EGP']
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [50, 'Tax rate cannot exceed 50%']
    },

    enableOnlinePayment: {
      type: Boolean,
      default: false,
      index: true
    }
  },

  // Media
  images: {
    logo: String,
    coverImage: String,
    gallery: [String]
  },

  // Status and Settings
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  isPublished: {
    type: Boolean,
    default: false
  },

  // Statistics
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },

  // Operating Hours
  operatingHours: {
    checkIn: {
      type: String,
      default: '15:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Check-in time must be in HH:MM format'
      }
    },
    checkOut: {
      type: String,
      default: '11:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Check-out time must be in HH:MM format'
      }
    },
    frontDesk: {
      open: {
        type: String,
        default: '00:00'
      },
      close: {
        type: String,
        default: '23:59'
      }
    }
  },

  // Policies
  policies: {
    cancellation: {
      type: String,
      maxlength: [500, 'Cancellation policy cannot exceed 500 characters']
    },
    children: {
      type: String,
      maxlength: [500, 'Children policy cannot exceed 500 characters']
    },
    pets: {
      type: String,
      maxlength: [500, 'Pet policy cannot exceed 500 characters']
    },
    smoking: {
      type: String,
      maxlength: [500, 'Smoking policy cannot exceed 500 characters']
    }
  },
  // Admin Information
  adminId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
    // Note: adminId is not required to allow creation without admin initially
  },

  // Inside Hotel Services (services provided directly by the hotel)
  insideServices: [{
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
      enum: ['dining', 'assistance', 'maintenance', 'recreation', 'business'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    operatingHours: {
      start: String,
      end: String
    },
    features: [String],
    basePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  }],

  // Hotel Group (for shared loyalty points)
  hotelGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelGroup',
    default: null,
    index: true
  },

  // Metadata
  metadata: {
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['admin', 'api', 'import'],
      default: 'admin'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
hotelSchema.index({ name: 'text', description: 'text' });
hotelSchema.index({ category: 1, starRating: 1 });
hotelSchema.index({ 'address.city': 1, 'address.country': 1 });
hotelSchema.index({ isActive: 1, isPublished: 1 });
hotelSchema.index({ adminId: 1 });

// Virtual fields
hotelSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

hotelSchema.virtual('serviceProviders', {
  ref: 'ServiceProvider',
  localField: '_id',
  foreignField: 'hotelId'
});

hotelSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'hotelId'
});

// Pre-save middleware
hotelSchema.pre('save', function(next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }

  next();
});

// Instance methods
hotelSchema.methods.calculateMarkup = function(basePrice, category = null) {
  let markupPercentage = this.markupSettings.global.percentage;

  // Check for category-specific markup
  if (category) {
    const categoryMarkup = this.markupSettings.categories.find(
      cat => cat.category === category && cat.isActive
    );
    if (categoryMarkup) {
      markupPercentage = categoryMarkup.percentage;
    }
  }

  // Apply seasonal multiplier if applicable
  const now = new Date();
  const seasonalSetting = this.markupSettings.seasonal.find(
    season => now >= season.startDate && now <= season.endDate
  );

  if (seasonalSetting) {
    markupPercentage *= seasonalSetting.multiplier;
  }

  const markupAmount = (basePrice * markupPercentage) / 100;
  const finalPrice = basePrice + markupAmount;

  return {
    basePrice,
    markupPercentage,
    markupAmount,
    finalPrice
  };
};

hotelSchema.methods.updateStats = async function(bookingData) {
  this.stats.totalBookings += 1;
  this.stats.totalRevenue += bookingData.totalAmount;

  // Recalculate average rating if rating is provided
  if (bookingData.rating) {
    const totalRatingPoints = this.stats.averageRating * this.stats.totalReviews;
    this.stats.totalReviews += 1;
    this.stats.averageRating = (totalRatingPoints + bookingData.rating) / this.stats.totalReviews;
  }

  return this.save();
};

hotelSchema.methods.isOperational = function() {
  return this.isActive && this.isVerified && this.isPublished;
};

hotelSchema.methods.getAvailableServices = function() {
  return this.model('ServiceProvider').find({
    hotelId: this._id,
    isActive: true
  }).populate('services');
};

// Static methods
hotelSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
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
    isPublished: true
  });
};

hotelSchema.statics.findByCategory = function(category) {
  return this.find({
    category,
    isActive: true,
    isPublished: true
  });
};

hotelSchema.statics.searchHotels = function(query) {
  return this.find({
    $text: { $search: query },
    isActive: true,
    isPublished: true
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' }
  });
};

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
