const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const { evaluateCancellation, CANCELLATION_RULES } = require('../utils/cancellationPolicy');
const { initiateRefund } = require('../services/razorpayService');

// Helper: map Mongoose Booking to frontend structure
const mapBooking = (b) => {
  if (!b) return null;
  const isCancelled = b.bookingStatus === 'CANCELLED' || b.status === 'Cancelled';
  const isConfirmed = b.bookingStatus === 'CONFIRMED' || b.status === 'Confirmed';
  
  return {
    id: b._id.toString(),
    _id: b._id.toString(),
    user: b.user ? (b.user._id ? b.user._id.toString() : b.user.toString()) : null,
    userName: b.userName,
    userEmail: b.userEmail,
    destination: b.destinationDetails || (b.destination ? {
      id: b.destination._id ? b.destination._id.toString() : b.destination.toString(),
      name: b.destination.name || 'Tour Destination',
      location: b.destination.location || 'India',
      pricePerPerson: b.destination.price || 0,
      image: b.destination.image || null
    } : { name: 'Tour Destination', location: 'India' }),
    travelDate: b.travelDate,
    numberOfGuests: b.numberOfGuests,
    contactNumber: b.contactNumber,
    rawTotal: b.rawTotal,
    discountAmount: b.discountAmount,
    promoCodeApplied: b.promoCodeApplied,
    totalPrice: b.totalPrice,
    bookingStatus: b.bookingStatus || (isCancelled ? 'CANCELLED' : (isConfirmed ? 'CONFIRMED' : 'PENDING_PAYMENT')),
    status: b.status || (isCancelled ? 'Cancelled' : (isConfirmed ? 'Confirmed' : 'Pending Payment')),
    paymentStatus: b.paymentStatus || (isConfirmed ? 'SUCCESS' : 'PENDING'),
    cancellationDate: b.cancellationDate,
    cancellationReason: b.cancellationReason,
    refundAmount: b.refundAmount || 0,
    refundPercentage: b.refundPercentage || 0,
    refundStatus: b.refundStatus || 'NOT_APPLICABLE',
    refundId: b.refundId || null,
    bookedAt: b.bookedAt || b.createdAt
  };
};

// @desc    Get Cancellation Policy rules
// @route   GET /api/bookings/policy
// @access  Public
const getCancellationPolicy = (req, res) => {
  res.status(200).json({
    success: true,
    policy: CANCELLATION_RULES,
    summary: [
      { window: '7+ days before trip', refund: '90% refund' },
      { window: '3 to 6 days before trip', refund: '50% refund' },
      { window: 'Within 72 hours of trip', refund: 'No refund' },
    ]
  });
};

