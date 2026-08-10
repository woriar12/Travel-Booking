const destinations = require('../data/destinationsData');

const bookings = [];

// @desc    Create a new tour booking (Public - No Token Required)
// @route   POST /api/bookings
// @access  Public
const createBooking = (req, res) => {
  const { destinationId, travelDate, numberOfGuests, contactNumber, userName, userEmail } = req.body;

  if (!destinationId || !travelDate || !numberOfGuests) {
    return res.status(400).json({
      success: false,
      message: 'Please provide destinationId, travelDate, and numberOfGuests'
    });
  }

  const destination = destinations.find(d => d.id === String(destinationId));
  if (!destination) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found'
    });
  }

  const totalPrice = destination.price * Number(numberOfGuests);

  const newBooking = {
    id: `BK-${Date.now()}`,
    userName: userName || req.user?.name || 'Guest User',
    userEmail: userEmail || req.user?.email || 'guest@example.com',
    destination: {
      id: destination.id,
      name: destination.name,
      location: destination.location,
      pricePerPerson: destination.price
    },
    travelDate,
    numberOfGuests: Number(numberOfGuests),
    contactNumber: contactNumber || 'Not provided',
    totalPrice,
    status: 'Confirmed',
    bookedAt: new Date()
  };

  bookings.push(newBooking);

  res.status(201).json({
    success: true,
    message: 'Tour booked successfully!',
    data: newBooking
  });
};

// @desc    Get all tour bookings (Public - No Token Required)
// @route   GET /api/bookings
// @access  Public
const getUserBookings = (req, res) => {
  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
};

module.exports = {
  createBooking,
  getUserBookings
};
