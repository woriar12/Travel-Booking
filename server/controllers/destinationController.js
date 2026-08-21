const Destination = require('../models/Destination');

// Helper: map MongoDB _id to id for frontend compatibility
const mapDestination = (d) => ({
  id: d._id.toString(),
  _id: d._id.toString(),
  name: d.name,
  location: d.location,
  category: d.category,
  price: d.price,
  originalPrice: d.originalPrice,
  offerTag: d.offerTag,
  rating: d.rating,
  image: d.image,
  description: d.description,
  duration: d.duration,
  isFeatured: d.isFeatured,
  createdAt: d.createdAt
});

// @desc    Get all destinations (with optional category & search filter) from MongoDB
// @route   GET /api/destinations
// @access  Public
const getDestinations = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const destinations = await Destination.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: destinations.length,
      data: destinations.map(mapDestination)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single destination by ID from MongoDB
// @route   GET /api/destinations/:id
// @access  Public
const getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination with ID ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: mapDestination(destination)
    });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Invalid destination ID or not found' });
  }
};

// @desc    Create a new tourist destination in MongoDB
// @route   POST /api/destinations
// @access  Admin
const createDestination = async (req, res) => {
  try {
    const { name, location, category, price, originalPrice, offerTag, rating, image, description, duration } = req.body;

    if (!name || !location || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, location, and price for the destination'
      });
    }

    const newDestination = await Destination.create({
      name: name.trim(),
      location: location.trim(),
      category: category || 'Hills & Nature',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      offerTag: offerTag || '',
      rating: rating ? Number(rating) : 4.8,
      image: image || 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=1000&auto=format&fit=crop',
      description: description || '',
      duration: duration || '3 Days / 2 Nights'
    });

    res.status(201).json({
      success: true,
      message: 'Destination created successfully in MongoDB!',
      data: mapDestination(newDestination)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing destination in MongoDB
// @route   PUT /api/destinations/:id
// @access  Admin
const updateDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination with ID ${req.params.id} not found`
      });
    }

    const updated = await Destination.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name || destination.name,
        location: req.body.location || destination.location,
        category: req.body.category || destination.category,
        price: req.body.price ? Number(req.body.price) : destination.price,
        originalPrice: req.body.originalPrice !== undefined ? (req.body.originalPrice ? Number(req.body.originalPrice) : null) : destination.originalPrice,
        offerTag: req.body.offerTag !== undefined ? req.body.offerTag : destination.offerTag,
        rating: req.body.rating ? Number(req.body.rating) : destination.rating,
        image: req.body.image || destination.image,
        description: req.body.description || destination.description,
        duration: req.body.duration || destination.duration
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully in MongoDB',
      data: mapDestination(updated)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update destination pricing & offer tag in MongoDB
// @route   PATCH /api/destinations/:id/offer
// @access  Admin
const updateDestinationOffer = async (req, res) => {
  try {
    const { price, originalPrice, offerTag } = req.body;
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination with ID ${req.params.id} not found`
      });
    }

    destination.price = price !== undefined && price !== '' ? Number(price) : destination.price;
    destination.originalPrice = originalPrice !== undefined && originalPrice !== '' ? Number(originalPrice) : null;
    destination.offerTag = offerTag !== undefined ? offerTag : destination.offerTag;

    await destination.save();

    res.status(200).json({
      success: true,
      message: `Offer updated for '${destination.name}'`,
      data: mapDestination(destination)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a destination from MongoDB
// @route   DELETE /api/destinations/:id
// @access  Admin
const deleteDestination = async (req, res) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination with ID ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Destination deleted successfully from MongoDB',
      data: mapDestination(destination)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  updateDestinationOffer,
  deleteDestination
};
