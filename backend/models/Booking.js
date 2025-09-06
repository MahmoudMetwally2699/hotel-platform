/**
 * Booking Model
 *
 * MongoDB schema for service bookings in the hotel platform
 * Handles booking lifecycle, pricing calculations, and payment tracking
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({  // Booking Identification
  bookingNumber: {
    type: String,
    unique: true
  },

  // References
  guestId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Guest is required'],
    index: true
  },

  hotelId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel is required'],
    index: true
  },

  serviceProviderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ServiceProvider',
    required: [true, 'Service provider is required'],
    index: true
  },

  serviceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required'],
    index: true
  },

  // Service Type (for different types of bookings)
  serviceType: {
    type: String,
    enum: ['regular', 'housekeeping', 'transportation', 'laundry', 'tours', 'restaurant', 'dining'],
    default: 'regular'
  },

  // Guest Information
  guestDetails: {
    firstName: {
      type: String,
      required: [true, 'Guest first name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Guest last name is required']
    },
    email: {
      type: String,
      required: [true, 'Guest email is required']
    },
    phone: {
      type: String,
      required: [true, 'Guest phone is required']
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required']
    }
  },

  // Service Details
  serviceDetails: {
    name: {
      type: String,
      required: [true, 'Service name is required']
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      enum: ['laundry', 'transportation', 'tours', 'restaurant', 'dining', 'cleaning', 'amenities', 'maintenance']
    },
    subcategory: String,
    description: String
  },
  // Booking Configuration
  bookingConfig: {
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },    // Multi-item laundry support with service type pricing
    laundryItems: [{
      itemName: {
        type: String,
        required: true
      },
      itemId: {
        type: String,
        required: true
      },
      itemCategory: {
        type: String,
        required: true
      },
      itemIcon: {
        type: String,
        default: '👕'
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Item quantity must be at least 1']
      },
      serviceType: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: String,
        duration: {
          value: Number,
          unit: String
        },
        icon: String
      },
      basePrice: {
        type: Number,
        required: true,
        min: [0, 'Item base price cannot be negative']
      },
      finalPrice: {
        type: Number,
        required: true,
        min: [0, 'Item final price cannot be negative']
      }
    }],

    // Menu items for restaurant bookings
    menuItems: [{
      itemName: {
        type: String,
        required: true
      },
      itemCategory: {
        type: String,
        required: true
      },
      description: String,
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Item quantity must be at least 1']
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Item price cannot be negative']
      },
      totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Item total price cannot be negative']
      },
      isVegetarian: {
        type: Boolean,
        default: false
      },
      isVegan: {
        type: Boolean,
        default: false
      },
      spicyLevel: {
        type: String,
        enum: ['mild', 'medium', 'hot', 'very_hot'],
        default: 'mild'
      },
      allergens: [String],
      preparationTime: {
        type: Number, // in minutes
        default: 15
      },
      specialInstructions: String
    }],

    // Express service selection
    isExpressService: {
      type: Boolean,
      default: false
    },

    selectedOptions: [{
      name: {
        type: String,
        required: true
      },
      value: String,
      priceModifier: {
        type: Number,
        default: 0
      }
    }],

    // Service Combination (for package services like laundry)
    serviceCombination: {
      id: String,
      name: String,
      description: String,
      serviceTypes: [String],
      finalPrice: Number,
      priceMultiplier: Number,
      duration: String,
      isPopular: Boolean
    },

    additionalServices: [{
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Additional service price cannot be negative']
      }
    }],

    specialRequests: String,
    notes: String
  },

  // Scheduling
  schedule: {
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required']
    },

    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Preferred time must be in HH:MM format'
      }
    },

    confirmedDate: Date,
    confirmedTime: String,

    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'hours'
      }
    },

    estimatedCompletion: Date
  },

  // Location Information
  location: {
    // Pickup location
    pickup: {
      address: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      instructions: String,
      contactPerson: String,
      contactPhone: String
    },

    // Delivery location
    delivery: {
      address: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      instructions: String,
      contactPerson: String,
      contactPhone: String
    },

    // Service location (for tours, etc.)
    service: {
      address: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      meetingPoint: String,
      instructions: String
    }
  },

  // Pricing Breakdown
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },

    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },

    optionsTotal: {
      type: Number,
      default: 0,
      min: [0, 'Options total cannot be negative']
    },

    additionalServicesTotal: {
      type: Number,
      default: 0,
      min: [0, 'Additional services total cannot be negative']
    },    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative']
    },

    // Express surcharge for rush services
    expressSurcharge: {
      type: Number,
      default: 0,
      min: [0, 'Express surcharge cannot be negative']
    },

    // Hotel markup calculation
    markup: {
      percentage: {
        type: Number,
        required: [true, 'Markup percentage is required'],
        min: [0, 'Markup percentage cannot be negative']
      },
      amount: {
        type: Number,
        required: [true, 'Markup amount is required'],
        min: [0, 'Markup amount cannot be negative']
      }
    },

    // Tax calculation
    tax: {
      rate: {
        type: Number,
        default: 0,
        min: [0, 'Tax rate cannot be negative']
      },
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Tax amount cannot be negative']
      }
    },

    // Final pricing
    totalBeforeMarkup: {
      type: Number,
      required: [true, 'Total before markup is required'],
      min: [0, 'Total before markup cannot be negative']
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },

    currency: {
  type: String,
  default: 'EGP',
  enum: ['EGP', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },

    // Revenue distribution
    providerEarnings: {
      type: Number,
      required: [true, 'Provider earnings is required'],
      min: [0, 'Provider earnings cannot be negative']
    },

    hotelEarnings: {
      type: Number,
      required: [true, 'Hotel earnings is required'],
      min: [0, 'Hotel earnings cannot be negative']
    },

    platformFee: {
      type: Number,
      default: 0,
      min: [0, 'Platform fee cannot be negative']
    }
  },

  // Booking Status
  status: {
    type: String,
    enum: {
      values: [
        'pending', 'confirmed', 'assigned', 'in-progress',
        'pickup-scheduled', 'picked-up', 'in-service',
        'delivery-scheduled', 'completed', 'cancelled',
        'refunded', 'disputed'
      ],
      message: 'Invalid booking status'
    },
    default: 'pending',
    index: true
  },

  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String,
    automaticUpdate: {
      type: Boolean,
      default: false
    }
  }],

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'stripe', 'cash', 'wallet', 'bank-transfer'],
      required: [true, 'Payment method is required']
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially-refunded'],
      default: 'pending'
    },

    transactionId: String,
    paymentIntentId: String, // Stripe payment intent ID

    // Kashier.io specific fields
    kashier: {
      sessionId: String,
      paymentUrl: String,
      transactionId: String,
      merchantOrderId: String,
      paymentReference: String,
      webhookData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      cardInfo: {
        cardBrand: String,
        maskedCard: String,
        cardLast4: String
      },
      transactionResponseCode: String,
      transactionResponseMessage: mongoose.Schema.Types.Mixed,
      failureReason: String
    },

    // Payment amounts
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative']
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative']
    },

    currency: {
  type: String,
  default: 'EGP',
  enum: ['EGP', 'USD', 'EUR', 'GBP', 'SAR']
    },

    paymentDate: Date,

    paymentDetails: {
      cardLast4: String,
      cardBrand: String,
      receiptUrl: String
    }
  },

  // Service Assignment
  assignment: {
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },

    assignedAt: Date,

    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },

    team: [{
      member: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      role: String,
      assignedAt: {
        type: Date,
        default: Date.now
      }
    }],

    equipment: [String],
    vehicle: String
  },

  // Progress Tracking
  progress: {
    checkpoints: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
      },
      completedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      notes: String,
      images: [String]
    }],

    currentCheckpoint: String,

    overallProgress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%']
    }
  },

  // Communication
  communication: {
    messages: [{
      sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      senderRole: {
        type: String,
        enum: ['guest', 'hotel', 'service', 'admin'],
        required: true
      },
      message: {
        type: String,
        required: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isRead: {
        type: Boolean,
        default: false
      },
      attachments: [String]
    }],

    notifications: [{
      type: {
        type: String,
        enum: ['sms', 'email', 'push', 'in-app'],
        required: true
      },
      recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      subject: String,
      content: {
        type: String,
        required: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      }
    }]
  },

  // Quality and Feedback
  feedback: {
    guestRating: {
      overall: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
      },
      service: Number,
      timeliness: Number,
      communication: Number,
      value: Number
    },

    guestReview: {
      title: String,
      comment: {
        type: String,
        maxlength: [1000, 'Review comment cannot exceed 1000 characters']
      },
      pros: [String],
      cons: [String],
      wouldRecommend: Boolean,
      submittedAt: Date
    },

    providerRating: {
      guest: Number,
      difficulty: Number,
      clarity: Number
    },

    providerNotes: String,

    hotelRating: {
      service: Number,
      provider: Number,
      guest: Number
    },

    images: [String],

    isVerified: {
      type: Boolean,
      default: false
    }
  },

  // Cancellation and Refund
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    cancellationPolicy: String,
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    },
    refundProcessedAt: Date,
    refundTransactionId: String
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'phone', 'walk-in'],
      default: 'web'
    },

    userAgent: String,
    ipAddress: String,

    referralCode: String,
    promoCode: String,

    internalNotes: String,

    tags: [String],

    isTestBooking: {
      type: Boolean,
      default: false
    }
  },

  // Booking-specific details for special service types
  bookingDetails: {
    preferredTime: String, // Original preferred time (can be "ASAP", "now", or HH:MM)
    scheduledDateTime: Date,
    specialRequests: String,
    estimatedDuration: Number, // in minutes
    additionalInfo: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookingSchema.index({ guestId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ serviceProviderId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ serviceId: 1, createdAt: -1 });
bookingSchema.index({ 'schedule.preferredDate': 1, status: 1 });
bookingSchema.index({ 'payment.status': 1, 'payment.paymentDate': -1 });
bookingSchema.index({ 'payment.kashier.sessionId': 1 });
bookingSchema.index({ 'payment.kashier.transactionId': 1 });

// Virtual fields
bookingSchema.virtual('guest', {
  ref: 'User',
  localField: 'guestId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('serviceProvider', {
  ref: 'ServiceProvider',
  localField: 'serviceProviderId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('service', {
  ref: 'Service',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('fullGuestName').get(function() {
  return `${this.guestDetails.firstName} ${this.guestDetails.lastName}`;
});

bookingSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

bookingSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

bookingSchema.virtual('isActive').get(function() {
  return !['completed', 'cancelled', 'refunded'].includes(this.status);
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Generate booking number if not exists
  if (!this.bookingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingNumber = `BK${year}${month}${day}${random}`;
  }

  // Add status to history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      automaticUpdate: true
    });
  }

  next();
});

// Instance methods
bookingSchema.methods.updateStatus = function(newStatus, updatedBy = null, notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;

  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    notes,
    automaticUpdate: false
  });

  return this.save();
};

bookingSchema.methods.calculateTotalAmount = function() {
  const subtotal = this.pricing.basePrice * this.pricing.quantity;
  const optionsTotal = this.pricing.optionsTotal || 0;
  const additionalServicesTotal = this.pricing.additionalServicesTotal || 0;
  const deliveryCharge = this.pricing.deliveryCharge || 0;

  const totalBeforeMarkup = subtotal + optionsTotal + additionalServicesTotal + deliveryCharge;

  // Calculate markup
  const markupAmount = (totalBeforeMarkup * this.pricing.markup.percentage) / 100;

  // Calculate tax
  const taxableAmount = totalBeforeMarkup + markupAmount;
  const taxAmount = (taxableAmount * this.pricing.tax.rate) / 100;

  const totalAmount = taxableAmount + taxAmount;

  // Update pricing fields
  this.pricing.totalBeforeMarkup = totalBeforeMarkup;
  this.pricing.markup.amount = markupAmount;
  this.pricing.tax.amount = taxAmount;
  this.pricing.totalAmount = totalAmount;
  this.pricing.providerEarnings = totalBeforeMarkup;
  this.pricing.hotelEarnings = markupAmount;

  return totalAmount;
};

bookingSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed', 'assigned'];
  return cancellableStatuses.includes(this.status);
};

bookingSchema.methods.canBeModified = function() {
  const modifiableStatuses = ['pending', 'confirmed'];
  return modifiableStatuses.includes(this.status);
};

bookingSchema.methods.addMessage = function(sender, senderRole, message, attachments = []) {
  this.communication.messages.push({
    sender,
    senderRole,
    message,
    attachments,
    timestamp: new Date(),
    isRead: false
  });

  return this.save();
};

bookingSchema.methods.addCheckpoint = function(name, description = '', completedBy = null) {
  const checkpoint = {
    name,
    description,
    timestamp: new Date(),
    status: completedBy ? 'completed' : 'pending',
    completedBy
  };

  this.progress.checkpoints.push(checkpoint);

  if (completedBy) {
    this.progress.currentCheckpoint = name;
    // Calculate overall progress
    const completedCheckpoints = this.progress.checkpoints.filter(cp => cp.status === 'completed').length;
    this.progress.overallProgress = (completedCheckpoints / this.progress.checkpoints.length) * 100;
  }

  return this.save();
};

bookingSchema.methods.addRating = function(ratingData) {
  this.feedback.guestRating = ratingData.rating;
  this.feedback.guestReview = ratingData.review;
  this.feedback.guestReview.submittedAt = new Date();

  return this.save();
};

// Kashier.io payment methods
bookingSchema.methods.createKashierPaymentSession = function(kashierSessionId, paymentUrl) {
  this.payment.kashier.sessionId = kashierSessionId;
  this.payment.kashier.paymentUrl = paymentUrl;
  this.payment.totalAmount = this.pricing.total;
  this.payment.status = 'pending';
  this.status = 'payment_pending';

  return this.save();
};

bookingSchema.methods.processKashierPayment = function(webhookData) {
  // Store the complete webhook data
  this.payment.kashier.webhookData = webhookData;

  // Extract transaction details based on new webhook format
  this.payment.kashier.transactionId = webhookData.transactionId;
  this.payment.kashier.paymentReference = webhookData.kashierOrderId || webhookData.orderReference;

  // Map Kashier payment methods to our schema enum values
  const mapPaymentMethod = (kashierMethod) => {
    const methodMap = {
      'card': 'credit-card',
      'credit-card': 'credit-card',
      'debit-card': 'debit-card',
      'wallet': 'wallet',
      'bank-transfer': 'bank-transfer',
      'fawry': 'wallet',
      'instapay': 'wallet',
      'vodafone-cash': 'wallet',
      'orange-cash': 'wallet',
      'etisalat-cash': 'wallet'
    };
    return methodMap[kashierMethod] || 'credit-card'; // Default to credit-card
  };

  this.payment.method = mapPaymentMethod(webhookData.method);

  // Store additional payment details
  if (webhookData.card && webhookData.card.cardInfo) {
    this.payment.kashier.cardInfo = {
      cardBrand: webhookData.card.cardInfo.cardBrand,
      maskedCard: webhookData.card.cardInfo.maskedCard,
      cardLast4: webhookData.card.cardInfo.maskedCard ? webhookData.card.cardInfo.maskedCard.slice(-4) : null
    };

    // Also update legacy paymentDetails for compatibility
    this.payment.paymentDetails.cardBrand = webhookData.card.cardInfo.cardBrand;
    this.payment.paymentDetails.cardLast4 = this.payment.kashier.cardInfo.cardLast4;
  }

  this.payment.kashier.transactionResponseCode = webhookData.transactionResponseCode;
  this.payment.kashier.transactionResponseMessage = webhookData.transactionResponseMessage;

  // Process payment based on status
  if (webhookData.status === 'SUCCESS') {
    this.payment.status = 'completed';
    this.payment.paymentDate = new Date();
    this.payment.paidAmount = parseFloat(webhookData.amount);
    this.payment.currency = webhookData.currency || 'EGP';
    this.status = 'confirmed';

    // Calculate platform fee and earnings (if needed)
    if (this.pricing) {
      // Platform fee calculation - can be customized
      this.payment.platformFee = 0; // Can be calculated if needed
      this.payment.taxAmount = 0;    // Can be calculated if needed
    }
  } else if (webhookData.status === 'FAILED' || webhookData.status === 'ERROR') {
    this.payment.status = 'failed';

    // Store failure reason
    this.payment.kashier.failureReason = webhookData.transactionResponseMessage || 'Payment failed';

    // Keep booking status as payment_pending to allow retry
  } else {
    // Handle other statuses (PENDING, PROCESSING, etc.)
    this.payment.status = 'processing';
  }

  return this.save();
};

// Static methods
bookingSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

bookingSchema.statics.findByGuest = function(guestId) {
  return this.find({ guestId }).sort({ createdAt: -1 });
};

bookingSchema.statics.findByHotel = function(hotelId) {
  return this.find({ hotelId }).sort({ createdAt: -1 });
};

bookingSchema.statics.findByProvider = function(serviceProviderId) {
  return this.find({ serviceProviderId }).sort({ createdAt: -1 });
};

bookingSchema.statics.getRevenueStats = function(filter = {}) {
  return this.aggregate([
    { $match: { ...filter, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.totalAmount' },
        providerEarnings: { $sum: '$pricing.providerEarnings' },
        hotelEarnings: { $sum: '$pricing.hotelEarnings' },
        platformFees: { $sum: '$pricing.platformFee' },
        totalBookings: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.totalAmount' }
      }
    }
  ]);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
