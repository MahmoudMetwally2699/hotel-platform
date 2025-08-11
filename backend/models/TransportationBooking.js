/**
 * Transportation Booking Model
 *
 * MongoDB schema for transportation bookings in the new uber-style system
 * Handles quote-based pricing, payment processing with Kashier.io, and booking lifecycle
 */

const mongoose = require('mongoose');

const transportationBookingSchema = new mongoose.Schema({
  // Booking Identification
  bookingReference: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TR${year}${month}${day}${random}`;
    }
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

  // Vehicle Selection
  vehicleDetails: {
    vehicleType: {
      type: String,
      required: true,
      enum: ['sedan', 'suv', 'van', 'hatchback', 'luxury_car', 'minibus', 'pickup_truck']
    },
    comfortLevel: {
      type: String,
      required: true,
      enum: ['economy', 'comfort', 'premium']
    },
    passengerCapacity: Number,
    selectedAmenities: [String]
  },

  // Trip Details
  tripDetails: {
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true
    },
    scheduledDateTime: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
      index: true
    },
    passengerCount: {
      type: Number,
      required: true,
      min: [1, 'Passenger count must be at least 1']
    },
    specialRequirements: String,
    estimatedDistance: Number, // in kilometers (if calculated)
    estimatedDuration: Number  // in minutes (if calculated)
  },

  // Booking Status Management
  bookingStatus: {
    type: String,
    enum: [
      'pending_quote',        // Initial booking created, waiting for service provider quote
      'quote_sent',          // Service provider has sent quote to client
      'quote_accepted',      // Client accepted the quote
      'payment_pending',     // Payment session created, waiting for payment
      'payment_completed',   // Payment successful
      'service_active',      // Transportation service is ongoing
      'completed',           // Service completed successfully
      'cancelled',           // Booking cancelled
      'quote_rejected',      // Client rejected the quote
      'quote_expired'        // Quote expired without client response
    ],
    default: 'pending_quote',
    required: true,
    index: true
  },

  // Quote Information (filled by service provider)
  quote: {
    basePrice: {
      type: Number,
      min: [0, 'Base price cannot be negative']
    },
    hotelMarkupPercentage: Number,
    finalPrice: Number, // basePrice + markup
    quotedAt: Date,
    expiresAt: Date,
    quoteNotes: String,
    priceBreakdown: {
      baseFare: Number,
      distanceFare: Number,
      timeFare: Number,
      additionalServices: Number,
      surcharges: Number,
      total: Number
    }
  },

  // Hotel Markup Calculation
  hotelMarkup: {
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Markup percentage cannot be negative']
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Markup amount cannot be negative']
    }
  },

  // Payment Information (Kashier.io Integration)
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'wallet', 'bank-transfer']
    },

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
      }
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
      enum: ['EGP', 'USD', 'EUR', 'GBP']
    },

    paymentDate: Date,

    // Payment breakdown
    breakdown: {
      serviceProviderAmount: Number,
      hotelCommission: Number,
      platformFee: Number,
      taxAmount: Number
    }
  },

  // Guest Information
  guestDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    nationality: String,
    specialRequests: String
  },

  // Service Provider Response
  providerResponse: {
    respondedAt: Date,
    responseNotes: String,
    estimatedPickupTime: String,
    driverDetails: {
      name: String,
      phone: String,
      vehiclePlate: String,
      vehicleModel: String
    }
  },

  // Communication Log
  communications: [{
    sender: {
      type: String,
      enum: ['guest', 'provider', 'hotel', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['quote', 'acceptance', 'rejection', 'info', 'reminder'],
      default: 'info'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],

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

  // Service Tracking
  serviceTracking: {
    driverAssigned: {
      type: Boolean,
      default: false
    },
    driverLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    serviceStartTime: Date,
    serviceEndTime: Date,
    actualDistance: Number,
    actualDuration: Number,
    route: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }]
  },

  // Rating and Feedback
  feedback: {
    guestRating: {
      overall: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
      },
      punctuality: Number,
      vehicleCondition: Number,
      driverBehavior: Number,
      valueForMoney: Number
    },
    guestComment: String,
    guestFeedbackDate: Date,

    providerRating: {
      overall: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
      }
    },
    providerComment: String,
    providerFeedbackDate: Date
  },

  // Cancellation Information
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['guest', 'provider', 'hotel', 'system']
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    },
    cancellationFee: {
      type: Number,
      default: 0,
      min: [0, 'Cancellation fee cannot be negative']
    }
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'phone', 'admin'],
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transportationBookingSchema.index({ guestId: 1, bookingStatus: 1 });
transportationBookingSchema.index({ hotelId: 1, bookingStatus: 1, createdAt: -1 });
transportationBookingSchema.index({ serviceProviderId: 1, bookingStatus: 1, createdAt: -1 });
transportationBookingSchema.index({ 'tripDetails.scheduledDateTime': 1, bookingStatus: 1 });
// Note: bookingReference index is already created by the unique: true property in schema
transportationBookingSchema.index({ 'payment.kashier.sessionId': 1 });
transportationBookingSchema.index({ 'payment.kashier.transactionId': 1 });

// Virtual fields
transportationBookingSchema.virtual('guest', {
  ref: 'User',
  localField: 'guestId',
  foreignField: '_id',
  justOne: true
});

transportationBookingSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

transportationBookingSchema.virtual('serviceProvider', {
  ref: 'ServiceProvider',
  localField: 'serviceProviderId',
  foreignField: '_id',
  justOne: true
});

transportationBookingSchema.virtual('service', {
  ref: 'Service',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true
});

transportationBookingSchema.virtual('isQuoteExpired').get(function() {
  return this.quote.expiresAt && new Date() > this.quote.expiresAt;
});

transportationBookingSchema.virtual('isPaymentPending').get(function() {
  return ['payment_pending', 'payment_processing'].includes(this.payment.status);
});

transportationBookingSchema.virtual('isCompleted').get(function() {
  return this.bookingStatus === 'completed';
});

transportationBookingSchema.virtual('canBeCancelled').get(function() {
  const cancellableStatuses = ['pending_quote', 'quote_sent', 'quote_accepted', 'payment_pending'];
  return cancellableStatuses.includes(this.bookingStatus);
});

// Pre-save middleware
transportationBookingSchema.pre('save', async function(next) {
  // Generate booking reference if not exists or if it's a new document
  if (this.isNew || !this.bookingReference) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const bookingRef = `TR${year}${month}${day}${random}`;

      // Check if this reference already exists
      const existing = await this.constructor.findOne({ bookingReference: bookingRef });
      if (!existing) {
        this.bookingReference = bookingRef;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Fallback to timestamp-based reference if all attempts fail
      const timestamp = Date.now().toString().slice(-8);
      this.bookingReference = `TR${timestamp}`;
    }
  }

  // Add status to history if status changed
  if (this.isModified('bookingStatus')) {
    this.statusHistory.push({
      status: this.bookingStatus,
      timestamp: new Date(),
      automaticUpdate: true
    });
  }

  next();
});

// Instance methods
transportationBookingSchema.methods.createQuote = function(basePrice, notes = '', expirationHours = 24) {
  this.quote = {
    basePrice: basePrice,
    quotedAt: new Date(),
    expiresAt: new Date(Date.now() + (expirationHours * 60 * 60 * 1000)),
    quoteNotes: notes
  };

  // Calculate hotel markup
  this.hotelMarkup.percentage = this.hotelMarkup.percentage || 15; // Default 15%
  this.hotelMarkup.amount = (basePrice * this.hotelMarkup.percentage) / 100;
  this.quote.finalPrice = basePrice + this.hotelMarkup.amount;

  // Set payment amount for the new simplified workflow
  this.payment.totalAmount = this.quote.finalPrice;

  // Skip quote_sent and go directly to payment_pending
  this.bookingStatus = 'payment_pending';

  // Add communication log
  this.communications.push({
    sender: 'provider',
    message: `Quote set: $${this.quote.finalPrice}${notes ? `. Notes: ${notes}` : ''} - Ready for payment`,
    messageType: 'quote'
  });

  return this.save();
};

transportationBookingSchema.methods.acceptQuote = function(guestId) {
  if (this.isQuoteExpired) {
    throw new Error('Quote has expired');
  }

  this.bookingStatus = 'quote_accepted';

  // Add communication log
  this.communications.push({
    sender: 'guest',
    message: `Quote accepted for $${this.quote.finalPrice}`,
    messageType: 'acceptance'
  });

  return this.save();
};

transportationBookingSchema.methods.rejectQuote = function(guestId, reason = '') {
  this.bookingStatus = 'quote_rejected';

  // Add communication log
  this.communications.push({
    sender: 'guest',
    message: `Quote rejected${reason ? `. Reason: ${reason}` : ''}`,
    messageType: 'rejection'
  });

  return this.save();
};

transportationBookingSchema.methods.createKashierPaymentSession = function(kashierSessionId, paymentUrl) {
  this.payment.kashier.sessionId = kashierSessionId;
  this.payment.kashier.paymentUrl = paymentUrl;
  this.payment.totalAmount = this.quote.finalPrice;
  this.payment.status = 'pending';
  this.bookingStatus = 'payment_pending';

  return this.save();
};

transportationBookingSchema.methods.processKashierPayment = function(webhookData) {
  // Store the complete webhook data
  this.payment.kashier.webhookData = webhookData;
  
  // Extract transaction details based on new webhook format
  this.payment.kashier.transactionId = webhookData.transactionId;
  this.payment.kashier.paymentReference = webhookData.kashierOrderId || webhookData.orderReference;
  this.payment.method = webhookData.method; // card, wallet, etc.

  // Store additional payment details
  if (webhookData.card) {
    this.payment.kashier.cardInfo = {
      cardBrand: webhookData.card.cardInfo?.cardBrand,
      maskedCard: webhookData.card.cardInfo?.maskedCard,
      cardHolderName: webhookData.card.cardInfo?.cardHolderName
    };
  }

  if (webhookData.status === 'SUCCESS') {
    this.payment.status = 'completed';
    this.payment.paidAmount = webhookData.amount || this.payment.totalAmount;
    this.payment.currency = webhookData.currency || this.payment.currency;
    this.payment.paymentDate = webhookData.creationDate ? new Date(webhookData.creationDate) : new Date();
    this.bookingStatus = 'payment_completed';

    // Store transaction response details
    this.payment.kashier.transactionResponseCode = webhookData.transactionResponseCode;
    this.payment.kashier.transactionResponseMessage = webhookData.transactionResponseMessage;

    // Calculate payment breakdown
    this.payment.breakdown = {
      serviceProviderAmount: this.quote?.basePrice || 0,
      hotelCommission: this.hotelMarkup?.amount || 0,
      platformFee: 0, // Can be calculated if needed
      taxAmount: 0    // Can be calculated if needed
    };

    // Add communication log
    this.communications.push({
      sender: 'system',
      message: `Payment completed successfully. Amount: ${this.payment.paidAmount} ${this.payment.currency}. Transaction ID: ${webhookData.transactionId}`,
      messageType: 'info'
    });
  } else if (webhookData.status === 'FAILED' || webhookData.status === 'ERROR') {
    this.payment.status = 'failed';
    
    // Store failure reason
    this.payment.kashier.failureReason = webhookData.transactionResponseMessage || 'Payment failed';
    
    // Add communication log for failure
    this.communications.push({
      sender: 'system',
      message: `Payment failed. Reason: ${this.payment.kashier.failureReason}`,
      messageType: 'info'
    });
    
    // Keep booking status as payment_pending to allow retry
  } else {
    // Handle other statuses (PENDING, PROCESSING, etc.)
    this.payment.status = webhookData.status?.toLowerCase() || 'pending';
    
    this.communications.push({
      sender: 'system',
      message: `Payment status updated: ${webhookData.status}`,
      messageType: 'info'
    });
  }

  return this.save();
};

transportationBookingSchema.methods.cancel = function(cancelledBy, reason = '') {
  if (!this.canBeCancelled) {
    throw new Error('Booking cannot be cancelled in current status');
  }

  this.bookingStatus = 'cancelled';
  this.cancellation = {
    cancelledBy: cancelledBy,
    cancelledAt: new Date(),
    reason: reason
  };

  // Add communication log
  this.communications.push({
    sender: cancelledBy,
    message: `Booking cancelled${reason ? `. Reason: ${reason}` : ''}`,
    messageType: 'info'
  });

  return this.save();
};

// Static methods
transportationBookingSchema.statics.findByGuest = function(guestId) {
  return this.find({ guestId }).sort({ createdAt: -1 });
};

transportationBookingSchema.statics.findByProvider = function(serviceProviderId) {
  return this.find({ serviceProviderId }).sort({ createdAt: -1 });
};

transportationBookingSchema.statics.findByHotel = function(hotelId) {
  return this.find({ hotelId }).sort({ createdAt: -1 });
};

transportationBookingSchema.statics.findPendingQuotes = function(serviceProviderId) {
  return this.find({
    serviceProviderId,
    bookingStatus: 'pending_quote'
  }).sort({ createdAt: -1 });
};

transportationBookingSchema.statics.findPendingPayments = function(guestId) {
  return this.find({
    guestId,
    bookingStatus: 'payment_pending' // Only payment_pending bookings need payment
  }).sort({ createdAt: -1 });
};

transportationBookingSchema.statics.getRevenueStats = function(filter = {}) {
  return this.aggregate([
    { $match: { ...filter, bookingStatus: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$payment.totalAmount' },
        providerEarnings: { $sum: '$payment.breakdown.serviceProviderAmount' },
        hotelCommissions: { $sum: '$payment.breakdown.hotelCommission' },
        totalBookings: { $sum: 1 },
        averageOrderValue: { $avg: '$payment.totalAmount' }
      }
    }
  ]);
};

const TransportationBooking = mongoose.model('TransportationBooking', transportationBookingSchema);

module.exports = TransportationBooking;
