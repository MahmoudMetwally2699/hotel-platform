/**
 * Feedback Model
 *
 * MongoDB schema for service feedback from guests
 * Collects ratings and written feedback for services after payment completion
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // References
  bookingId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking is required'],
    index: true
  },

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

  // Service Type (matches Booking model)
  serviceType: {
    type: String,
    enum: ['regular', 'housekeeping', 'transportation', 'laundry', 'tours', 'restaurant', 'dining'],
    default: 'regular'
  },

  // Housekeeping Sub-category (for detailed housekeeping analytics)
  housekeepingType: {
    type: String,
    enum: ['maintenance', 'amenities', 'cleaning'],
    required: function() {
      return this.serviceType === 'housekeeping';
    }
  },

  // Feedback Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },

  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },

  // Guest Information (for display purposes)
  guestName: {
    type: String,
    required: [true, 'Guest name is required']
  },

  guestEmail: {
    type: String,
    required: [true, 'Guest email is required']
  },

  // Booking Information (for context)
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },

  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },

  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD'
  },

  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['online', 'cash'],
    required: [true, 'Payment method is required']
  },

  paymentType: {
    type: String,
    enum: ['credit-card', 'debit-card', 'paypal', 'stripe', 'cash', 'wallet', 'bank-transfer'],
    required: [true, 'Payment type is required']
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'hidden', 'flagged'],
    default: 'active'
  },

  // Moderation
  isModerated: {
    type: Boolean,
    default: false
  },

  moderatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },

  moderatedAt: Date,

  moderationNotes: String,

  // Metadata
  isAnonymous: {
    type: Boolean,
    default: false
  },

  ipAddress: String,

  userAgent: String,

  // Response from service provider (optional)
  response: {
    content: {
      type: String,
      maxlength: [500, 'Response cannot exceed 500 characters']
    },
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
feedbackSchema.index({ hotelId: 1, createdAt: -1 });
feedbackSchema.index({ serviceProviderId: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1, status: 1 });
feedbackSchema.index({ bookingId: 1 }, { unique: true }); // One feedback per booking
feedbackSchema.index({ serviceType: 1, rating: -1 });
feedbackSchema.index({ hotelId: 1, serviceType: 1, createdAt: -1 }); // For analytics queries
feedbackSchema.index({ hotelId: 1, housekeepingType: 1, createdAt: -1 }); // For housekeeping analytics

// Virtual for average rating calculation helper
feedbackSchema.virtual('ratingStars').get(function() {
  return Array(5).fill(0).map((_, index) => index < this.rating);
});

// Static methods for analytics
feedbackSchema.statics.getAverageRating = async function(query = {}) {
  const pipeline = [
    { $match: { status: 'active', ...query } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        ratingsDistribution: {
          $push: '$rating'
        },
        serviceProviders: { $addToSet: '$serviceProviderId' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);

  if (!result.length) {
    return {
      averageRating: 0,
      totalFeedbacks: 0,
      totalCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      serviceProvidersCount: 0
    };
  }

  const data = result[0];
  const distribution = data.ratingsDistribution.reduce((acc, rating) => {
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  return {
    averageRating: Math.round(data.averageRating * 10) / 10,
    totalFeedbacks: data.totalFeedbacks,
    totalCount: data.totalFeedbacks, // Alias for frontend compatibility
    ratingDistribution: distribution, // For frontend compatibility
    ratingsDistribution: distribution, // Keep original name for backward compatibility
    serviceProvidersCount: data.serviceProviders.length
  };
};

feedbackSchema.statics.getServiceProviderRating = async function(serviceProviderId) {
  const mongoose = require('mongoose');
  const objectId = typeof serviceProviderId === 'string'
    ? new mongoose.Types.ObjectId(serviceProviderId)
    : serviceProviderId;
  return this.getAverageRating({ serviceProviderId: objectId });
};

feedbackSchema.statics.getHotelRating = async function(hotelId) {
  return this.getAverageRating({ hotelId });
};

feedbackSchema.statics.getServiceTypeRating = async function(serviceType, filters = {}) {
  return this.getAverageRating({ serviceType, ...filters });
};

// Pre-save middleware
feedbackSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set guest name and email from populated user if available
    if (!this.guestName && this.guestId && this.guestId.firstName) {
      this.guestName = `${this.guestId.firstName} ${this.guestId.lastName || ''}`.trim();
    }
    if (!this.guestEmail && this.guestId && this.guestId.email) {
      this.guestEmail = this.guestId.email;
    }
  }
  next();
});

// Post-find middleware to populate references
feedbackSchema.post(['find', 'findOne'], async function(docs) {
  if (!docs) return;

  const feedbacks = Array.isArray(docs) ? docs : [docs];

  for (const feedback of feedbacks) {
    if (feedback.isAnonymous) {
      feedback.guestName = 'Anonymous Guest';
      feedback.guestEmail = 'anonymous@guest.com';
    }
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
