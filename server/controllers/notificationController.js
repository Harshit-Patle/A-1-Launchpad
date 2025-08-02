const Notification = require('../models/Notification');
const Component = require('../models/Component');
const Maintenance = require('../models/Maintenance');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, isRead, type } = req.query;

        const filter = { userId: req.user.id };
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (type) filter.type = type;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false
        });

        res.json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            unreadCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({ msg: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        await Notification.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create notification (internal use)
exports.createNotification = async (userId, type, title, message, data = null, priority = 'medium') => {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            data,
            priority
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Check and send low stock alerts
exports.checkLowStockAlerts = async () => {
    try {
        // Get components that are low on stock based on their criticalLow value
        const lowStockComponents = await Component.find({
            $expr: { $lte: ['$quantity', '$criticalLow'] },
            quantity: { $gt: 0 } // Only alert if stock is low but not zero
        });

        // Get components that are completely out of stock
        const outOfStockComponents = await Component.find({
            quantity: 0,
            isActive: true
        });

        // Process low stock components
        for (const component of lowStockComponents) {
            // Check if we already sent a notification for this component in the last 24 hours
            const existingNotification = await Notification.findOne({
                type: 'low_stock',
                'data.componentId': component._id,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            if (!existingNotification) {
                // Calculate how close to criticalLow the component is
                const percentageOfThreshold = (component.quantity / component.criticalLow) * 100;
                const priority = percentageOfThreshold <= 50 ? 'high' : 'medium';

                // Send notification to all admin users and inventory managers
                const users = await require('../models/User').find({
                    role: { $in: ['Admin', 'Manager'] }
                });

                for (const user of users) {
                    await exports.createNotification(
                        user._id,
                        'low_stock',
                        'Low Stock Alert',
                        `${component.name} (${component.partNumber}) is running low. Current stock: ${component.quantity}, Critical threshold: ${component.criticalLow}`,
                        {
                            componentId: component._id,
                            currentStock: component.quantity,
                            criticalLow: component.criticalLow,
                            percentageOfThreshold: percentageOfThreshold.toFixed(1)
                        },
                        priority
                    );
                }
            }
        }

        // Process out of stock components
        for (const component of outOfStockComponents) {
            // Check if we already sent a notification for this component in the last 24 hours
            const existingNotification = await Notification.findOne({
                type: 'low_stock',
                'data.componentId': component._id,
                'data.outOfStock': true,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            if (!existingNotification) {
                // Send notification to all admin users and inventory managers
                const users = await require('../models/User').find({
                    role: { $in: ['Admin', 'Manager'] }
                });

                for (const user of users) {
                    await exports.createNotification(
                        user._id,
                        'low_stock',
                        'Out of Stock Alert',
                        `${component.name} (${component.partNumber}) is completely out of stock and needs to be reordered immediately.`,
                        {
                            componentId: component._id,
                            currentStock: 0,
                            outOfStock: true
                        },
                        'critical'
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error checking low stock alerts:', error);
    }
};

// Check and send maintenance due alerts
exports.checkMaintenanceDueAlerts = async () => {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Get maintenance that's due in the next 3 days
        const upcomingMaintenance = await Maintenance.find({
            status: 'scheduled',
            scheduledDate: { $gte: now, $lte: threeDaysFromNow }
        }).populate('equipmentId', 'name');

        for (const maintenance of upcomingMaintenance) {
            // Check if we already sent a notification for this maintenance
            const existingNotification = await Notification.findOne({
                type: 'maintenance_due',
                'data.maintenanceId': maintenance._id
            });

            if (!existingNotification) {
                // Send notification to maintenance team and admins
                const users = await require('../models/User').find({
                    $or: [
                        { role: 'Admin' },
                        { role: 'Manager' },
                        { department: 'Maintenance' }
                    ]
                });

                for (const user of users) {
                    await exports.createNotification(
                        user._id,
                        'maintenance_due',
                        'Maintenance Due Soon',
                        `Maintenance for ${maintenance.equipmentName} is scheduled for ${maintenance.scheduledDate.toLocaleDateString()}`,
                        { maintenanceId: maintenance._id },
                        'medium'
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error checking maintenance due alerts:', error);
    }
};

// Check and send reservation reminders
exports.checkReservationReminders = async () => {
    try {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get reservations starting tomorrow
        const upcomingReservations = await require('../models/Reservation').find({
            status: 'active',
            startDate: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) }
        }).populate('componentId', 'name');

        for (const reservation of upcomingReservations) {
            // Check if we already sent a reminder for this reservation
            const existingNotification = await Notification.findOne({
                type: 'reservation_reminder',
                'data.reservationId': reservation._id
            });

            if (!existingNotification) {
                await exports.createNotification(
                    reservation.userId,
                    'reservation_reminder',
                    'Reservation Reminder',
                    `Your reservation for ${reservation.componentName} starts tomorrow`,
                    { reservationId: reservation._id },
                    'medium'
                );
            }
        }
    } catch (error) {
        console.error('Error checking reservation reminders:', error);
    }
};

// Check and send old stock alerts for items that haven't moved in 3+ months
exports.checkOldStockAlerts = async () => {
    try {
        // Find components that haven't had any movement (inward or outward) based on their individual thresholds
        const components = await Component.find({
            quantity: { $gt: 0 },
            "notificationSettings.oldStockEnabled": { $ne: false }, // Only check components with old stock alerts enabled
            isActive: true
        });

        const oldStockComponents = [];

        // Filter components based on their individual oldStockThreshold or default 90 days
        for (const component of components) {
            const threshold = component.notificationSettings?.oldStockThreshold || 90; // Default 90 days if not specified
            const thresholdDate = new Date();
            thresholdDate.setDate(thresholdDate.getDate() - threshold);

            // Check if the last movement date is older than the threshold
            if (component.lastMovementDate && component.lastMovementDate < thresholdDate) {
                oldStockComponents.push(component);
            }
        }

        for (const component of oldStockComponents) {
            // Calculate how long the component has been unused
            const daysSinceLastMovement = Math.floor((Date.now() - new Date(component.lastMovementDate)) / (1000 * 60 * 60 * 24));
            const threshold = component.notificationSettings?.oldStockThreshold || 90;

            // Check if we already sent a notification for this component in the last 7 days
            const existingNotification = await Notification.findOne({
                type: 'old_stock',
                'data.componentId': component._id,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            if (!existingNotification) {
                // Calculate the priority based on how far past the threshold we are
                let priority = 'medium';
                if (daysSinceLastMovement > threshold * 2) {
                    priority = 'high';
                }

                // Send notification to all admin users and inventory managers
                const users = await require('../models/User').find({
                    role: { $in: ['Admin', 'Manager'] }
                });

                for (const user of users) {
                    await exports.createNotification(
                        user._id,
                        'old_stock',
                        'Old Stock Alert',
                        `${component.name} (${component.partNumber}) has not been used for ${daysSinceLastMovement} days. Current stock: ${component.quantity}`,
                        {
                            componentId: component._id,
                            currentStock: component.quantity,
                            daysSinceLastMovement,
                            lastMovementDate: component.lastMovementDate,
                            threshold: threshold,
                            daysOverThreshold: daysSinceLastMovement - threshold,
                            totalValue: component.unitPrice * component.quantity
                        },
                        priority
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error checking old stock alerts:', error);
    }
};

// Run all notification checks
exports.runNotificationChecks = async () => {
    await exports.checkLowStockAlerts();
    await exports.checkMaintenanceDueAlerts();
    await exports.checkReservationReminders();
    await exports.checkOldStockAlerts();
};
