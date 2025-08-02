const Component = require('../models/Component');
const Log = require('../models/Log');
const { validationResult } = require('express-validator');

// Get all components with filtering and pagination
exports.getAll = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            location,
            lowStock,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const filter = { isActive: true };

        if (category && category !== 'all') {
            filter.category = category;
        }

        if (location && location !== 'all') {
            filter.location = location;
        }

        if (lowStock === 'true') {
            filter.$expr = { $lte: ['$quantity', '$criticalLow'] };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { partNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const components = await Component.find(filter)
            .populate('addedBy', 'name')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Component.countDocuments(filter);

        res.json({
            components,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get component by ID
exports.getById = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id)
            .populate('addedBy', 'name email');

        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        res.json(component);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create new component
exports.create = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name, category, partNumber, description, manufacturer,
            quantity, location, unitPrice, datasheetLink, criticalLow,
            supplier, supplierPartNumber, leadTime, packageType,
            specifications, tags
        } = req.body;

        // Check if part number already exists
        const existingComponent = await Component.findOne({ partNumber });
        if (existingComponent) {
            return res.status(400).json({ msg: 'Part number already exists' });
        }

        const component = new Component({
            name,
            category,
            partNumber,
            description,
            manufacturer,
            quantity,
            location,
            unitPrice,
            datasheetLink,
            criticalLow: criticalLow || 10,
            supplier,
            supplierPartNumber,
            leadTime,
            packageType,
            specifications,
            tags,
            addedBy: req.user.id,
            lastRestocked: new Date(),
            lastMovementDate: new Date()
        });

        await component.save();

        // Create log entry
        const log = new Log({
            componentName: name,
            componentId: component._id,
            type: 'inward',
            quantity,
            remainingQuantity: quantity,
            reason: 'Initial stock',
            userName: req.user.name,
            userId: req.user.id,
            location,
            supplier,
            cost: unitPrice * quantity
        });

        await log.save();

        res.status(201).json(component);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update component
exports.update = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        const {
            name, category, description, manufacturer,
            location, unitPrice, datasheetLink, criticalLow,
            supplier, supplierPartNumber, leadTime, packageType,
            specifications, tags
        } = req.body;

        component.name = name || component.name;
        component.category = category || component.category;
        component.description = description || component.description;
        component.manufacturer = manufacturer || component.manufacturer;
        component.location = location || component.location;
        component.unitPrice = unitPrice !== undefined ? unitPrice : component.unitPrice;
        component.datasheetLink = datasheetLink || component.datasheetLink;
        component.criticalLow = criticalLow !== undefined ? criticalLow : component.criticalLow;
        component.supplier = supplier || component.supplier;
        component.supplierPartNumber = supplierPartNumber || component.supplierPartNumber;
        component.leadTime = leadTime !== undefined ? leadTime : component.leadTime;
        component.packageType = packageType || component.packageType;
        component.specifications = specifications || component.specifications;
        component.tags = tags || component.tags;

        await component.save();

        res.json(component);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update component quantity (stock in/out)
exports.updateQuantity = async (req, res) => {
    try {
        const { type, quantity, reason, project, location, supplier, invoiceNumber, cost } = req.body;

        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        let newQuantity = component.quantity;

        if (type === 'inward') {
            newQuantity += parseInt(quantity);
            component.lastRestocked = new Date();
            component.lastMovementDate = new Date();
        } else if (type === 'outward') {
            if (component.quantity < quantity) {
                return res.status(400).json({ msg: 'Insufficient stock' });
            }
            newQuantity -= parseInt(quantity);
            component.lastUsedDate = new Date();
            component.lastMovementDate = new Date();
        } else if (type === 'adjustment') {
            newQuantity = parseInt(quantity);
            component.lastMovementDate = new Date();
        }

        component.quantity = newQuantity;
        await component.save();

        // Create log entry
        const log = new Log({
            componentName: component.name,
            componentId: component._id,
            type,
            quantity: parseInt(quantity),
            remainingQuantity: newQuantity,
            reason,
            project,
            userName: req.user.name,
            userId: req.user.id,
            location: location || component.location,
            supplier,
            invoiceNumber,
            cost: cost || (type === 'inward' ? component.unitPrice * quantity : 0)
        });

        await log.save();

        res.json({
            component,
            msg: `Stock ${type} successful`,
            newQuantity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete component (soft delete)
exports.delete = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        component.isActive = false;
        await component.save();

        res.json({ msg: 'Component deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get component categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Component.distinct('category', { isActive: true });
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get component locations
exports.getLocations = async (req, res) => {
    try {
        const locations = await Component.distinct('location', { isActive: true });
        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get low stock components
exports.getLowStock = async (req, res) => {
    try {
        const components = await Component.find({
            $expr: { $lte: ['$quantity', '$criticalLow'] },
            isActive: true
        }).populate('addedBy', 'name');

        res.json(components);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get dashboard statistics
exports.getStats = async (req, res) => {
    try {
        const totalComponents = await Component.countDocuments({ isActive: true });
        const lowStockComponents = await Component.countDocuments({
            $expr: { $lte: ['$quantity', '$criticalLow'] },
            isActive: true
        });
        const outOfStockComponents = await Component.countDocuments({
            quantity: 0,
            isActive: true
        });

        const totalValue = await Component.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);

        const categoryStats = await Component.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: '$totalValue' } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            totalComponents,
            lowStockComponents,
            outOfStockComponents,
            totalValue: totalValue[0]?.total || 0,
            categoryStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};