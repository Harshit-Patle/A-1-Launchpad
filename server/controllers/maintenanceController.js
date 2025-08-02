const Maintenance = require('../models/Maintenance');
const Component = require('../models/Component');

// Get all maintenance records
exports.getAllMaintenance = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type, equipmentId } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (equipmentId) filter.equipmentId = equipmentId;

        const records = await Maintenance.find(filter)
            .populate('userId', 'name email')
            .populate('equipmentId', 'name partNumber location')
            .sort({ scheduledDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Maintenance.countDocuments(filter);

        res.json({
            records,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create new maintenance record
exports.createMaintenance = async (req, res) => {
    try {
        const {
            equipmentId,
            type,
            scheduledDate,
            description,
            performedBy,
            cost,
            notes,
            nextMaintenanceDate
        } = req.body;

        // Check if equipment exists
        const equipment = await Component.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }

        const maintenance = new Maintenance({
            equipmentId,
            equipmentName: equipment.name,
            type,
            scheduledDate,
            description,
            performedBy,
            cost,
            notes,
            nextMaintenanceDate,
            userId: req.user.id
        });

        await maintenance.save();
        res.status(201).json(maintenance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update maintenance status
exports.updateMaintenanceStatus = async (req, res) => {
    try {
        const { status, completedDate } = req.body;
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({ msg: 'Maintenance record not found' });
        }

        maintenance.status = status;
        if (completedDate) {
            maintenance.completedDate = completedDate;
        }

        await maintenance.save();
        res.json(maintenance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update maintenance record
exports.updateMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({ msg: 'Maintenance record not found' });
        }

        const {
            type,
            scheduledDate,
            completedDate,
            description,
            performedBy,
            cost,
            notes,
            nextMaintenanceDate,
            status
        } = req.body;

        // Update fields
        if (type) maintenance.type = type;
        if (scheduledDate) maintenance.scheduledDate = scheduledDate;
        if (completedDate) maintenance.completedDate = completedDate;
        if (description) maintenance.description = description;
        if (performedBy) maintenance.performedBy = performedBy;
        if (cost !== undefined) maintenance.cost = cost;
        if (notes) maintenance.notes = notes;
        if (nextMaintenanceDate) maintenance.nextMaintenanceDate = nextMaintenanceDate;
        if (status) maintenance.status = status;

        await maintenance.save();
        res.json(maintenance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete maintenance record
exports.deleteMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({ msg: 'Maintenance record not found' });
        }

        await Maintenance.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Maintenance record deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get maintenance statistics
exports.getMaintenanceStats = async (req, res) => {
    try {
        const totalScheduled = await Maintenance.countDocuments({ status: 'scheduled' });
        const totalInProgress = await Maintenance.countDocuments({ status: 'in_progress' });
        const totalCompleted = await Maintenance.countDocuments({ status: 'completed' });

        // Count overdue maintenance
        const now = new Date();
        const overdue = await Maintenance.countDocuments({
            status: 'scheduled',
            scheduledDate: { $lt: now }
        });

        // Upcoming maintenance (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const upcoming = await Maintenance.countDocuments({
            status: 'scheduled',
            scheduledDate: { $gte: now, $lte: thirtyDaysFromNow }
        });

        // Monthly maintenance completion trend
        const monthlyStats = await Maintenance.aggregate([
            {
                $match: {
                    completedDate: { $exists: true },
                    completedDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$completedDate' },
                        month: { $month: '$completedDate' }
                    },
                    count: { $sum: 1 },
                    totalCost: { $sum: '$cost' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json({
            summary: {
                totalScheduled,
                totalInProgress,
                totalCompleted,
                overdue,
                upcoming
            },
            monthlyStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
