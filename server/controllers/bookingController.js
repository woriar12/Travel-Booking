const Booking = require('../models/Booking');
const Destination = require('../models/Destination');

// Helper: map Mongoose Booking to frontend structure
const mapBooking = (b) => ({
  id: b._id.toString(),
  _id: b._id.toString(),
  user: b.user ? (b.user._id ? b.user._id.toString() : b.user.toString()) : null,
  userName: b.userName,
  userEmail: b.userEmail,
  destination: b.destinationDetails || (b.destination ? {
    id: b.destination._id ? b.destination._id.toString() : b.destination.toString(),
    name: b.destination.name || 'Tour Destination',
    location: b.destination.location || 'India',
    pricePerPerson: b.destination.price || 0
  } : { name: 'Tour Destination', location: 'India' }),
  travelDate: b.travelDate,
  numberOfGuests: b.numberOfGuests,
  contactNumber: b.contactNumber,
  rawTotal: b.rawTotal,
  discountAmount: b.discountAmount,
  promoCodeApplied: b.promoCodeApplied,
  totalPrice: b.totalPrice,
  status: b.status,
  bookedAt: b.bookedAt
});

// @desc    Create a new tour booking in MongoDB (Bound to authenticated session user)
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
      status: 'Confirmed',
      bookedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Tour booked successfully in MongoDB!',
      data: mapBooking(newBooking)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings (Admin gets all, User gets only their own bookings)
// @route   GET /api/bookings
// @access  Authenticated User / Admin
const getUserBookings = async (req, res) => {
  try {
    const user = req.currentUser;
    
    // If not authenticated, return empty list gracefully (no 401 error)
    if (!user && (!req.session || !req.session.userId)) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const userId = user ? (user._id || user.id) : req.session.userId;
    const userRole = user ? user.role : req.session.role;
    const userEmail = user ? (user.email || '').toLowerCase().trim() : '';
    let filter = {};

    // Strict ownership: Normal USER sees ONLY their own bookings (matched by userId OR email)
    if (userRole !== 'ADMIN') {
      const orConditions = [{ user: userId }];
      if (userEmail) {
        orConditions.push({ userEmail: new RegExp(`^${userEmail}$`, 'i') });
      }
      filter = { $or: orConditions };
    }

    const bookings = await Booking.find(filter).populate('destination').sort({ bookedAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(mapBooking)
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
    const activeBookings = await Booking.find({ status: { $ne: 'Cancelled' } });
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const statusCounts = {
      Confirmed: await Booking.countDocuments({ status: 'Confirmed' }),
      Completed: await Booking.countDocuments({ status: 'Completed' }),
      Cancelled: await Booking.countDocuments({ status: 'Cancelled' })
    };

    const recentBookings = await Booking.find().sort({ bookedAt: -1 }).limit(5);

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

// @desc    Update booking status in MongoDB (Confirmed, Completed, Cancelled)
// @route   PATCH /api/bookings/:id/status
// @access  Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be Confirmed, Completed, or Cancelled'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking with ID ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} in MongoDB`,
      data: mapBooking(booking)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingStats,
  updateBookingStatus
};
