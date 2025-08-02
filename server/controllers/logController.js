const Log = require('../models/Log');
const Component = require('../models/Component');

// Get all logs with filtering and pagination
exports.getAllLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            userId,
            componentId,
            startDate,
            endDate,
            search
        } = req.query;

        const filter = {};

        if (type && type !== 'all') {
            filter.type = type;
        }

        if (userId) {
            filter.userId = userId;
        }

        if (componentId) {
            filter.componentId = componentId;
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        if (search) {
            filter.$or = [
                { componentName: { $regex: search, $options: 'i' } },
                { project: { $regex: search, $options: 'i' } },
                { reason: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await Log.find(filter)
            .populate('componentId', 'name partNumber category')
            .populate('userId', 'name email')
            .populate('approvedBy', 'name email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Log.countDocuments(filter);

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get logs for a specific component
exports.getComponentLogs = async (req, res) => {
    try {
        const { componentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const logs = await Log.find({ componentId })
            .populate('userId', 'name email')
            .populate('approvedBy', 'name email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Log.countDocuments({ componentId });

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get logs for current user
exports.getUserLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        const logs = await Log.find({ userId })
            .populate('componentId', 'name partNumber category')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Log.countDocuments({ userId });

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create manual log entry (Admin only)
exports.createLog = async (req, res) => {
    try {
        const {
            componentId,
            type,
            quantity,
            reason,
            project,
            notes,
            location,
            supplier,
            invoiceNumber,
            cost
        } = req.body;

        const component = await Component.findById(componentId);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        const log = new Log({
            componentName: component.name,
            componentId,
            type,
            quantity,
            remainingQuantity: component.quantity,
            reason,
            project,
            userName: req.user.name,
            userId: req.user.id,
            notes,
            location: location || component.location,
            supplier,
            invoiceNumber,
            cost
        });

        await log.save();

        res.status(201).json(log);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get log statistics
exports.getLogStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.$gte = new Date(startDate);
            if (endDate) dateFilter.date.$lte = new Date(endDate);
        }

        // Activity by type
        const activityByType = await Log.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$type', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } }
        ]);

        // Activity by day
        const activityByDay = await Log.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    count: { $sum: 1 },
                    inward: { $sum: { $cond: [{ $eq: ['$type', 'inward'] }, '$quantity', 0] } },
                    outward: { $sum: { $cond: [{ $eq: ['$type', 'outward'] }, '$quantity', 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Most active components
        const mostActiveComponents = await Log.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$componentId', count: { $sum: 1 }, componentName: { $first: '$componentName' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Most active users
        const mostActiveUsers = await Log.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$userId', count: { $sum: 1 }, userName: { $first: '$userName' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            activityByType,
            activityByDay,
            mostActiveComponents,
            mostActiveUsers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Export logs to CSV (Admin only)
exports.exportLogs = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;

        const filter = {};
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        if (type && type !== 'all') {
            filter.type = type;
        }

        const logs = await Log.find(filter)
            .populate('componentId', 'name partNumber category')
            .populate('userId', 'name email')
            .sort({ date: -1 });

        // Convert to CSV format
        const csvHeaders = [
            'Date',
            'Component Name',
            'Part Number',
            'Category',
            'Type',
            'Quantity',
            'Remaining Quantity',
            'User',
            'Project',
            'Reason',
            'Location',
            'Supplier',
            'Cost'
        ];

        const csvData = logs.map(log => [
            log.date.toISOString(),
            log.componentName,
            log.componentId?.partNumber || '',
            log.componentId?.category || '',
            log.type,
            log.quantity,
            log.remainingQuantity,
            log.userName,
            log.project || '',
            log.reason || '',
            log.location || '',
            log.supplier || '',
            log.cost || ''
        ]);

        const csv = [csvHeaders, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory_logs.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};