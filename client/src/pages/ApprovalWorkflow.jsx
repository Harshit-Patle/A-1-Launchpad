import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function ApprovalWorkflow() {
    const { user } = useAuth();
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [allApprovals, setAllApprovals] = useState([]);
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [comment, setComment] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchPendingApprovals();
        if (user.role === 'Admin' || user.role === 'Manager') {
            fetchAllApprovals();
        }
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const response = await fetch('/api/approvals/pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingApprovals(data.approvals || []);
            }
        } catch (error) {
            console.error('Failed to fetch pending approvals:', error);
        }
    };

    const fetchAllApprovals = async () => {
        try {
            const response = await fetch('/api/approvals', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAllApprovals(data.approvals || []);
            }
        } catch (error) {
            console.error('Failed to fetch all approvals:', error);
        }
    };

    const handleApprovalAction = async (approvalId, status) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/approvals/${approvalId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status, comment })
            });

            if (response.ok) {
                toast.success(`Request ${status} successfully!`);
                setShowModal(false);
                setComment('');
                fetchPendingApprovals();
                if (user.role === 'Admin' || user.role === 'Manager') {
                    fetchAllApprovals();
                }
            } else {
                const error = await response.json();
                toast.error(error.msg || 'Failed to update approval');
            }
        } catch (error) {
            toast.error('Failed to update approval');
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (approval) => {
        setSelectedApproval(approval);
        setShowModal(true);
    };

    const getRequestTypeLabel = (type) => {
        switch (type) {
            case 'component_addition': return 'Component Addition';
            case 'quantity_update': return 'Quantity Update';
            case 'maintenance_request': return 'Maintenance Request';
            case 'large_reservation': return 'Large Reservation';
            default: return type;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const renderApprovalsList = (approvals) => {
        if (approvals.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No approvals found
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Request Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Requested By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {approvals.map((approval) => (
                            <tr key={approval._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {getRequestTypeLabel(approval.requestType)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {approval.reason}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {approval.requestedBy.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {approval.requestedBy.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(approval.priority)}`}>
                                        {approval.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.finalStatus)}`}>
                                        {approval.finalStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(approval.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openApprovalModal(approval)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                        View Details
                                    </button>
                                    {approval.finalStatus === 'pending' && activeTab === 'pending' && (
                                        <div className="inline-flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedApproval(approval);
                                                    handleApprovalAction(approval._id, 'approved');
                                                }}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedApproval(approval);
                                                    setShowModal(true);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Approval Workflow</h1>
                    <p className="text-gray-600">Manage approval requests and pending actions</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">{pendingApprovals.length}</p>
                            <p className="text-gray-600">Pending for You</p>
                        </div>
                    </div>
                </div>

                {(user.role === 'Admin' || user.role === 'Manager') && (
                    <>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {allApprovals.filter(a => a.finalStatus === 'approved').length}
                                    </p>
                                    <p className="text-gray-600">Approved</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-red-100">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {allApprovals.filter(a => a.finalStatus === 'rejected').length}
                                    </p>
                                    <p className="text-gray-600">Rejected</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'pending'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Pending Approvals ({pendingApprovals.length})
                        </button>
                        {(user.role === 'Admin' || user.role === 'Manager') && (
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'all'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                All Requests ({allApprovals.length})
                            </button>
                        )}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'pending' && renderApprovalsList(pendingApprovals)}
                    {activeTab === 'all' && renderApprovalsList(allApprovals)}
                </div>
            </div>

            {/* Approval Modal */}
            {showModal && selectedApproval && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Approval Request Details
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Request Type</label>
                                <p className="text-sm text-gray-900">{getRequestTypeLabel(selectedApproval.requestType)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Requested By</label>
                                <p className="text-sm text-gray-900">
                                    {selectedApproval.requestedBy.name} ({selectedApproval.requestedBy.email})
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason</label>
                                <p className="text-sm text-gray-900">{selectedApproval.reason}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Request Data</label>
                                <pre className="text-sm text-gray-900 bg-gray-100 p-3 rounded">
                                    {JSON.stringify(selectedApproval.requestData, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Add a comment..."
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleApprovalAction(selectedApproval._id, 'rejected')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Reject'}
                                </button>
                                <button
                                    onClick={() => handleApprovalAction(selectedApproval._id, 'approved')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Approve'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
