const express = require('express');
const router = express.Router();
const {
    getAllReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    getUserReservations,
    checkComponentAvailability
} = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Private
router.get('/', getAllReservations);

// @route   GET /api/reservations/user
// @desc    Get current user's reservations
// @access  Private
router.get('/user', getUserReservations);

// @route   GET /api/reservations/availability/:componentId
// @desc    Check component availability
// @access  Private
router.get('/availability/:componentId', checkComponentAvailability);

// @route   POST /api/reservations
// @desc    Create new reservation
// @access  Private
router.post('/', createReservation);

// @route   PUT /api/reservations/:id
// @desc    Update reservation
// @access  Private
router.put('/:id', updateReservation);

// @route   DELETE /api/reservations/:id
// @desc    Delete reservation
// @access  Private (Admin/Manager or reservation owner)
router.delete('/:id', deleteReservation);

module.exports = router;
