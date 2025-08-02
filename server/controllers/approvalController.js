const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Get pending approvals for current user
exports.getPendingApprovals = async (req, res) => {
    try {
        const approvals = await ApprovalWorkflow.find({
            'approvers.userId': req.user.id,
            'approvers.status': 'pending',
            finalStatus: 'pending'
        })
            .populate('requestedBy', 'name email')
            .populate('approvers.userId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ approvals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all approval requests (admin only)
exports.getAllApprovals = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;

        const filter = {};
        if (status) filter.finalStatus = status;
        if (type) filter.requestType = type;

        const approvals = await ApprovalWorkflow.find(filter)
            .populate('requestedBy', 'name email')
            .populate('approvers.userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ApprovalWorkflow.countDocuments(filter);

        res.json({
            approvals,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create approval request
exports.createApprovalRequest = async (requestType, requestedBy, requestData, reason, priority = 'medium') => {
    try {
        // Determine approvers based on request type and priority
        let approverQuery = {};

        switch (requestType) {
            case 'component_addition':
            case 'quantity_update':
                approverQuery = { role: { $in: ['Admin', 'Manager'] } };
                break;
            case 'maintenance_request':
                approverQuery = { $or: [{ role: 'Admin' }, { department: 'Maintenance' }] };
                break;
            case 'large_reservation':
                approverQuery = { role: { $in: ['Admin', 'Manager'] } };
                break;
            default:
                approverQuery = { role: 'Admin' };
        }

        const approvers = await User.find(approverQuery);

        const approvalWorkflow = new ApprovalWorkflow({
            requestId: requestData.id || new require('mongoose').Types.ObjectId(),
            requestType,
            requestedBy,
            requestData,
            reason,
            priority,
            approvers: approvers.map(user => ({
                userId: user._id,
                status: 'pending'
            }))
        });

        await approvalWorkflow.save();

        // Send notifications to approvers
        for (const approver of approvers) {
            await createNotification(
                approver._id,
                'approval_required',
                'Approval Required',
                `New ${requestType.replace('_', ' ')} request requires your approval`,
                { approvalId: approvalWorkflow._id },
                priority === 'urgent' ? 'high' : 'medium'
            );
        }

        return approvalWorkflow;
    } catch (error) {
        console.error('Error creating approval request:', error);
        return null;
    }
};

// Approve/Reject request
exports.updateApprovalStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const approvalId = req.params.id;

        const approval = await ApprovalWorkflow.findById(approvalId);
        if (!approval) {
            return res.status(404).json({ msg: 'Approval request not found' });
        }

        // Find the approver
        const approverIndex = approval.approvers.findIndex(
            a => a.userId.toString() === req.user.id
        );

        if (approverIndex === -1) {
            return res.status(403).json({ msg: 'Not authorized to approve this request' });
        }

        // Update approver status
        approval.approvers[approverIndex].status = status;
        approval.approvers[approverIndex].comment = comment;
        approval.approvers[approverIndex].approvedAt = new Date();

        // Check if all approvers have responded
        const pendingApprovers = approval.approvers.filter(a => a.status === 'pending');
        const rejectedApprovers = approval.approvers.filter(a => a.status === 'rejected');

        if (rejectedApprovers.length > 0) {
            approval.finalStatus = 'rejected';
            approval.completedAt = new Date();
        } else if (pendingApprovers.length === 0) {
            approval.finalStatus = 'approved';
            approval.completedAt = new Date();
        }

        await approval.save();

        // Send notification to requester if final decision is made
        if (approval.finalStatus !== 'pending') {
            await createNotification(
                approval.requestedBy,
                'approval_result',
                `Request ${approval.finalStatus}`,
                `Your ${approval.requestType.replace('_', ' ')} request has been ${approval.finalStatus}`,
                { approvalId: approval._id }
            );
        }

        res.json(approval);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Add comment to approval request
exports.addComment = async (req, res) => {
    try {
        const { comment } = req.body;
        const approvalId = req.params.id;

        const approval = await ApprovalWorkflow.findById(approvalId);
        if (!approval) {
            return res.status(404).json({ msg: 'Approval request not found' });
        }

        approval.comments.push({
            userId: req.user.id,
            comment
        });

        await approval.save();

        // Populate the comment with user info
        await approval.populate('comments.userId', 'name email');

        res.json(approval);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get approval request details
exports.getApprovalDetails = async (req, res) => {
    try {
        const approval = await ApprovalWorkflow.findById(req.params.id)
            .populate('requestedBy', 'name email')
            .populate('approvers.userId', 'name email')
            .populate('comments.userId', 'name email');

        if (!approval) {
            return res.status(404).json({ msg: 'Approval request not found' });
        }

        res.json(approval);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
