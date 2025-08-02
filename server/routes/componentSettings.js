const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');
const Component = require('../models/Component');

/**
 * @route   PATCH /api/component-settings/:componentId/notifications
 * @desc    Update notification settings for a specific component
 * @access  Private
 */
router.patch('/:componentId/notifications', auth, [
    check('lowStockEnabled').optional().isBoolean(),
    check('oldStockEnabled').optional().isBoolean(),
    check('oldStockThreshold').optional().isInt({ min: 1 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const component = await Component.findById(req.params.componentId);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        // Initialize the notificationSettings object if it doesn't exist
        if (!component.notificationSettings) {
            component.notificationSettings = {};
        }

        // Update notification settings
        const { lowStockEnabled, oldStockEnabled, oldStockThreshold } = req.body;

        if (lowStockEnabled !== undefined) {
            component.notificationSettings.lowStockEnabled = lowStockEnabled;
        }

        if (oldStockEnabled !== undefined) {
            component.notificationSettings.oldStockEnabled = oldStockEnabled;
        }

        if (oldStockThreshold !== undefined) {
            component.notificationSettings.oldStockThreshold = oldStockThreshold;
        }

        await component.save();

        res.json({
            msg: 'Notification settings updated',
            notificationSettings: component.notificationSettings
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
