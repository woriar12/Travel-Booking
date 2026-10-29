const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest / initial demo creation
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  destinationDetails: {
    name: String,
    location: String,
    pricePerPerson: Number
  },
  travelDate: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  contactNumber: {
    type: String,
    default: 'Not provided'
  },
  rawTotal: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  promoCodeApplied: {
    type: String,
    default: null
  },
  totalPrice: {
    type: Number,
    required: true
  },
  bookingStatus: {
    type: String,
    enum: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PAYMENT_FAILED'],
    default: 'PENDING_PAYMENT'
  },
  // Legacy status string for backward compatibility
  status: {
    type: String,
    enum: ['Confirmed', 'Completed', 'Cancelled', 'Pending Payment', 'Payment Failed'],
    default: 'Pending Payment'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  cancellationDate: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundPercentage: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['NOT_APPLICABLE', 'REFUND_PENDING', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_FAILED', 'PARTIALLY_REFUNDED'],
    default: 'NOT_APPLICABLE'
  },
  refundId: {
    type: String,
    default: null
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Sync legacy status with bookingStatus before saving
bookingSchema.pre('save', function (next) {
  if (this.isModified('bookingStatus')) {
    if (this.bookingStatus === 'CONFIRMED') this.status = 'Confirmed';
    else if (this.bookingStatus === 'CANCELLED') this.status = 'Cancelled';
    else if (this.bookingStatus === 'COMPLETED') this.status = 'Completed';
    else if (this.bookingStatus === 'PAYMENT_FAILED') this.status = 'Payment Failed';
    else if (this.bookingStatus === 'PENDING_PAYMENT') this.status = 'Pending Payment';
  } else if (this.isModified('status')) {
    if (this.status === 'Confirmed') this.bookingStatus = 'CONFIRMED';
    else if (this.status === 'Cancelled') this.bookingStatus = 'CANCELLED';
    else if (this.status === 'Completed') this.bookingStatus = 'COMPLETED';
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
