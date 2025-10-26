const mongoose = require('mongoose');

/**
 * LoyaltyMember Schema
 * Tracks individual guest loyalty membership and points
 */
const loyaltyMemberSchema = new mongoose.Schema({
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },

  // Current Tier Status
  currentTier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE'
  },

  // Points Balance
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },

  availablePoints: {
    type: Number,
    default: 0,
    min: 0
  },

  // Lifetime Statistics
  lifetimeSpending: {
    type: Number,
    default: 0,
    min: 0
  },

  lifetimePointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },

  lifetimePointsRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },

  totalNightsStayed: {
    type: Number,
    default: 0,
    min: 0
  },

  // Tier Progress
  tierProgress: {
    pointsToNextTier: {
      type: Number,
      default: 0
    },
    nextTier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', null],
      default: 'SILVER'
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Points History
  pointsHistory: [{
    type: {
      type: String,
      enum: ['EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED', 'BONUS', 'NIGHTS'],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    nights: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    bookingReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    transportationBookingReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportationBooking'
    },
    expirationDate: {
      type: Date
    },
    adminNote: {
      type: String
    },
    isExpired: {
      type: Boolean,
      default: false
    }
  }],

  // Redemption History
  redemptionHistory: [{
    points: {
      type: Number,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoyaltyReward'
    },
    rewardName: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    bookingReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    transportationBookingReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportationBooking'
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPLIED', 'EXPIRED', 'CANCELLED'],
      default: 'APPLIED'
    }
  }],

  // Membership Dates
  joinDate: {
    type: Date,
    default: Date.now
  },

  lastActivity: {
    type: Date,
    default: Date.now
  },

  // Tier History
  tierHistory: [{
    tier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: 'Points threshold reached'
    }
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one membership per guest per hotel
loyaltyMemberSchema.index({ guest: 1, hotel: 1 }, { unique: true });

// Indexes for faster queries
loyaltyMemberSchema.index({ hotel: 1, currentTier: 1 });
loyaltyMemberSchema.index({ hotel: 1, totalPoints: -1 });
loyaltyMemberSchema.index({ lastActivity: -1 });

// Pre-save middleware to update last activity
loyaltyMemberSchema.pre('save', function(next) {
  if (this.isModified('pointsHistory') || this.isModified('redemptionHistory')) {
    this.lastActivity = Date.now();
  }
  next();
});

// Method to add points
loyaltyMemberSchema.methods.addPoints = function(points, description, bookingRef = null, transportationBookingRef = null, expirationMonths = 12) {
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + expirationMonths);

  this.totalPoints += points;
  this.availablePoints += points;
  this.lifetimePointsEarned += points;

  this.pointsHistory.push({
    type: 'EARNED',
    points: points,
    description: description,
    date: new Date(),
    bookingReference: bookingRef,
    transportationBookingReference: transportationBookingRef,
    expirationDate: expirationDate,
    isExpired: false
  });

  this.lastActivity = new Date();
};

// Method to redeem points
loyaltyMemberSchema.methods.redeemPoints = function(points, value, rewardName, rewardId = null, bookingRef = null, transportationBookingRef = null) {
  if (this.availablePoints < points) {
    throw new Error('Insufficient points for redemption');
  }

  this.availablePoints -= points;
  this.lifetimePointsRedeemed += points;

  this.pointsHistory.push({
    type: 'REDEEMED',
    points: -points,
    description: `Redeemed for: ${rewardName}`,
    date: new Date()
  });

  this.redemptionHistory.push({
    points: points,
    value: value,
    rewardId: rewardId,
    rewardName: rewardName,
    date: new Date(),
    bookingReference: bookingRef,
    transportationBookingReference: transportationBookingRef,
    status: 'APPLIED'
  });

  this.lastActivity = new Date();
};

// Method to adjust points (admin action)
loyaltyMemberSchema.methods.adjustPoints = function(points, reason, adminNote = '') {
  const type = points > 0 ? 'ADJUSTED' : 'ADJUSTED';

  this.totalPoints += points;
  this.availablePoints += points;

  if (points > 0) {
    this.lifetimePointsEarned += points;
  }

  this.pointsHistory.push({
    type: type,
    points: points,
    description: reason,
    date: new Date(),
    adminNote: adminNote
  });

  this.lastActivity = new Date();
};

// Method to update tier
loyaltyMemberSchema.methods.updateTier = function(newTier, reason = 'Points threshold reached') {
  if (this.currentTier !== newTier) {
    const oldTier = this.currentTier;
    this.currentTier = newTier;

    this.tierHistory.push({
      tier: newTier,
      date: new Date(),
      reason: reason
    });

    return { upgraded: true, oldTier, newTier };
  }

  return { upgraded: false };
};

// Method to calculate tier progress
loyaltyMemberSchema.methods.calculateTierProgress = function(tierConfiguration) {
  const currentTier = tierConfiguration.find(t => t.name === this.currentTier);
  if (!currentTier) return;

  const nextTierIndex = tierConfiguration.findIndex(t => t.name === this.currentTier) + 1;

  if (nextTierIndex < tierConfiguration.length) {
    const nextTier = tierConfiguration[nextTierIndex];
    const pointsToNextTier = nextTier.minPoints - this.totalPoints;
    const progressPercentage = Math.min(100, ((this.totalPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100);

    this.tierProgress = {
      pointsToNextTier: Math.max(0, pointsToNextTier),
      nextTier: nextTier.name,
      progressPercentage: Math.max(0, progressPercentage)
    };
  } else {
    // Already at highest tier
    this.tierProgress = {
      pointsToNextTier: 0,
      nextTier: null,
      progressPercentage: 100
    };
  }
};

// Method to check and expire old points
loyaltyMemberSchema.methods.expireOldPoints = function() {
  const now = new Date();
  let expiredPoints = 0;

  this.pointsHistory.forEach(entry => {
    if (entry.type === 'EARNED' && !entry.isExpired && entry.expirationDate && entry.expirationDate < now) {
      entry.isExpired = true;
      expiredPoints += entry.points;

      // Add expiration record
      this.pointsHistory.push({
        type: 'EXPIRED',
        points: -entry.points,
        description: `Points expired from ${entry.description}`,
        date: now
      });
    }
  });

  if (expiredPoints > 0) {
    this.availablePoints = Math.max(0, this.availablePoints - expiredPoints);
    this.totalPoints = Math.max(0, this.totalPoints - expiredPoints);
  }

  return expiredPoints;
};

module.exports = mongoose.model('LoyaltyMember', loyaltyMemberSchema);
