const express = require('express');
const router = express.Router();
const {
    getPendingApprovals,
    getAllApprovals,
    updateApprovalStatus,
    addComment,
    getApprovalDetails
} = require('../controllers/approvalController');
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/approvals/pending
// @desc    Get pending approvals for current user
// @access  Private
router.get('/pending', getPendingApprovals);

// @route   GET /api/approvals
// @desc    Get all approval requests (admin only)
// @access  Private (Admin/Manager)
router.get('/', roleMiddleware(['admin', 'manager']), getAllApprovals);

// @route   GET /api/approvals/:id
// @desc    Get approval request details
// @access  Private
router.get('/:id', getApprovalDetails);

// @route   PATCH /api/approvals/:id/status
// @desc    Approve/reject request
// @access  Private
router.patch('/:id/status', updateApprovalStatus);

// @route   POST /api/approvals/:id/comment
// @desc    Add comment to approval request
// @access  Private
router.post('/:id/comment', addComment);

module.exports = router;
