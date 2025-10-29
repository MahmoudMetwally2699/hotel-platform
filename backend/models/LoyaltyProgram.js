const mongoose = require('mongoose');

/**
 * LoyaltyProgram Schema
 * Manages the loyalty program configuration for each hotel
 * Now supports channel-based configurations (Travel Agency, Corporate, Direct)
 */
const loyaltyProgramSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },

  // Channel for segmentation (Travel Agency, Corporate, Direct)
  channel: {
    type: String,
    enum: ['Travel Agency', 'Corporate', 'Direct'],
    required: true
  },

  // Tier Configuration
  tierConfiguration: [{
    name: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      required: true
    },
    minPoints: {
      type: Number,
      required: true,
      default: 0
    },
    maxPoints: {
      type: Number,
      required: true
    },
    benefits: [{
      type: String
    }],
    discountPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      default: 0
    },
    color: {
      type: String,
      default: '#CD7F32' // Default bronze color
    }
  }],

  // Points Earning Rules
  pointsRules: {
    pointsPerDollar: {
      type: Number,
      required: true,
      default: 1,
      min: 0
    },
    pointsPerNight: {
      type: Number,
      default: 50, // 50 points per night stayed
      min: 0
    },
    serviceMultipliers: {
      laundry: {
        type: Number,
        default: 1,
        min: 0
      },
      transportation: {
        type: Number,
        default: 1,
        min: 0
      },
      tourism: {
        type: Number,
        default: 1.5,
        min: 0
      },
      travel: {
        type: Number,
        default: 1.5,
        min: 0
      },
      housekeeping: {
        type: Number,
        default: 1,
        min: 0
      }
    }
  },

  // Redemption Rules
  redemptionRules: {
    pointsToMoneyRatio: {
      type: Number,
      required: true,
      default: 100, // 100 points = $1
      min: 1
    },
    minimumRedemption: {
      type: Number,
      required: true,
      default: 500, // Minimum 500 points to redeem
      min: 0
    },
    maximumRedemption: {
      type: Number,
      default: null, // No maximum by default (null means unlimited)
      min: 0
    },
    restrictions: {
      type: String,
      default: ''
    }
  },

  // Program Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Points Expiration
  expirationMonths: {
    type: Number,
    default: 12, // Points expire after 12 months
    min: 0
  },

  // Program Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Statistics
  statistics: {
    totalMembers: {
      type: Number,
      default: 0
    },
    totalPointsIssued: {
      type: Number,
      default: 0
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0
    },
    totalRevenueFromLoyalMembers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for hotel and channel (one program per hotel per channel)
loyaltyProgramSchema.index({ hotel: 1, channel: 1 }, { unique: true });

// Index for faster queries
loyaltyProgramSchema.index({ hotel: 1, isActive: 1 });

// Pre-save middleware to update timestamps
loyaltyProgramSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get default tier configuration
loyaltyProgramSchema.statics.getDefaultTierConfiguration = function() {
  return [
    {
      name: 'BRONZE',
      minPoints: 0,
      maxPoints: 999,
      benefits: ['Priority email support', 'Birthday bonus points'],
      discountPercentage: 5,
      color: '#CD7F32'
    },
    {
      name: 'SILVER',
      minPoints: 1000,
      maxPoints: 2999,
      benefits: ['10% discount on all services', 'Free room upgrade (subject to availability)', 'Priority phone support'],
      discountPercentage: 10,
      color: '#C0C0C0'
    },
    {
      name: 'GOLD',
      minPoints: 3000,
      maxPoints: 5999,
      benefits: ['15% discount on all services', 'Late checkout', 'Complimentary breakfast', 'Premium support'],
      discountPercentage: 15,
      color: '#FFD700'
    },
    {
      name: 'PLATINUM',
      minPoints: 6000,
      maxPoints: 999999,
      benefits: ['20% discount on all services', 'Exclusive rewards access', 'Personal concierge', 'Airport transfer discount'],
      discountPercentage: 20,
      color: '#E5E4E2'
    }
  ];
};

// Method to get default channel settings
loyaltyProgramSchema.statics.getDefaultChannelSettings = function(channel) {
  const defaults = {
    'Travel Agency': {
      pointsPerDollar: 1,
      pointsPerNight: 50,
      serviceMultipliers: {
        laundry: 1.2,
        transportation: 1.5,
        tourism: 2.0,
        travel: 2.0,
        housekeeping: 1.0
      },
      pointsToMoneyRatio: 100,
      minimumRedemption: 500,
      maximumRedemption: 10000
    },
    'Corporate': {
      pointsPerDollar: 1.5,
      pointsPerNight: 75,
      serviceMultipliers: {
        laundry: 1.5,
        transportation: 2.0,
        tourism: 1.2,
        travel: 1.2,
        housekeeping: 1.3
      },
      pointsToMoneyRatio: 100,
      minimumRedemption: 1000,
      maximumRedemption: 20000
    },
    'Direct': {
      pointsPerDollar: 2,
      pointsPerNight: 100,
      serviceMultipliers: {
        laundry: 1.5,
        transportation: 1.5,
        tourism: 1.5,
        travel: 1.5,
        housekeeping: 1.5
      },
      pointsToMoneyRatio: 100,
      minimumRedemption: 500,
      maximumRedemption: null // Unlimited
    }
  };

  return defaults[channel] || defaults['Direct'];
};

// Method to get tier by points
loyaltyProgramSchema.methods.getTierByPoints = function(points) {
  for (const tier of this.tierConfiguration) {
    if (points >= tier.minPoints && points <= tier.maxPoints) {
      return tier;
    }
  }
  return this.tierConfiguration[0]; // Return bronze by default
};

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);
