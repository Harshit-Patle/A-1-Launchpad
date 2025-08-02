import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function MaintenanceTracking() {
    const { user } = useAuth();
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [maintenanceForm, setMaintenanceForm] = useState({
        type: '',
        scheduledDate: '',
        completedDate: '',
        description: '',
        cost: '',
        performedBy: '',
        notes: '',
        nextMaintenanceDate: '',
        status: 'scheduled'
    });

    useEffect(() => {
        fetchMaintenanceRecords();
        fetchEquipment();
    }, []);

    const fetchMaintenanceRecords = async () => {
        try {
            const response = await fetch('/api/maintenance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMaintenanceRecords(data.records || []);
            }
        } catch (error) {
            console.error('Failed to fetch maintenance records:', error);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await fetch('/api/components?category=Equipment', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEquipment(data.components || []);
            }
        } catch (error) {
            console.error('Failed to fetch equipment:', error);
        }
    };

    const handleScheduleMaintenance = (equipmentItem) => {
        setSelectedEquipment(equipmentItem);
        setMaintenanceForm({
            type: 'preventive',
            scheduledDate: new Date().toISOString().split('T')[0],
            completedDate: '',
            description: '',
            cost: '',
            performedBy: user.name,
            notes: '',
            nextMaintenanceDate: '',
            status: 'scheduled'
        });
        setShowMaintenanceModal(true);
    };

    const handleSubmitMaintenance = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    equipmentId: selectedEquipment._id,
                    ...maintenanceForm
                })
            });

            if (response.ok) {
                toast.success('Maintenance record created successfully!');
                setShowMaintenanceModal(false);
                fetchMaintenanceRecords();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to create maintenance record');
            }
        } catch (error) {
            toast.error('Failed to create maintenance record');
        } finally {
            setLoading(false);
        }
    };

    const updateMaintenanceStatus = async (recordId, status) => {
        try {
            const response = await fetch(`/api/maintenance/${recordId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    status,
                    completedDate: status === 'completed' ? new Date().toISOString() : null
                })
            });

            if (response.ok) {
                toast.success(`Maintenance ${status} successfully!`);
                fetchMaintenanceRecords();
            } else {
                toast.error('Failed to update maintenance status');
            }
        } catch (error) {
            toast.error('Failed to update maintenance status');
        }
    };

    const getMaintenanceStatus = (record) => {
        const now = new Date();
        const scheduledDate = new Date(record.scheduledDate);

        if (record.status === 'completed') {
            return { status: 'Completed', color: 'text-green-600 bg-green-100' };
        }
        if (record.status === 'in_progress') {
            return { status: 'In Progress', color: 'text-blue-600 bg-blue-100' };
        }
        if (now > scheduledDate) {
            return { status: 'Overdue', color: 'text-red-600 bg-red-100' };
        }
        return { status: 'Scheduled', color: 'text-yellow-600 bg-yellow-100' };
    };

    const getNextMaintenanceDue = (equipmentItem) => {
        const records = maintenanceRecords.filter(r => r.equipmentId === equipmentItem._id);
        const latestRecord = records.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))[0];

        if (latestRecord && latestRecord.nextMaintenanceDate) {
            return new Date(latestRecord.nextMaintenanceDate);
        }

        // Default to 6 months if no records
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return sixMonthsFromNow;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Maintenance Tracking</h1>
                    <p className="text-gray-600">Schedule and track equipment maintenance</p>
                </div>
            </div>

            {/* Maintenance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">
                                {maintenanceRecords.filter(r => r.status === 'scheduled').length}
                            </p>
                            <p className="text-gray-600">Scheduled</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">
                                {maintenanceRecords.filter(r => {
                                    const now = new Date();
                                    const scheduledDate = new Date(r.scheduledDate);
                                    return r.status === 'scheduled' && now > scheduledDate;
                                }).length}
                            </p>
                            <p className="text-gray-600">Overdue</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">
                                {maintenanceRecords.filter(r => r.status === 'in_progress').length}
                            </p>
                            <p className="text-gray-600">In Progress</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">
                                {maintenanceRecords.filter(r => r.status === 'completed').length}
                            </p>
                            <p className="text-gray-600">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Records */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Maintenance Records</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Equipment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Scheduled Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performed By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cost
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {maintenanceRecords.map((record) => {
                                const statusInfo = getMaintenanceStatus(record);
                                return (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {record.equipmentName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {record.description}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(record.scheduledDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                {statusInfo.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.performedBy}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.cost ? `$${record.cost}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {record.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => updateMaintenanceStatus(record._id, 'in_progress')}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                                {record.status === 'in_progress' && (
                                                    <button
                                                        onClick={() => updateMaintenanceStatus(record._id, 'completed')}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {maintenanceRecords.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No maintenance records found
                        </div>
                    )}
                </div>
            </div>

            {/* Equipment List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Equipment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Maintenance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Next Due
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {equipment.map((item) => {
                                const nextDue = getNextMaintenanceDue(item);
                                const lastMaintenance = maintenanceRecords
                                    .filter(r => r.equipmentId === item._id && r.status === 'completed')
                                    .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))[0];

                                return (
                                    <tr key={item._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {item.partNumber}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {lastMaintenance
                                                ? new Date(lastMaintenance.completedDate).toLocaleDateString()
                                                : 'Never'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={nextDue < new Date() ? 'text-red-600' : 'text-gray-900'}>
                                                {nextDue.toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleScheduleMaintenance(item)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Schedule Maintenance
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Maintenance Modal */}
            {showMaintenanceModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Schedule Maintenance - {selectedEquipment?.name}
                            </h3>
                            <button
                                onClick={() => setShowMaintenanceModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitMaintenance} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                    <select
                                        value={maintenanceForm.type}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="preventive">Preventive</option>
                                        <option value="corrective">Corrective</option>
                                        <option value="calibration">Calibration</option>
                                        <option value="inspection">Inspection</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                                    <input
                                        type="date"
                                        value={maintenanceForm.scheduledDate}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Performed By</label>
                                    <input
                                        type="text"
                                        value={maintenanceForm.performedBy}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, performedBy: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={maintenanceForm.cost}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={maintenanceForm.description}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Describe the maintenance work..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Maintenance Date</label>
                                    <input
                                        type="date"
                                        value={maintenanceForm.nextMaintenanceDate}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={maintenanceForm.notes}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMaintenanceModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Scheduling...' : 'Schedule Maintenance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
