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
        // Get components that are low on stock
        const lowStockComponents = await Component.find({
            $expr: { $lte: ['$quantity', '$minThreshold'] }
        });

        for (const component of lowStockComponents) {
            // Check if we already sent a notification for this component in the last 24 hours
            const existingNotification = await Notification.findOne({
                type: 'low_stock',
                'data.componentId': component._id,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            if (!existingNotification) {
                // Send notification to all admin users
                const adminUsers = await require('../models/User').find({ role: 'Admin' });

                for (const admin of adminUsers) {
                    await exports.createNotification(
                        admin._id,
                        'low_stock',
                        'Low Stock Alert',
                        `${component.name} (${component.partNumber}) is running low. Current stock: ${component.quantity}, Minimum threshold: ${component.minThreshold}`,
                        { componentId: component._id, currentStock: component.quantity },
                        'high'
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

// Run all notification checks
exports.runNotificationChecks = async () => {
    await exports.checkLowStockAlerts();
    await exports.checkMaintenanceDueAlerts();
    await exports.checkReservationReminders();
};
