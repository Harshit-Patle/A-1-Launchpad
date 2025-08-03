const Component = require('../models/Component');
const Log = require('../models/Log');

// Get monthly inward and outward statistics
exports.getMonthlyMovement = async (req, res) => {
    try {
        const { month, year } = req.query;

        // Default to current month and year if not provided
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // Adjust for 0-indexed months
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        // Create date range for the specified month
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999); // Last day of month

        // Query logs for inward and outward movements
        const logs = await Log.find({
            createdAt: { $gte: startDate, $lte: endDate },
            type: { $in: ['inward', 'outward'] }
        }).populate('componentId', 'name partNumber category');

        // Separate inward and outward logs
        const inwardLogs = logs.filter(log => log.type === 'inward');
        const outwardLogs = logs.filter(log => log.type === 'outward');

        // Calculate daily statistics
        const dailyStats = {};
        const dayCount = endDate.getDate();

        // Initialize the days of the month
        for (let day = 1; day <= dayCount; day++) {
            const dateKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dailyStats[dateKey] = {
                date: dateKey,
                inward: { uniqueComponents: 0, totalQuantity: 0 },
                outward: { uniqueComponents: 0, totalQuantity: 0 }
            };
        }

        // Process inward logs
        const inwardComponents = new Set();
        inwardLogs.forEach(log => {
            const logDate = new Date(log.createdAt);
            const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;

            if (dailyStats[dateKey]) {
                if (log.componentId && !inwardComponents.has(log.componentId._id.toString() + dateKey)) {
                    inwardComponents.add(log.componentId._id.toString() + dateKey);
                    dailyStats[dateKey].inward.uniqueComponents++;
                }
                dailyStats[dateKey].inward.totalQuantity += log.quantity || 0;
            }
        });

        // Process outward logs
        const outwardComponents = new Set();
        outwardLogs.forEach(log => {
            const logDate = new Date(log.createdAt);
            const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;

            if (dailyStats[dateKey]) {
                if (log.componentId && !outwardComponents.has(log.componentId._id.toString() + dateKey)) {
                    outwardComponents.add(log.componentId._id.toString() + dateKey);
                    dailyStats[dateKey].outward.uniqueComponents++;
                }
                dailyStats[dateKey].outward.totalQuantity += log.quantity || 0;
            }
        });

        // Calculate monthly totals
        const monthlyTotals = {
            inward: {
                uniqueComponents: new Set([...inwardComponents].map(id => id.split('-')[0])).size,
                totalQuantity: inwardLogs.reduce((sum, log) => sum + (log.quantity || 0), 0)
            },
            outward: {
                uniqueComponents: new Set([...outwardComponents].map(id => id.split('-')[0])).size,
                totalQuantity: outwardLogs.reduce((sum, log) => sum + (log.quantity || 0), 0)
            }
        };

        // Get top inward and outward components
        const componentStats = {};

        logs.forEach(log => {
            if (!log.componentId) return;

            const componentId = log.componentId._id.toString();
            if (!componentStats[componentId]) {
                componentStats[componentId] = {
                    id: componentId,
                    name: log.componentId.name,
                    partNumber: log.componentId.partNumber,
                    category: log.componentId.category,
                    inward: 0,
                    outward: 0
                };
            }

            if (log.type === 'inward') {
                componentStats[componentId].inward += log.quantity || 0;
            } else if (log.type === 'outward') {
                componentStats[componentId].outward += log.quantity || 0;
            }
        });

        const topComponents = Object.values(componentStats)
            .sort((a, b) => (b.inward + b.outward) - (a.inward + a.outward))
            .slice(0, 10);

        res.json({
            month: targetMonth + 1,
            year: targetYear,
            dailyStats: Object.values(dailyStats),
            monthlyTotals,
            topComponents
        });
    } catch (error) {
        console.error('Error generating monthly movement report:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get critical components (both low stock and old stock)
exports.getCriticalComponents = async (req, res) => {
    try {
        // Get components with low stock
        const lowStockComponents = await Component.find({
            $expr: { $lte: ['$quantity', '$criticalLow'] },
            quantity: { $gt: 0 }, // Only non-zero stock
            isActive: true
        }).sort({ quantity: 1 }).limit(20);

        // Get components that are out of stock
        const outOfStockComponents = await Component.find({
            quantity: 0,
            isActive: true
        }).sort({ updatedAt: -1 }).limit(10);

        // Get components that have been in stock for more than 3 months (old stock)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const oldStockComponents = await Component.find({
            quantity: { $gt: 0 },
            lastMovementDate: { $lt: threeMonthsAgo },
            isActive: true
        }).sort({ lastMovementDate: 1 }).limit(20);

        // Calculate days since last movement for old stock
        const oldStockWithDetails = oldStockComponents.map(component => {
            const daysSinceLastMovement = Math.floor(
                (Date.now() - new Date(component.lastMovementDate)) / (1000 * 60 * 60 * 24)
            );

            return {
                ...component.toObject(),
                daysSinceLastMovement,
                totalValue: component.unitPrice * component.quantity
            };
        });

        res.json({
            lowStock: lowStockComponents,
            outOfStock: outOfStockComponents,
            oldStock: oldStockWithDetails
        });
    } catch (error) {
        console.error('Error fetching critical components:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};
