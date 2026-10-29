const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
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
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  razorpaySignature: {
    type: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    default: 'razorpay'
  },
  errorMessage: {
    type: String,
    default: null
  },
  notes: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for date filtering and fast lookups
paymentSchema.index({ paymentStatus: 1, paymentDate: -1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ booking: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
