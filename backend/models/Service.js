/**
 * Service Model
 *
 * MongoDB schema for individual services offered by service providers
 * Includes pricing, availability, and service-specific configurations
 */

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters'],
    index: true
  },

  slug: {
    type: String,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },

  // Service Provider Reference
  providerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ServiceProvider',
    required: [true, 'Service provider is required'],
    index: true
  },

  // Hotel Reference (for easier querying)
  hotelId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel reference is required'],
    index: true
  },
  // Category Information
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: {
      values: ['laundry', 'transportation', 'tours', 'spa', 'dining', 'entertainment', 'shopping', 'fitness'],
      message: 'Category must be one of: laundry, transportation, tours, spa, dining, entertainment, shopping, fitness'
    },
    index: true
  },

  subcategory: {
    type: String,
    required: [true, 'Service subcategory is required']
  },

  // Service Type and Variations
  serviceType: {
    type: String,
    required: [true, 'Service type is required']
  },  // Service Combinations (for complex services like laundry)
  serviceCombinations: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    serviceTypes: [{
      type: String,
      required: true // e.g., 'washing', 'ironing', 'express'
    }],
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    duration: String, // e.g., '24 hours', '4 hours', '12 hours'
    icon: {
      type: String,
      default: '🧼' // Emoji icon for display
    },
    isPopular: {
      type: Boolean,
      default: false    },
    features: [String]
  }],

  // Individual laundry items (for item-based laundry services)
  laundryItems: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['clothing', 'outerwear', 'undergarments', 'linens', 'home'],
      required: true
    },
    icon: {
      type: String,
      default: '👕'
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Item price cannot be negative']
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    serviceTypes: [{
      serviceTypeId: {
        type: String,
        required: true // e.g., 'wash_only', 'iron_only', 'wash_iron', 'dry_cleaning'
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Service type price cannot be negative']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    // Additional notes or specifications for the item
    notes: String,
    // Date when this item was added
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  // Pricing Information
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },

    // Express surcharge for rush services
    expressSurcharge: {
      type: Number,
      default: 0,
      min: [0, 'Express surcharge cannot be negative']
    },

    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },

    pricingType: {
      type: String,
      required: [true, 'Pricing type is required'],
      enum: {
        values: ['fixed', 'per-item', 'per-hour', 'per-day', 'per-km', 'per-person'],
        message: 'Pricing type must be one of: fixed, per-item, per-hour, per-day, per-km, per-person'
      }
    },

    minimumCharge: {
      type: Number,
      default: 0,
      min: [0, 'Minimum charge cannot be negative']
    },

    maximumCharge: {
      type: Number,
      min: [0, 'Maximum charge cannot be negative']
    },

    // Tiered pricing for bulk orders
    tiers: [{
      minQuantity: {
        type: Number,
        required: true,
        min: [1, 'Minimum quantity must be at least 1']
      },
      maxQuantity: {
        type: Number,
        min: [1, 'Maximum quantity must be at least 1']
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
      }
    }],

    // Additional charges
    additionalCharges: [{
      name: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Additional charge cannot be negative']
      },
      type: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed'
      },
      isOptional: {
        type: Boolean,
        default: false
      }
    }]
  },

  // Service Options and Variations
  options: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    priceModifier: {
      type: Number,
      default: 0
    },
    modifierType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    choices: [{
      name: String,
      priceModifier: Number,
      description: String
    }]
  }],

  // Availability Settings
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },

    schedule: {
      monday: {
        isAvailable: { type: Boolean, default: true },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 10 }
        }]
      },
      tuesday: {
        isAvailable: { type: Boolean, default: true },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 10 }
        }]
      },
      wednesday: {
        isAvailable: { type: Boolean, default: true },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 10 }
        }]
      },
      thursday: {
        isAvailable: { type: Boolean, default: true },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 10 }
        }]
      },
      friday: {
        isAvailable: { type: Boolean, default: true },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 10 }
        }]
      },
      saturday: {
        isAvailable: { type: Boolean, default: true },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 10 }
        }]
      },
      sunday: {
        isAvailable: { type: Boolean, default: false },
        timeSlots: [{
          startTime: String,
          endTime: String,
          maxBookings: { type: Number, default: 5 }
        }]
      }
    },

    // Advance booking requirements
    advanceBooking: {
      minimum: {
        type: Number,
        default: 1, // hours
        min: [0, 'Minimum advance booking cannot be negative']
      },
      maximum: {
        type: Number,
        default: 720, // 30 days in hours
        min: [1, 'Maximum advance booking must be at least 1 hour']
      }
    },

    // Seasonal availability
    seasonalRules: [{
      name: String,
      startDate: Date,
      endDate: Date,
      isAvailable: Boolean,
      priceModifier: {
        type: Number,
        default: 0
      },
      modifierType: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'percentage'
      }
    }]
  },

  // Service Specifications
  specifications: {
    duration: {
      estimated: {
        type: Number,
        required: [true, 'Estimated duration is required'],
        min: [1, 'Duration must be at least 1 minute']
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'hours'
      }
    },

    capacity: {
      maxItems: Number,
      maxWeight: Number,
      maxPeople: Number,
      maxDistance: Number
    },

    requirements: [{
      type: String,
      description: String,
      isRequired: Boolean
    }],

    inclusions: [String],
    exclusions: [String]
  },

  // Delivery/Pickup Options
  delivery: {
    isPickupAvailable: {
      type: Boolean,
      default: true
    },

    isDeliveryAvailable: {
      type: Boolean,
      default: true
    },

    pickupCharge: {
      type: Number,
      default: 0,
      min: [0, 'Pickup charge cannot be negative']
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative']
    },

    freeDeliveryThreshold: {
      type: Number,
      default: 0,
      min: [0, 'Free delivery threshold cannot be negative']
    },

    deliveryRadius: {
      type: Number,
      default: 10, // kilometers
      min: [1, 'Delivery radius must be at least 1 km']
    },

    estimatedPickupTime: {
      type: Number,
      default: 30, // minutes
      min: [5, 'Pickup time must be at least 5 minutes']
    },

    estimatedDeliveryTime: {
      type: Number,
      default: 60, // minutes
      min: [10, 'Delivery time must be at least 10 minutes']
    }
  },

  // Media and Assets
  media: {
    images: [String],
    videos: [String],
    documents: [{
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['brochure', 'manual', 'certificate', 'terms']
      }
    }]
  },

  // Quality and Reviews
  quality: {
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

    qualityScore: {
      type: Number,
      default: 0,
      min: [0, 'Quality score cannot be negative'],
      max: [100, 'Quality score cannot exceed 100']
    }
  },

  // Performance Metrics
  performance: {
    totalBookings: {
      type: Number,
      default: 0,
      min: [0, 'Total bookings cannot be negative']
    },

    completedBookings: {
      type: Number,
      default: 0,
      min: [0, 'Completed bookings cannot be negative']
    },

    cancelledBookings: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled bookings cannot be negative']
    },

    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative']
    },

    averageOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Average order value cannot be negative']
    }
  },

  // SEO and Marketing
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    tags: [String]
  },

  // Status and Moderation
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isApproved: {
    type: Boolean,
    default: false
  },

  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },

  moderationNotes: String,

  // Special Features
  features: [{
    type: String,
    enum: [
      'instant-booking', 'express-service', 'eco-friendly', 'premium',
      'bulk-discount', 'loyalty-points', 'insurance-included', 'cancellation-free'
    ]
  }],

  // Terms and Policies
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
      enum: ['provider', 'admin', 'api'],
      default: 'provider'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
serviceSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ providerId: 1, isActive: 1 });
serviceSchema.index({ hotelId: 1, isActive: 1, isApproved: 1 });
serviceSchema.index({ 'pricing.basePrice': 1 });
serviceSchema.index({ 'quality.averageRating': -1 });

// Virtual fields
serviceSchema.virtual('provider', {
  ref: 'ServiceProvider',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true
});

serviceSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

serviceSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'serviceId'
});

serviceSchema.virtual('completionRate').get(function() {
  const total = this.performance.completedBookings + this.performance.cancelledBookings;
  if (total === 0) return 0;
  return (this.performance.completedBookings / total) * 100;
});

serviceSchema.virtual('isOperational').get(function() {
  return this.isActive && this.isApproved && this.moderationStatus === 'approved' && this.availability.isAvailable;
});

// Pre-save middleware
serviceSchema.pre('save', function(next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }

  // Auto-populate hotel from provider
  if (this.isModified('providerId') && !this.hotelId) {
    this.populate('providerId', 'hotelId')
      .then(service => {
        this.hotelId = service.providerId.hotelId;
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Instance methods
serviceSchema.methods.calculatePrice = function(quantity = 1, options = [], additionalCharges = []) {
  let basePrice = this.pricing.basePrice;

  // Apply tiered pricing
  if (this.pricing.tiers.length > 0) {
    const tier = this.pricing.tiers.find(t =>
      quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity)
    );
    if (tier) {
      basePrice = tier.price;
    }
  }

  let totalPrice = basePrice * quantity;

  // Apply options
  options.forEach(option => {
    const serviceOption = this.options.find(opt => opt.name === option.name);
    if (serviceOption) {
      if (serviceOption.modifierType === 'percentage') {
        totalPrice += (totalPrice * serviceOption.priceModifier) / 100;
      } else {
        totalPrice += serviceOption.priceModifier;
      }
    }
  });

  // Apply additional charges
  additionalCharges.forEach(charge => {
    const serviceCharge = this.pricing.additionalCharges.find(ch => ch.name === charge.name);
    if (serviceCharge) {
      if (serviceCharge.type === 'percentage') {
        totalPrice += (totalPrice * serviceCharge.amount) / 100;
      } else {
        totalPrice += serviceCharge.amount;
      }
    }
  });

  // Apply minimum charge
  if (totalPrice < this.pricing.minimumCharge) {
    totalPrice = this.pricing.minimumCharge;
  }

  // Apply maximum charge
  if (this.pricing.maximumCharge && totalPrice > this.pricing.maximumCharge) {
    totalPrice = this.pricing.maximumCharge;
  }

  return {
    basePrice,
    quantity,
    subtotal: basePrice * quantity,
    totalPrice,
    breakdown: {
      base: basePrice * quantity,
      options: totalPrice - (basePrice * quantity),
      additionalCharges: 0 // Calculate if needed
    }
  };
};

serviceSchema.methods.isAvailableAt = function(date, timeSlot = null) {
  if (!this.availability.isAvailable) return false;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const daySchedule = this.availability.schedule[dayName];

  if (!daySchedule || !daySchedule.isAvailable) return false;

  if (timeSlot && daySchedule.timeSlots.length > 0) {
    return daySchedule.timeSlots.some(slot =>
      timeSlot >= slot.startTime && timeSlot <= slot.endTime
    );
  }

  return true;
};

serviceSchema.methods.updatePerformance = function(bookingData) {
  this.performance.totalBookings += 1;

  if (bookingData.status === 'completed') {
    this.performance.completedBookings += 1;
    this.performance.totalRevenue += bookingData.amount;

    // Recalculate average order value
    if (this.performance.completedBookings > 0) {
      this.performance.averageOrderValue = this.performance.totalRevenue / this.performance.completedBookings;
    }
  } else if (bookingData.status === 'cancelled') {
    this.performance.cancelledBookings += 1;
  }

  // Update ratings
  if (bookingData.rating) {
    const totalRatingPoints = this.quality.averageRating * this.quality.totalReviews;
    this.quality.totalReviews += 1;
    this.quality.averageRating = (totalRatingPoints + bookingData.rating) / this.quality.totalReviews;
  }

  return this.save();
};

serviceSchema.methods.canBeBookedBy = function(guestLocation) {
  if (!this.isOperational) return false;

  // Check delivery radius if location is provided
  if (guestLocation && this.delivery.deliveryRadius) {
    // This would need a proper distance calculation
    // For now, assuming it's within range
    return true;
  }

  return true;
};

// Static methods
serviceSchema.statics.findByCategory = function(category, hotelId = null) {
  const query = {
    category,
    isActive: true,
    isApproved: true,
    moderationStatus: 'approved'
  };

  if (hotelId) {
    query.hotelId = hotelId;
  }

  return this.find(query);
};

serviceSchema.statics.findByProvider = function(providerId) {
  return this.find({
    providerId,
    isActive: true
  });
};

serviceSchema.statics.findByHotel = function(hotelId) {
  return this.find({
    hotelId,
    isActive: true,
    isApproved: true,
    moderationStatus: 'approved'
  });
};

serviceSchema.statics.searchServices = function(query, filters = {}) {
  const searchQuery = {
    $text: { $search: query },
    isActive: true,
    isApproved: true,
    moderationStatus: 'approved',
    ...filters
  };

  return this.find(searchQuery, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' }
  });
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
