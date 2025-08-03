const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

/**
 * @route   GET /api/dashboard/monthly-movement
 * @desc    Get monthly inward and outward statistics
 * @access  Private
 */
router.get('/monthly-movement', auth, dashboardController.getMonthlyMovement);

/**
 * @route   GET /api/dashboard/critical-components
 * @desc    Get critical components (low stock and old stock)
 * @access  Private
 */
router.get('/critical-components', auth, dashboardController.getCriticalComponents);

module.exports = router;
