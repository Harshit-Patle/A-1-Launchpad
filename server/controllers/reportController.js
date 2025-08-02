const Component = require('../models/Component');
const Reservation = require('../models/Reservation');
const Maintenance = require('../models/Maintenance');
const Log = require('../models/Log');

// Generate inventory report
exports.generateInventoryReport = async (req, res) => {
    try {
        const { startDate, endDate, category, location } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (location) filter.location = location;

        const components = await Component.find(filter).sort({ name: 1 });

        // Calculate statistics
        const totalComponents = components.length;
        const totalValue = components.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);
        const lowStockItems = components.filter(comp => comp.quantity <= comp.minThreshold).length;
        const outOfStockItems = components.filter(comp => comp.quantity === 0).length;

        // Category breakdown
        const categoryStats = {};
        components.forEach(comp => {
            if (!categoryStats[comp.category]) {
                categoryStats[comp.category] = { count: 0, value: 0 };
            }
            categoryStats[comp.category].count++;
            categoryStats[comp.category].value += comp.price * comp.quantity;
        });

        res.json({
            summary: {
                totalComponents,
                totalValue,
                lowStockItems,
                outOfStockItems,
                reportDate: new Date()
            },
            components,
            categoryStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Generate usage report
exports.generateUsageReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Get usage logs
        const logs = await Log.find({
            ...dateFilter,
            action: { $in: ['component_reserved', 'component_checked_out', 'component_used'] }
        }).populate('userId', 'name').populate('componentId', 'name category');

        // Most used components
        const componentUsage = {};
        logs.forEach(log => {
            if (log.componentId) {
                const id = log.componentId._id.toString();
                if (!componentUsage[id]) {
                    componentUsage[id] = {
                        component: log.componentId,
                        usageCount: 0
                    };
                }
                componentUsage[id].usageCount++;
            }
        });

        const mostUsedComponents = Object.values(componentUsage)
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10);

        // Usage by category
        const categoryUsage = {};
        logs.forEach(log => {
            if (log.componentId && log.componentId.category) {
                const category = log.componentId.category;
                categoryUsage[category] = (categoryUsage[category] || 0) + 1;
            }
        });

        // Daily usage trend
        const dailyUsage = {};
        logs.forEach(log => {
            const date = log.createdAt.toISOString().split('T')[0];
            dailyUsage[date] = (dailyUsage[date] || 0) + 1;
        });

        res.json({
            summary: {
                totalUsage: logs.length,
                reportPeriod: { startDate, endDate },
                reportDate: new Date()
            },
            mostUsedComponents,
            categoryUsage,
            dailyUsage,
            recentActivity: logs.slice(0, 20)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Generate maintenance report
exports.generateMaintenanceReport = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (startDate && endDate) {
            filter.scheduledDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const maintenanceRecords = await Maintenance.find(filter)
            .populate('equipmentId', 'name category location')
            .sort({ scheduledDate: -1 });

        // Calculate statistics
        const totalRecords = maintenanceRecords.length;
        const completedRecords = maintenanceRecords.filter(r => r.status === 'completed').length;
        const overdue = maintenanceRecords.filter(r =>
            r.status === 'scheduled' && new Date(r.scheduledDate) < new Date()
        ).length;
        const totalCost = maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

        // Maintenance by type
        const typeStats = {};
        maintenanceRecords.forEach(record => {
            typeStats[record.type] = (typeStats[record.type] || 0) + 1;
        });

        // Monthly maintenance trend
        const monthlyStats = {};
        maintenanceRecords.forEach(record => {
            const month = record.scheduledDate.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyStats[month]) {
                monthlyStats[month] = { scheduled: 0, completed: 0, cost: 0 };
            }
            monthlyStats[month].scheduled++;
            if (record.status === 'completed') {
                monthlyStats[month].completed++;
                monthlyStats[month].cost += record.cost || 0;
            }
        });

        res.json({
            summary: {
                totalRecords,
                completedRecords,
                overdue,
                totalCost,
                completionRate: totalRecords ? (completedRecords / totalRecords * 100).toFixed(1) : 0,
                reportDate: new Date()
            },
            records: maintenanceRecords,
            typeStats,
            monthlyStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Generate reservation report
exports.generateReservationReport = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (startDate && endDate) {
            filter.reservationDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const reservations = await Reservation.find(filter)
            .populate('userId', 'name email')
            .populate('componentId', 'name category location')
            .sort({ reservationDate: -1 });

        // Calculate statistics
        const totalReservations = reservations.length;
        const activeReservations = reservations.filter(r => r.status === 'active').length;
        const completedReservations = reservations.filter(r => r.status === 'completed').length;
        const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;

        // Popular components
        const componentReservations = {};
        reservations.forEach(reservation => {
            if (reservation.componentId) {
                const id = reservation.componentId._id.toString();
                if (!componentReservations[id]) {
                    componentReservations[id] = {
                        component: reservation.componentId,
                        reservationCount: 0
                    };
                }
                componentReservations[id].reservationCount++;
            }
        });

        const popularComponents = Object.values(componentReservations)
            .sort((a, b) => b.reservationCount - a.reservationCount)
            .slice(0, 10);

        // Daily reservation trend
        const dailyReservations = {};
        reservations.forEach(reservation => {
            const date = reservation.reservationDate.toISOString().split('T')[0];
            if (!dailyReservations[date]) {
                dailyReservations[date] = { count: 0, duration: 0 };
            }
            dailyReservations[date].count++;

            if (reservation.returnDate) {
                const duration = Math.ceil((new Date(reservation.returnDate) - new Date(reservation.reservationDate)) / (1000 * 60 * 60 * 24));
                dailyReservations[date].duration += duration;
            }
        });

        res.json({
            summary: {
                totalReservations,
                activeReservations,
                completedReservations,
                cancelledReservations,
                reportDate: new Date()
            },
            reservations,
            popularComponents,
            dailyReservations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Generate comprehensive dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
    try {
        // Get basic inventory stats
        const totalComponents = await Component.countDocuments();
        const lowStockComponents = await Component.countDocuments({
            $expr: { $lte: ['$quantity', '$minThreshold'] }
        });
        const totalValue = await Component.aggregate([
            { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$quantity'] } } } }
        ]);

        // Get reservation stats
        const activeReservations = await Reservation.countDocuments({ status: 'active' });
        const pendingReservations = await Reservation.countDocuments({ status: 'pending' });

        // Get maintenance stats
        const scheduledMaintenance = await Maintenance.countDocuments({ status: 'scheduled' });
        const overdueMaintenance = await Maintenance.countDocuments({
            status: 'scheduled',
            scheduledDate: { $lt: new Date() }
        });

        // Recent activity (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentLogs = await Log.find({
            createdAt: { $gte: weekAgo }
        }).populate('userId', 'name').limit(10).sort({ createdAt: -1 });

        // Category distribution
        const categoryStats = await Component.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    value: { $sum: { $multiply: ['$price', '$quantity'] } }
                }
            }
        ]);

        res.json({
            inventory: {
                totalComponents,
                lowStockComponents,
                totalValue: totalValue[0]?.total || 0
            },
            reservations: {
                active: activeReservations,
                pending: pendingReservations
            },
            maintenance: {
                scheduled: scheduledMaintenance,
                overdue: overdueMaintenance
            },
            recentActivity: recentLogs,
            categoryStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
