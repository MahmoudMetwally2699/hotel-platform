const mongoose = require('mongoose');

/**
 * LoyaltyProgram Schema
 * Manages the loyalty program configuration for each hotel
 */
const loyaltyProgramSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    unique: true
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
      required: true,
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

// Index for faster queries
loyaltyProgramSchema.index({ hotel: 1 });

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
