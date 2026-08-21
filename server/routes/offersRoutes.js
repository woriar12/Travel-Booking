const express = require('express');
const router = express.Router();
const { getOffers, createOffer, validateOffer, deleteOffer } = require('../controllers/offersController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getOffers);
router.post('/validate', validateOffer);

// Admin-only routes
router.post('/', requireAdmin, createOffer);
router.delete('/:id', requireAdmin, deleteOffer);

module.exports = router;
