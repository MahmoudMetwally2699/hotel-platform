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

  // Hotel Group Support (for shared loyalty across hotels)
  hotelGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelGroup',
    default: null,
    index: true
  },

  // Guest Email (for cross-hotel account linking in groups)
  guestEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },

  // Linked Accounts (for hotel group members)
  linkedAccounts: [{
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userEmail: String,
    linkedDate: {
      type: Date,
      default: Date.now
    }
  }],

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

  // Tier Points - Used only for tier qualification, never decreases on redemption
  tierPoints: {
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
    // Track which hotel in group earned the points
    earnedAtHotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
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

// Index for hotel group + email (for cross-hotel lookup)
loyaltyMemberSchema.index({ hotelGroupId: 1, guestEmail: 1 });

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
loyaltyMemberSchema.methods.addPoints = function(points, description, bookingRef = null, transportationBookingRef = null, expirationMonths = 12, earnedAtHotelId = null) {
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + expirationMonths);

  // Update both totalPoints (for backward compatibility and display)
  this.totalPoints += points;

  // Update tierPoints (for tier qualification - never decreases)
  this.tierPoints += points;

  // Update availablePoints (for redemption)
  this.availablePoints += points;

  this.lifetimePointsEarned += points;

  this.pointsHistory.push({
    type: 'EARNED',
    points: points,
    description: description,
    date: new Date(),
    earnedAtHotel: earnedAtHotelId,
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

  // Only deduct from availablePoints, NOT from tierPoints or totalPoints
  // This ensures users maintain their tier status after redemption
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
  this.tierPoints += points;
  this.availablePoints += points;

  // Ensure tierPoints never goes negative
  if (this.tierPoints < 0) {
    this.tierPoints = 0;
  }

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

// Method to adjust ONLY redeemable points (without affecting tier points)
loyaltyMemberSchema.methods.adjustRedeemablePoints = function(points, reason, adminNote = '') {
  const type = points > 0 ? 'ADJUSTED' : 'ADJUSTED';

  // Only adjust availablePoints - tierPoints remain unchanged
  this.availablePoints += points;

  // Ensure availablePoints never goes negative
  if (this.availablePoints < 0) {
    this.availablePoints = 0;
  }

  // Don't update totalPoints or tierPoints - this is redeemable-only adjustment
  // This allows admins to give/remove redeemable points without affecting tier status

  this.pointsHistory.push({
    type: type,
    points: points,
    description: `${reason} (Redeemable only)`,
    date: new Date(),
    adminNote: adminNote || 'Redeemable points adjustment only - tier unaffected'
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
    const pointsToNextTier = nextTier.minPoints - this.tierPoints;
    const progressPercentage = Math.min(100, ((this.tierPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100);

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
    // Only reduce availablePoints when points expire, not tierPoints
    this.availablePoints = Math.max(0, this.availablePoints - expiredPoints);
    this.totalPoints = Math.max(0, this.totalPoints - expiredPoints);
    // tierPoints remain unchanged - users keep their tier status
  }

  return expiredPoints;
};

// ============================================
// HOTEL GROUP METHODS
// ============================================

/**
 * Link a new account from another hotel in the same group
 * @param {ObjectId} hotelId - Hotel ID
 * @param {ObjectId} userId - User ID
 * @param {String} userName - User name
 * @param {String} userEmail - User email
 */
loyaltyMemberSchema.methods.linkAccount = function(hotelId, userId, userName, userEmail) {
  // Check if already linked
  const existing = this.linkedAccounts.find(
    acc => acc.hotelId.toString() === hotelId.toString() && acc.userId.toString() === userId.toString()
  );

  if (!existing) {
    this.linkedAccounts.push({
      hotelId,
      userId,
      userName,
      userEmail,
      linkedDate: new Date()
    });
  }
};

/**
 * Check if a hotel/user combination is linked
 * @param {ObjectId} hotelId - Hotel ID
 * @param {ObjectId} userId - User ID
 * @returns {Boolean}
 */
loyaltyMemberSchema.methods.isLinked = function(hotelId, userId) {
  return this.linkedAccounts.some(
    acc => acc.hotelId.toString() === hotelId.toString() && acc.userId.toString() === userId.toString()
  );
};

/**
 * Get all linked hotel IDs
 * @returns {Array<ObjectId>}
 */
loyaltyMemberSchema.methods.getLinkedHotels = function() {
  return this.linkedAccounts.map(acc => acc.hotelId);
};

module.exports = mongoose.model('LoyaltyMember', loyaltyMemberSchema);
