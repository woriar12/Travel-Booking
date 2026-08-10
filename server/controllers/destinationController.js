let destinations = require('../data/destinationsData');

// @desc    Get all destinations (with optional category & search filter)
// @route   GET /api/destinations
// @access  Public
const getDestinations = (req, res) => {
  const { category, search } = req.query;
  let filtered = [...destinations];

  if (category) {
    filtered = filtered.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (search) {
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      d.location.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered
  });
};

// @desc    Get single destination by ID
// @route   GET /api/destinations/:id
// @access  Public
const getDestinationById = (req, res) => {
  const destination = destinations.find(d => d.id === req.params.id);

  if (!destination) {
    return res.status(404).json({
      success: false,
      message: `Destination with ID ${req.params.id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: destination
  });
};

// @desc    Create a new tourist destination
// @route   POST /api/destinations
// @access  Public / Protected
const createDestination = (req, res) => {
  const { name, location, category, price, rating, image, description, duration } = req.body;

  if (!name || !location || !price) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, location, and price for the destination'
    });
  }

  const newDestination = {
    id: String(destinations.length + 1),
    name,
    location,
    category: category || 'General',
    price: Number(price),
    rating: Number(rating) || 4.5,
    image: image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    description: description || '',
    duration: duration || '3 Days / 2 Nights'
  };

  destinations.push(newDestination);

  res.status(201).json({
    success: true,
    message: 'Destination added successfully',
    data: newDestination
  });
};

module.exports = {
  getDestinations,
  getDestinationById,
  createDestination
};
