const express = require('express');
const router = express.Router();
const {
    getAllMaintenance,
    createMaintenance,
    updateMaintenance,
    updateMaintenanceStatus,
    deleteMaintenance,
    getMaintenanceStats
} = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/maintenance
// @desc    Get all maintenance records
// @access  Private
router.get('/', getAllMaintenance);

// @route   GET /api/maintenance/stats
// @desc    Get maintenance statistics
// @access  Private
router.get('/stats', getMaintenanceStats);

// @route   POST /api/maintenance
// @desc    Create new maintenance record
// @access  Private (Admin/Manager)
router.post('/', roleMiddleware(['admin', 'manager']), createMaintenance);

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance record
// @access  Private (Admin/Manager)
router.put('/:id', roleMiddleware(['admin', 'manager']), updateMaintenance);

// @route   PATCH /api/maintenance/:id/status
// @desc    Update maintenance status
// @access  Private (Admin/Manager/Technician)
router.patch('/:id/status', roleMiddleware(['admin', 'manager', 'technician']), updateMaintenanceStatus);

// @route   DELETE /api/maintenance/:id
// @desc    Delete maintenance record
// @access  Private (Admin only)
router.delete('/:id', roleMiddleware(['admin']), deleteMaintenance);

module.exports = router;
