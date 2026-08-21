const Offer = require('../models/Offer');

// Helper: map Offer
const mapOffer = (o) => ({
  id: o._id.toString(),
  _id: o._id.toString(),
  code: o.code,
  discountType: o.discountType,
  discountValue: o.discountValue,
  minBookingAmount: o.minBookingAmount,
  description: o.description,
  active: o.active,
  expiresAt: o.expiresAt
});

// @desc    Get all active promo offers from MongoDB
// @route   GET /api/offers
// @access  Public
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers.map(mapOffer)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a promo offer code against MongoDB
// @route   POST /api/offers/validate
// @access  Public
const validateOffer = async (req, res) => {
  try {
    const { code, bookingAmount, totalAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a promo code' });
    }

    const offer = await Offer.findOne({ code: code.toUpperCase().trim(), active: true });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Invalid or expired promo code' });
    }

    const amount = Number(bookingAmount !== undefined ? bookingAmount : totalAmount) || 0;
    if (offer.minBookingAmount && amount < offer.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum booking amount of ₹${offer.minBookingAmount.toLocaleString()}`
      });
    }

    let discountAmount = 0;
    if (offer.discountType === 'percentage') {
      discountAmount = Math.round((amount * offer.discountValue) / 100);
    } else {
      discountAmount = offer.discountValue;
    }

    const finalTotal = Math.max(0, amount - discountAmount);

    res.status(200).json({
      success: true,
      message: `Coupon '${offer.code}' applied successfully!`,
      data: {
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount,
        finalPrice: finalTotal,
        finalTotal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new promo offer in MongoDB
// @route   POST /api/offers
// @access  Admin
const createOffer = async (req, res) => {
  try {
    const { code, discountType, discountValue, minBookingAmount, description, expiresAt } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Please provide promo code and discount value' });
    }

    const existing = await Offer.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon '${code}' already exists` });
    }

    const newOffer = await Offer.create({
      code: code.toUpperCase().trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : 0,
      description: description || '',
      active: true,
      expiresAt: expiresAt || '2026-12-31'
    });

    res.status(201).json({
      success: true,
      message: `Promo code '${newOffer.code}' created successfully in MongoDB!`,
      data: mapOffer(newOffer)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a promo offer from MongoDB
// @route   DELETE /api/offers/:id
// @access  Admin
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: `Offer with ID ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Offer '${offer.code}' deleted from MongoDB`,
      data: mapOffer(offer)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOffers,
  validateOffer,
  createOffer,
  deleteOffer
};
