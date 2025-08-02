const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, userOrAdmin } = require('../middleware/roleMiddleware');
const { validateComponent, validateQuantityUpdate } = require('../middleware/validation');
const componentController = require('../controllers/componentController');

// @route   GET /api/components
// @desc    Get all components with filtering and pagination
// @access  Private
router.get('/', authMiddleware, componentController.getAll);

// @route   GET /api/components/stats
// @desc    Get component statistics
// @access  Private
router.get('/stats', authMiddleware, componentController.getStats);

// @route   GET /api/components/categories
// @desc    Get all component categories
// @access  Private
router.get('/categories', authMiddleware, componentController.getCategories);

// @route   GET /api/components/locations
// @desc    Get all component locations
// @access  Private
router.get('/locations', authMiddleware, componentController.getLocations);

// @route   GET /api/components/low-stock
// @desc    Get low stock components
// @access  Private
router.get('/low-stock', authMiddleware, componentController.getLowStock);

// @route   GET /api/components/:id
// @desc    Get component by ID
// @access  Private
router.get('/:id', authMiddleware, componentController.getById);

// @route   POST /api/components
// @desc    Create new component
// @access  Private/Admin
router.post('/', authMiddleware, adminOnly, validateComponent, componentController.create);

// @route   PUT /api/components/:id
// @desc    Update component
// @access  Private/Admin
router.put('/:id', authMiddleware, adminOnly, componentController.update);

// @route   PUT /api/components/:id/quantity
// @desc    Update component quantity (stock in/out)
// @access  Private
router.put('/:id/quantity', authMiddleware, userOrAdmin, validateQuantityUpdate, componentController.updateQuantity);

// @route   DELETE /api/components/:id
// @desc    Delete component (soft delete)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminOnly, componentController.delete);

module.exports = router;