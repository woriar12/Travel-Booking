const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  refundId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userName: {
    type: String
  },
  userEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  razorpayRefundId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  refundStatus: {
    type: String,
    enum: ['NOT_APPLICABLE', 'REFUND_PENDING', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_FAILED', 'PARTIALLY_REFUNDED'],
    default: 'REFUND_PENDING'
  },
  cancellationPolicy: {
    daysBeforeTravel: Number,
    hoursBeforeTravel: Number,
    refundPercentage: Number,
    policyApplied: String
  },
  refundInitiatedDate: {
    type: Date,
    default: Date.now
  },
  refundCompletedDate: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for date filtering and fast lookups
refundSchema.index({ refundStatus: 1, refundCompletedDate: -1 });
refundSchema.index({ booking: 1 });
refundSchema.index({ razorpayRefundId: 1 });

module.exports = mongoose.model('Refund', refundSchema);