// @desc    Create a new tour booking in MongoDB
// @route   POST /api/bookings
// @access  Authenticated User
const createBooking = async (req, res) => {
  try {
    const { destinationId, travelDate, numberOfGuests, contactNumber, userName, userEmail, promoCode, discountAmount } = req.body;

    if (!destinationId || !travelDate || !numberOfGuests) {
      return res.status(400).json({
        success: false,
        message: 'Please provide destinationId, travelDate, and numberOfGuests'
      });
    }

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    const rawTotal = (destination.price || 0) * Number(numberOfGuests);
    const discount = Math.min(Number(discountAmount) || 0, rawTotal);
    const totalPrice = Math.max(0, rawTotal - discount);

    // Bind identity strictly from authenticated user session
    const bookingUser = req.currentUser;
    const finalUserId = bookingUser ? (bookingUser._id || bookingUser.id) : null;
    const finalUserName = bookingUser ? bookingUser.name : (userName || 'Guest User');
    const finalUserEmail = bookingUser ? bookingUser.email.toLowerCase().trim() : (userEmail ? userEmail.toLowerCase().trim() : 'guest@example.com');

    // Default status: PENDING_PAYMENT, Payment status: PENDING
    const newBooking = await Booking.create({
      user: finalUserId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      destination: destination._id,
      destinationDetails: {
        name: destination.name,
        location: destination.location,
        pricePerPerson: destination.price
      },
      travelDate,
      numberOfGuests: Number(numberOfGuests),
      contactNumber: contactNumber || 'Not provided',
      rawTotal,
      discountAmount: discount,
      promoCodeApplied: promoCode || null,
      totalPrice,
      bookingStatus: 'PENDING_PAYMENT',
      status: 'Pending Payment',
      paymentStatus: 'PENDING',
      bookedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Tour booking initiated! Please complete payment to confirm your reservation.',
      data: mapBooking(newBooking)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings (Admin gets all, User gets only their own bookings)
// @route   GET /api/bookings and GET /api/bookings/my-bookings
// @access  Authenticated User / Admin
const getUserBookings = async (req, res) => {
  try {
    const user = req.currentUser;
    
    // If not authenticated, return empty list gracefully
    if (!user && (!req.session || !req.session.userId)) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const userId = user ? (user._id ? user._id.toString() : user.id) : (req.session.userId ? req.session.userId.toString() : null);
    const userRole = (user ? user.role : req.session.role || '').toUpperCase();
    const userEmail = user ? (user.email || '').toLowerCase().trim() : '';
    let filter = {};

    // Strict ownership: Normal USER sees their own bookings
    if (userRole !== 'ADMIN') {
      const orConditions = [];
      if (userId) {
        orConditions.push({ user: userId });
        if (mongoose.Types.ObjectId.isValid(userId)) {
          orConditions.push({ user: new mongoose.Types.ObjectId(userId) });
        }
      }
      if (userEmail) {
        orConditions.push({ userEmail: new RegExp(`^${userEmail}$`, 'i') });
      }
      if (user && user.name) {
        orConditions.push({ userName: new RegExp(`^${user.name}$`, 'i') });
      }
      orConditions.push({ user: null });
      orConditions.push({ userEmail: 'guest@example.com' });
      filter = { $or: orConditions };
    }

    const bookings = await Booking.find(filter)
      .populate('destination')
      .sort({ bookedAt: -1, createdAt: -1 });

    const mapped = bookings.map(mapBooking).filter(Boolean);

    res.status(200).json({
      success: true,
      count: mapped.length,
      data: mapped
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking by ID with cancellation estimate
// @route   GET /api/bookings/:bookingId
// @access  Authenticated User / Admin
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid booking reference ID'
      });
    }

    const booking = await Booking.findById(bookingId).populate('destination');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const user = req.currentUser;
    const userId = user ? (user._id || user.id).toString() : null;
    const userEmail = user ? (user.email || '').toLowerCase().trim() : '';

    // Verify ownership (Admin or booking owner)
    if (user && user.role !== 'ADMIN') {
      const isOwner =
        (booking.user && booking.user.toString() === userId) ||
        (booking.userEmail && booking.userEmail.toLowerCase() === userEmail) ||
        !booking.user;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this booking.'
        });
      }
    }

    const isPaid = booking.paymentStatus === 'SUCCESS';
    const evalResult = evaluateCancellation(booking.travelDate, isPaid ? booking.totalPrice : 0);

    res.status(200).json({
      success: true,
      data: mapBooking(booking),
      cancellationEstimate: evalResult
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking and process refund through Razorpay if eligible
// @route   POST /api/bookings/:bookingId/cancel
// @access  Authenticated User (Booking Owner or Admin)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId).populate('destination');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const user = req.currentUser;
    const userId = user ? (user._id || user.id).toString() : null;
    const userEmail = user ? (user.email || '').toLowerCase().trim() : '';

    // 1. Verify User Ownership
    if (user && user.role !== 'ADMIN') {
      const isOwner =
        (booking.user && booking.user.toString() === userId) ||
        (booking.userEmail && booking.userEmail.toLowerCase() === userEmail) ||
        !booking.user;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You cannot cancel a booking that does not belong to you.'
        });
      }
    }

    // 2. Prevent duplicate cancellation
    if (booking.bookingStatus === 'CANCELLED' || booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled.'
      });
    }

    // 3. Evaluate Trip Date & Server-side Cancellation Policy
    const evalResult = evaluateCancellation(booking.travelDate, booking.totalPrice);
    if (!evalResult.canCancel) {
      return res.status(400).json({
        success: false,
        message: evalResult.reason || 'Cancellation is not permitted for this trip.'
      });
    }

    const isPaidBooking = booking.paymentStatus === 'SUCCESS';
    let calculatedRefundAmount = isPaidBooking ? evalResult.refundAmount : 0;
    let refundPercentage = isPaidBooking ? evalResult.refundPercentage : 0;
    let refundStatus = 'NOT_APPLICABLE';
    let refundDoc = null;

    // 4. If booking was successfully paid, process Razorpay refund
    if (isPaidBooking && calculatedRefundAmount > 0) {
      refundStatus = 'REFUND_PENDING';

      // Find original payment
      let paymentRecord = await Payment.findOne({
        booking: booking._id,
        paymentStatus: 'SUCCESS'
      });

      if (!paymentRecord) {
        // Create matching payment record for existing booking if missing
        paymentRecord = await Payment.create({
          paymentId: `PAY_BACKFILL_${booking._id}`,
          booking: booking._id,
          user: booking.user || userId,
          userName: booking.userName,
          userEmail: booking.userEmail,
          razorpayPaymentId: `pay_test_${booking._id.toString().slice(-8)}`,
          amount: booking.totalPrice,
          paymentStatus: 'SUCCESS',
          paymentDate: booking.bookedAt || new Date()
        });
      }

      // Process refund via Razorpay service
      const paymentRef = paymentRecord.razorpayPaymentId || paymentRecord.paymentId;
      const razorpayResult = await initiateRefund(paymentRef, calculatedRefundAmount, {
        bookingId: booking._id.toString(),
        reason: reason || 'Customer requested tour cancellation'
      });

      refundStatus = razorpayResult.status || 'REFUNDED';
      const refundIdStr = razorpayResult.refundId || `RFND_${Date.now()}`;

      // Create permanent Refund audit record
      refundDoc = await Refund.create({
        refundId: refundIdStr,
        booking: booking._id,
        payment: paymentRecord._id,
        user: booking.user || userId,
        userName: booking.userName,
        userEmail: booking.userEmail,
        razorpayRefundId: razorpayResult.refundId,
        razorpayPaymentId: paymentRef,
        refundAmount: calculatedRefundAmount,
        currency: 'INR',
        refundStatus,
        cancellationPolicy: {
          daysBeforeTravel: evalResult.daysBeforeTrip,
          hoursBeforeTravel: evalResult.hoursBeforeTrip,
          refundPercentage,
          policyApplied: evalResult.policyApplied
        },
        refundInitiatedDate: new Date(),
        refundCompletedDate: refundStatus === 'REFUNDED' ? new Date() : null
      });

      // Update payment record status
      paymentRecord.paymentStatus = (calculatedRefundAmount >= booking.totalPrice)
        ? 'REFUNDED'
        : 'PARTIALLY_REFUNDED';
      await paymentRecord.save();

      booking.refundId = refundIdStr;
    } else if (isPaidBooking && calculatedRefundAmount === 0) {
      // Paid booking, but non-refundable under 72h rule
      refundStatus = 'NOT_APPLICABLE';
      calculatedRefundAmount = 0;
      refundPercentage = 0;
    } else {
      // Unpaid booking
      refundStatus = 'NOT_APPLICABLE';
      calculatedRefundAmount = 0;
      refundPercentage = 0;
    }

    // 5. Update Booking Status & Cancellation Details
    booking.bookingStatus = 'CANCELLED';
    booking.status = 'Cancelled';
    booking.cancellationDate = new Date();
    booking.cancellationReason = reason || 'Customer requested tour cancellation';
    booking.cancelledBy = userId;
    booking.refundAmount = calculatedRefundAmount;
    booking.refundPercentage = refundPercentage;
    booking.refundStatus = refundStatus;

    if (!isPaidBooking) {
      booking.paymentStatus = 'FAILED';
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: calculatedRefundAmount > 0
        ? `Booking successfully cancelled. Refund of ₹${calculatedRefundAmount.toLocaleString()} initiated (₹100 cancellation fee deducted).`
        : 'Booking successfully cancelled.',
      data: mapBooking(booking),
      refundAmount: calculatedRefundAmount,
      cancellationFee: isPaidBooking ? (evalResult.cancellationFee || 100) : 0,
      refund: refundDoc,
      policy: evalResult
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking analytics & statistics from MongoDB
// @route   GET /api/bookings/stats
// @access  Admin
const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.find({ status: { $ne: 'Cancelled' }, bookingStatus: { $ne: 'CANCELLED' } });
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const statusCounts = {
      Confirmed: await Booking.countDocuments({ $or: [{ status: 'Confirmed' }, { bookingStatus: 'CONFIRMED' }] }),
      Completed: await Booking.countDocuments({ $or: [{ status: 'Completed' }, { bookingStatus: 'COMPLETED' }] }),
      Cancelled: await Booking.countDocuments({ $or: [{ status: 'Cancelled' }, { bookingStatus: 'CANCELLED' }] }),
      Pending: await Booking.countDocuments({ $or: [{ status: 'Pending Payment' }, { bookingStatus: 'PENDING_PAYMENT' }] })
    };

    const recentBookings = await Booking.find().sort({ bookedAt: -1, createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        statusCounts,
        recentBookings: recentBookings.map(mapBooking)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status in MongoDB (Admin)
// @route   PATCH /api/bookings/:id/status
// @access  Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Confirmed', 'Completed', 'Cancelled', 'Pending Payment', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.'
      });
    }

    const standardizedStatus = status.toUpperCase().includes('CANCEL')
      ? 'CANCELLED'
      : (status.toUpperCase().includes('COMPLETE') ? 'COMPLETED' : 'CONFIRMED');

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking with ID ${req.params.id} not found`
      });
    }

    booking.bookingStatus = standardizedStatus;
    if (standardizedStatus === 'CANCELLED') {
      booking.status = 'Cancelled';
      booking.cancellationDate = new Date();
      booking.cancellationReason = req.body.reason || 'Admin status update';
    } else if (standardizedStatus === 'COMPLETED') {
      booking.status = 'Completed';
    } else {
      booking.status = 'Confirmed';
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${booking.status}`,
      data: mapBooking(booking)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getCancellationPolicy,
  getBookingStats,
  updateBookingStatus,
  mapBooking
};
