const express = require('express');
const router = express.Router();
const { 
  getDestinations, 
  getDestinationById, 
  createDestination,
  updateDestination,
  updateDestinationOffer,
  deleteDestination 
} = require('../controllers/destinationController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getDestinations);
router.get('/:id', getDestinationById);

// Admin-only routes
router.post('/', requireAdmin, createDestination);
router.put('/:id', requireAdmin, updateDestination);
router.patch('/:id/offer', requireAdmin, updateDestinationOffer);
router.delete('/:id', requireAdmin, deleteDestination);

module.exports = router;
