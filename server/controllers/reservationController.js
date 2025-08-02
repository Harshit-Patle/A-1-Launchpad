const Reservation = require('../models/Reservation');
const Component = require('../models/Component');

// Get all reservations
exports.getAllReservations = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, userId } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

        const reservations = await Reservation.find(filter)
            .populate('userId', 'name email')
            .populate('componentId', 'name partNumber location')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Reservation.countDocuments(filter);

        res.json({
            reservations,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create new reservation
exports.createReservation = async (req, res) => {
    try {
        const { componentId, quantity, startDate, endDate, purpose, notes } = req.body;

        // Check if component exists and has sufficient available quantity
        const component = await Component.findById(componentId);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        // Calculate currently reserved quantity
        const activeReservations = await Reservation.find({
            componentId,
            status: 'active',
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
        });

        const reservedQuantity = activeReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
        const availableQuantity = component.quantity - reservedQuantity;

        if (availableQuantity < quantity) {
            return res.status(400).json({
                msg: `Insufficient available quantity. Available: ${availableQuantity}, Requested: ${quantity}`
            });
        }

        const reservation = new Reservation({
            componentId,
            componentName: component.name,
            partNumber: component.partNumber,
            userId: req.user.id,
            userName: req.user.name,
            quantity,
            startDate,
            endDate,
            purpose,
            notes
        });

        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update reservation status
exports.updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found' });
        }

        // Check if user owns the reservation or is admin
        if (reservation.userId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        reservation.status = status;
        await reservation.save();

        res.json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update reservation
exports.updateReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found' });
        }

        // Check if user owns the reservation or is admin
        if (reservation.userId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { quantity, startDate, endDate, purpose, notes, status } = req.body;

        // Update fields
        if (quantity) reservation.quantity = quantity;
        if (startDate) reservation.startDate = startDate;
        if (endDate) reservation.endDate = endDate;
        if (purpose) reservation.purpose = purpose;
        if (notes) reservation.notes = notes;
        if (status) reservation.status = status;

        await reservation.save();

        res.json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete reservation
exports.deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found' });
        }

        // Check if user owns the reservation or is admin
        if (reservation.userId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        await Reservation.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get user's reservations
exports.getUserReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.user.id })
            .populate('componentId', 'name partNumber location')
            .sort({ createdAt: -1 });

        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Check component availability
exports.checkComponentAvailability = async (req, res) => {
    try {
        const { componentId } = req.params;
        const { startDate, endDate } = req.query;

        const component = await Component.findById(componentId);
        if (!component) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        // Calculate currently reserved quantity for the specified date range
        const activeReservations = await Reservation.find({
            componentId,
            status: 'active',
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
        });

        const reservedQuantity = activeReservations.reduce((total, reservation) =>
            total + reservation.quantity, 0
        );

        const availableQuantity = component.quantity - reservedQuantity;

        res.json({
            componentId,
            totalQuantity: component.quantity,
            reservedQuantity,
            availableQuantity,
            isAvailable: availableQuantity > 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
