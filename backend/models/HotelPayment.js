/**
 * Hotel Payment Model
 *
 * MongoDB schema for tracking hotel payments and outstanding amounts
 * Used for payment analytics and invoice management in the Super Admin dashboard
 */

const mongoose = require('mongoose');

const hotelPaymentSchema = new mongoose.Schema({
  // Hotel reference
  hotelId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel is required'],
    index: true
  },

  // Payment period tracking
  paymentPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Payment period start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Payment period end date is required']
    }
  },

  // Outstanding amounts
  outstandingAmount: {
    type: Number,
    required: [true, 'Outstanding amount is required'],
    min: [0, 'Outstanding amount cannot be negative'],
    default: 0
  },

  // Payment breakdown
  paymentBreakdown: {
    onlinePayments: {
      totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Online payments total cannot be negative']
      },
      count: {
        type: Number,
        default: 0,
        min: [0, 'Online payments count cannot be negative']
      },
      hotelEarnings: {
        type: Number,
        default: 0,
        min: [0, 'Online hotel earnings cannot be negative']
      },
      bookingDetails: [{
        bookingId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Booking'
        },
        bookingNumber: String,
        serviceType: String,
        totalAmount: Number,
        hotelEarnings: Number,
        createdAt: Date,
        guestName: String
      }]
    },
    cashPayments: {
      totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Cash payments total cannot be negative']
      },
      count: {
        type: Number,
        default: 0,
        min: [0, 'Cash payments count cannot be negative']
      },
      hotelEarnings: {
        type: Number,
        default: 0,
        min: [0, 'Cash hotel earnings cannot be negative']
      },
      bookingDetails: [{
        bookingId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Booking'
        },
        bookingNumber: String,
        serviceType: String,
        totalAmount: Number,
        hotelEarnings: Number,
        createdAt: Date,
        guestName: String
      }]
    }
  },

  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  // Payment details (when marked as paid)
  paymentDetails: {
    paidAmount: {
      type: Number,
      min: [0, 'Paid amount cannot be negative']
    },
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'check', 'cash', 'digital_wallet', 'other']
    },
    transactionReference: String,
    notes: String,
    processedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },

  // Invoice information
  invoice: {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    generatedAt: Date,
    generatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    downloadCount: {
      type: Number,
      default: 0
    }
  },

  // Currency
  currency: {
    type: String,
    default: 'USD',
    enum: ['EGP', 'USD', 'EUR', 'GBP', 'SAR']
  },

  // Metadata
  metadata: {
    bookingIds: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Booking'
    }],
    totalBookings: {
      type: Number,
      default: 0
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
hotelPaymentSchema.index({ hotelId: 1, paymentStatus: 1 });
hotelPaymentSchema.index({ 'paymentPeriod.startDate': 1, 'paymentPeriod.endDate': 1 });
hotelPaymentSchema.index({ 'invoice.invoiceNumber': 1 });
hotelPaymentSchema.index({ createdAt: -1 });

// Virtual for total earnings
hotelPaymentSchema.virtual('totalEarnings').get(function() {
  return this.paymentBreakdown.onlinePayments.hotelEarnings + this.paymentBreakdown.cashPayments.hotelEarnings;
});

// Virtual for total transactions
hotelPaymentSchema.virtual('totalTransactions').get(function() {
  return this.paymentBreakdown.onlinePayments.count + this.paymentBreakdown.cashPayments.count;
});

// Pre-save middleware to generate invoice number
hotelPaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoice.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Count existing invoices for this month to generate sequential number
    const count = await this.constructor.countDocuments({
      'invoice.generatedAt': {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });

    this.invoice.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static method to calculate outstanding amounts for a hotel
hotelPaymentSchema.statics.calculateOutstandingForHotel = async function(hotelId, startDate, endDate) {
  const Booking = require('./Booking');

  const pipeline = [
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        'payment.paymentStatus': 'paid',
        'payment.paymentMethod': 'online',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalHotelEarnings: { $sum: '$pricing.hotelEarnings' },
        totalBookings: { $sum: 1 },
        bookingIds: { $push: '$_id' }
      }
    }
  ];

  const result = await Booking.aggregate(pipeline);
  return result[0] || { totalHotelEarnings: 0, totalBookings: 0, bookingIds: [] };
};

// Static method to get payment analytics for a hotel
hotelPaymentSchema.statics.getPaymentAnalytics = async function(hotelId, startDate, endDate) {
  const Booking = require('./Booking');

  const pipeline = [
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        'payment.paymentStatus': 'paid',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$payment.paymentMethod',
        totalAmount: { $sum: '$pricing.totalAmount' },
        hotelEarnings: { $sum: '$pricing.hotelEarnings' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await Booking.aggregate(pipeline);

  const analytics = {
    online: { totalAmount: 0, hotelEarnings: 0, count: 0 },
    cash: { totalAmount: 0, hotelEarnings: 0, count: 0 }
  };

  results.forEach(result => {
    const paymentType = result._id === 'online' ? 'online' : 'cash';
    analytics[paymentType] = {
      totalAmount: result.totalAmount,
      hotelEarnings: result.hotelEarnings,
      count: result.count
    };
  });

  return analytics;
};

module.exports = mongoose.model('HotelPayment', hotelPaymentSchema);
