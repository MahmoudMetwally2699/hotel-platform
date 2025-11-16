/**
 * HotelGroup Model
 *
 * Manages hotel groups where multiple hotels share loyalty points
 * Guests automatically accumulate shared points across all hotels in a group
 */

const mongoose = require('mongoose');

const hotelGroupSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Hotel group name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters'],
    index: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Hotels in this group
  hotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  }],

  // Group Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Created by Super Admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Statistics (cached for performance)
  statistics: {
    totalHotels: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    totalPointsIssued: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
hotelGroupSchema.index({ isActive: 1 });
hotelGroupSchema.index({ createdBy: 1 });

// Pre-save middleware to update hotel count
hotelGroupSchema.pre('save', function(next) {
  this.statistics.totalHotels = this.hotels.length;
  next();
});

// Method to add hotel to group
hotelGroupSchema.methods.addHotel = function(hotelId) {
  if (!this.hotels.includes(hotelId)) {
    this.hotels.push(hotelId);
    this.statistics.totalHotels = this.hotels.length;
  }
};

// Method to remove hotel from group
hotelGroupSchema.methods.removeHotel = function(hotelId) {
  const index = this.hotels.indexOf(hotelId);
  if (index > -1) {
    this.hotels.splice(index, 1);
    this.statistics.totalHotels = this.hotels.length;
  }
};

// Method to check if hotel is in group
hotelGroupSchema.methods.hasHotel = function(hotelId) {
  return this.hotels.some(id => id.toString() === hotelId.toString());
};

module.exports = mongoose.model('HotelGroup', hotelGroupSchema);
