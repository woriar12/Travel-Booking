const express = require('express');
const router = express.Router();
const { getDestinations, getDestinationById, createDestination } = require('../controllers/destinationController');

router.get('/', getDestinations);
router.get('/:id', getDestinationById);
router.post('/', createDestination);

module.exports = router;
