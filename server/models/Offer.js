const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: String,
    default: '2026-12-31'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);
