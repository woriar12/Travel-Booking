const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide destination name'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please provide location'],
    trim: true
  },
  category: {
    type: String,
    default: 'Hills & Nature'
  },
  price: {
    type: Number,
    required: [true, 'Please provide price']
  },
  originalPrice: {
    type: Number,
    default: null
  },
  offerTag: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 4.8
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=1000&auto=format&fit=crop'
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: '3 Days / 2 Nights'
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Destination', destinationSchema);
