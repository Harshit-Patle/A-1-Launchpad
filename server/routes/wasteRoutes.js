const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { roleMiddleware, adminOnly } = require('../middleware/roleMiddleware');
const { check, validationResult } = require('express-validator');
const WasteEntry = require('../models/WasteEntry');

/**
 * @route   GET /api/waste
 * @desc    Get all waste entries
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const entries = await WasteEntry.find()
            .populate('componentId', 'name partNumber')
            .populate('disposedBy', 'name email')
            .sort({ disposalDate: -1 });

        res.json(entries);
    } catch (err) {
        console.error('Error retrieving waste entries:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @route   POST /api/waste
 * @desc    Create a new waste entry
 * @access  Private
 */
router.post('/', [
    auth,
    [
        check('componentName', 'Component name is required').not().isEmpty(),
        check('quantity', 'Quantity must be a positive number').isNumeric().custom(value => value > 0),
        check('unit', 'Unit is required').isIn(['g', 'kg', 'ml', 'l', 'pcs', 'container']),
        check('wasteType', 'Waste type is required').isIn(['Chemical', 'Biological', 'Radioactive', 'Sharps', 'Electronic', 'Glass', 'Mixed', 'Other']),
        check('hazardLevel', 'Hazard level is required').isIn(['low', 'medium', 'high', 'extreme']),
        check('disposalMethod', 'Disposal method is required').isIn(['Incineration', 'Neutralization', 'Recycling', 'Landfill', 'Special Disposal', 'External Vendor'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { componentId, componentName, quantity, unit, wasteType, hazardLevel, disposalMethod, containerCode, notes } = req.body;

        const newEntry = new WasteEntry({
            componentId,
            componentName,
            quantity,
            unit,
            wasteType,
            hazardLevel,
            disposalMethod,
            containerCode,
            notes,
            disposedBy: req.user.id,
            disposalDate: Date.now(),
            isCompliant: true
        });

        const savedEntry = await newEntry.save();

        // Populate user and component info before returning
        await savedEntry
            .populate('componentId', 'name partNumber')
            .populate('disposedBy', 'name email');

        res.json(savedEntry);
    } catch (err) {
        console.error('Error creating waste entry:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @route   GET /api/waste/reports/summary
 * @desc    Get waste disposal summary statistics
 * @access  Private
 */
router.get('/reports/summary', auth, async (req, res) => {
    try {
        // Get total waste entries count
        const totalEntries = await WasteEntry.countDocuments();

        // Get total quantity disposed
        const quantityResult = await WasteEntry.aggregate([
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const totalQuantity = quantityResult.length > 0 ? quantityResult[0].total : 0;

        // Get disposal methods breakdown
        const methodBreakdown = await WasteEntry.aggregate([
            { $group: { _id: '$disposalMethod', count: { $sum: 1 } } }
        ]);

        // Get waste type breakdown
        const wasteTypeBreakdown = await WasteEntry.aggregate([
            { $group: { _id: '$wasteType', count: { $sum: 1 } } }
        ]);

        res.json({
            totalEntries,
            totalQuantity,
            methodBreakdown,
            wasteTypeBreakdown
        });
    } catch (err) {
        console.error('Error generating waste summary report:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @route   GET /api/waste/:id
 * @desc    Get a specific waste entry
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const entry = await WasteEntry.findById(req.params.id)
            .populate('componentId', 'name partNumber')
            .populate('disposedBy', 'name email');

        if (!entry) {
            return res.status(404).json({ msg: 'Waste entry not found' });
        }

        res.json(entry);
    } catch (err) {
        console.error('Error retrieving waste entry:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Waste entry not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @route   DELETE /api/waste/:id
 * @desc    Delete a waste entry
 * @access  Private (Admin only)
 */
router.delete('/:id', [auth, adminOnly], async (req, res) => {
    try {
        const entry = await WasteEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ msg: 'Waste entry not found' });
        }

        await entry.deleteOne();

        res.json({ msg: 'Waste entry removed' });
    } catch (err) {
        console.error('Error deleting waste entry:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Waste entry not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});
router.get('/reports/summary', auth, async (req, res) => {
    try {
        // Get total waste entries count
        const totalEntries = await WasteEntry.countDocuments();

        // Get total quantity disposed
        const quantityResult = await WasteEntry.aggregate([
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const totalQuantity = quantityResult.length > 0 ? quantityResult[0].total : 0;

        // Get disposal methods breakdown
        const methodBreakdown = await WasteEntry.aggregate([
            { $group: { _id: '$disposalMethod', count: { $sum: 1 } } }
        ]);

        // Get reason breakdown
        const reasonBreakdown = await WasteEntry.aggregate([
            { $group: { _id: '$reason', count: { $sum: 1 } } }
        ]);

        res.json({
            totalEntries,
            totalQuantity,
            methodBreakdown,
            reasonBreakdown
        });
    } catch (err) {
        console.error('Error generating waste summary report:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @route   GET /api/waste/statistics/summary
 * @desc    Get waste statistics summary for dashboard
 * @access  Private
 */
router.get('/statistics/summary', auth, async (req, res) => {
    try {
        // Get total waste entries count
        const totalEntries = await WasteEntry.countDocuments();

        // Count high hazard items
        const highHazardCount = await WasteEntry.countDocuments({ hazardLevel: { $in: ['high', 'extreme'] } });

        // Group by waste type
        const wasteTypes = await WasteEntry.aggregate([
            { $group: { _id: '$wasteType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Group by disposal method
        const disposalMethods = await WasteEntry.aggregate([
            { $group: { _id: '$disposalMethod', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Group by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrends = await WasteEntry.aggregate([
            {
                $match: {
                    disposalDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$disposalDate' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Get total waste quantity by unit
        const quantityByUnit = await WasteEntry.aggregate([
            {
                $group: {
                    _id: '$unit',
                    totalQuantity: { $sum: '$quantity' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalEntries,
            highHazardCount,
            wasteTypes,
            disposalMethods,
            monthlyTrends,
            quantityByUnit,
            lastUpdated: new Date()
        });
    } catch (err) {
        console.error('Error generating waste statistics:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
