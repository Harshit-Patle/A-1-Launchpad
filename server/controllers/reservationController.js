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
        console.log('Creating new reservation with data:', req.body);
        const { componentId, quantity, startDate, endDate, purpose, notes } = req.body;

        // Validate required fields
        if (!componentId || !quantity || !startDate || !endDate || !purpose) {
            return res.status(400).json({
                msg: 'Missing required fields',
                required: { componentId, quantity, startDate, endDate, purpose },
                received: req.body
            });
        }

        // Check if component exists and has sufficient available quantity
        const component = await Component.findById(componentId);
        if (!component) {
            console.log(`Component not found with ID: ${componentId}`);
            return res.status(404).json({ msg: 'Component not found' });
        }

        console.log(`Found component: ${component.name}, checking availability...`);

        // Calculate currently reserved quantity
        const activeReservations = await Reservation.find({
            componentId,
            status: 'active',
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
        });

        const reservedQuantity = activeReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
        const availableQuantity = component.quantity - reservedQuantity;

        console.log(`Reserved: ${reservedQuantity}, Available: ${availableQuantity}, Requested: ${quantity}`);

        if (availableQuantity < quantity) {
            return res.status(400).json({
                msg: `Insufficient available quantity. Available: ${availableQuantity}, Requested: ${quantity}`
            });
        }

        const reservationData = {
            componentId,
            componentName: component.name,
            partNumber: component.partNumber,
            userId: req.user.id,
            userName: req.user.name,
            quantity: parseInt(quantity),
            startDate,
            endDate,
            purpose,
            notes
        };

        console.log('Creating reservation with data:', reservationData);

        const reservation = new Reservation(reservationData);
        const savedReservation = await reservation.save();

        console.log('Reservation created successfully:', savedReservation);
        res.status(201).json(savedReservation);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ msg: 'Server error creating reservation', error: error.message });
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
        console.log(`Getting reservations for user ID: ${req.user.id}`);

        const reservations = await Reservation.find({ userId: req.user.id })
            .populate('componentId', 'name partNumber location')
            .sort({ createdAt: -1 });

        console.log(`Found ${reservations.length} reservations for user`);

        // Debug output to help diagnose issues
        if (reservations.length === 0) {
            // Check if there are any reservations at all
            const totalReservations = await Reservation.countDocuments();
            console.log(`Total reservations in system: ${totalReservations}`);

            if (totalReservations > 0) {
                // Check if there might be an issue with user ID matching
                const sampleReservation = await Reservation.findOne();
                console.log('Sample reservation user ID:', sampleReservation?.userId);
                console.log('Current user ID:', req.user.id);
                console.log('User ID types match:',
                    sampleReservation?.userId && typeof sampleReservation.userId === typeof req.user.id);
            }
        }

        res.json(reservations);
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        res.status(500).json({ msg: 'Server error fetching reservations' });
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
