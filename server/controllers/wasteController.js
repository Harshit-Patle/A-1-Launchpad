const WasteEntry = require('../models/WasteEntry');
const Component = require('../models/Component');
const asyncHandler = require('express-async-handler');

// @desc    Get all waste entries
// @route   GET /api/waste
// @access  Private
const getWasteEntries = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
        ? {
            $or: [
                { componentName: { $regex: req.query.keyword, $options: 'i' } },
                { wasteType: { $regex: req.query.keyword, $options: 'i' } },
                { disposalMethod: { $regex: req.query.keyword, $options: 'i' } },
                { containerCode: { $regex: req.query.keyword, $options: 'i' } },
            ],
        }
        : {};

    // Add filters for waste type and disposal method
    if (req.query.wasteType) {
        keyword.wasteType = req.query.wasteType;
    }

    if (req.query.disposalMethod) {
        keyword.disposalMethod = req.query.disposalMethod;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
        keyword.disposalDate = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(req.query.endDate),
        };
    }

    const count = await WasteEntry.countDocuments(keyword);
    const wasteEntries = await WasteEntry.find(keyword)
        .populate('disposedBy', 'name')
        .sort({ disposalDate: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        wasteEntries,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
    });
});

// @desc    Get a waste entry by ID
// @route   GET /api/waste/:id
// @access  Private
const getWasteEntryById = asyncHandler(async (req, res) => {
    const wasteEntry = await WasteEntry.findById(req.params.id)
        .populate('disposedBy', 'name email')
        .populate('componentId', 'name partNumber');

    if (!wasteEntry) {
        res.status(404);
        throw new Error('Waste entry not found');
    }

    res.json(wasteEntry);
});

// @desc    Create a new waste entry
// @route   POST /api/waste
// @access  Private
const createWasteEntry = asyncHandler(async (req, res) => {
    const {
        componentId,
        componentName,
        quantity,
        unit,
        wasteType,
        hazardLevel,
        disposalMethod,
        disposalDate,
        containerCode,
        notes,
        isCompliant,
        attachments,
    } = req.body;

    // If component ID is provided, check if it exists
    if (componentId) {
        const component = await Component.findById(componentId);
        if (!component) {
            res.status(400);
            throw new Error('Component not found');
        }
    }

    const wasteEntry = await WasteEntry.create({
        componentId,
        componentName,
        quantity,
        unit,
        wasteType,
        hazardLevel,
        disposalMethod,
        disposalDate,
        disposedBy: req.user._id,
        containerCode,
        notes,
        isCompliant,
        attachments: attachments || [],
    });

    // If component ID is provided, reduce the quantity
    if (componentId) {
        await Component.findByIdAndUpdate(componentId, {
            $inc: { quantity: -quantity },
        });
    }

    res.status(201).json(wasteEntry);
});

// @desc    Update a waste entry
// @route   PUT /api/waste/:id
// @access  Private
const updateWasteEntry = asyncHandler(async (req, res) => {
    const wasteEntry = await WasteEntry.findById(req.params.id);

    if (!wasteEntry) {
        res.status(404);
        throw new Error('Waste entry not found');
    }

    // Update fields
    const updatedEntry = await WasteEntry.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(updatedEntry);
});

// @desc    Delete a waste entry
// @route   DELETE /api/waste/:id
// @access  Private/Admin
const deleteWasteEntry = asyncHandler(async (req, res) => {
    const wasteEntry = await WasteEntry.findById(req.params.id);

    if (!wasteEntry) {
        res.status(404);
        throw new Error('Waste entry not found');
    }

    await wasteEntry.deleteOne();

    res.json({ message: 'Waste entry removed' });
});

// @desc    Get waste statistics
// @route   GET /api/waste/statistics/summary
// @access  Private
const getWasteStatistics = asyncHandler(async (req, res) => {
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
});

// @desc    Get waste statistics summary
// @route   GET /api/waste/statistics/summary
// @access  Private
const getWasteStatisticsSummary = asyncHandler(async (req, res) => {
    try {
        // Get total number of waste entries
        const totalEntries = await WasteEntry.countDocuments();

        // Count high hazard items
        const highHazardCount = await WasteEntry.countDocuments({ hazardLevel: { $in: ['high', 'extreme'] } });

        // Get waste distribution by type
        const wasteTypes = await WasteEntry.aggregate([
            { $group: { _id: '$wasteType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get waste by disposal method
        const disposalMethods = await WasteEntry.aggregate([
            { $group: { _id: '$disposalMethod', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
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

        // Get waste trends over time (last 6 months)
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
                    _id: {
                        year: { $year: '$disposalDate' },
                        month: { $month: '$disposalDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            totalEntries,
            highHazardCount,
            wasteTypes,
            disposalMethods,
            quantityByUnit,
            monthlyTrends,
            lastUpdated: new Date()
        });
    } catch (err) {
        console.error('Error generating waste statistics:', err);
        res.status(500).json({ message: 'Server error while generating waste statistics' });
    }
});

module.exports = {
    getWasteEntries,
    getWasteEntryById,
    createWasteEntry,
    updateWasteEntry,
    deleteWasteEntry,
    getWasteStatistics,
    getWasteStatisticsSummary,
};
