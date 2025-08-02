import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function ReservationSystem() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [reservationForm, setReservationForm] = useState({
        quantity: '',
        startDate: '',
        endDate: '',
        purpose: '',
        notes: ''
    });

    useEffect(() => {
        fetchReservations();
        fetchComponents();
    }, []);

    const fetchReservations = async () => {
        try {
            const response = await fetch('/api/reservations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setReservations(data.reservations || []);
            }
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
        }
    };

    const fetchComponents = async () => {
        try {
            const response = await fetch('/api/components', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setComponents(data.components || []);
            }
        } catch (error) {
            console.error('Failed to fetch components:', error);
        }
    };

    const handleReserveComponent = (component) => {
        setSelectedComponent(component);
        setReservationForm({
            quantity: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            purpose: '',
            notes: ''
        });
        setShowReservationModal(true);
    };

    const handleSubmitReservation = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    componentId: selectedComponent._id,
                    ...reservationForm
                })
            });

            if (response.ok) {
                toast.success('Reservation created successfully!');
                setShowReservationModal(false);
                fetchReservations();
                fetchComponents();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to create reservation');
            }
        } catch (error) {
            toast.error('Failed to create reservation');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = async (reservationId) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) {
            return;
        }

        try {
            const response = await fetch(`/api/reservations/${reservationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                toast.success('Reservation cancelled successfully!');
                fetchReservations();
                fetchComponents();
            } else {
                toast.error('Failed to cancel reservation');
            }
        } catch (error) {
            toast.error('Failed to cancel reservation');
        }
    };

    const getAvailableQuantity = (component) => {
        const reservedQuantity = reservations
            .filter(r => r.componentId === component._id && r.status === 'active')
            .reduce((sum, r) => sum + r.quantity, 0);
        return Math.max(0, component.quantity - reservedQuantity);
    };

    const getReservationStatus = (reservation) => {
        const now = new Date();
        const startDate = new Date(reservation.startDate);
        const endDate = new Date(reservation.endDate);

        if (now < startDate) return { status: 'Upcoming', color: 'text-blue-600 bg-blue-100' };
        if (now > endDate) return { status: 'Expired', color: 'text-red-600 bg-red-100' };
        return { status: 'Active', color: 'text-green-600 bg-green-100' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
                    <p className="text-gray-600">Reserve components for future use</p>
                </div>
            </div>

            {/* My Reservations */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">My Reservations</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Component
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Period
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Purpose
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reservations
                                .filter(reservation => reservation.userId === user.id)
                                .map((reservation) => {
                                    const statusInfo = getReservationStatus(reservation);
                                    return (
                                        <tr key={reservation._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {reservation.componentName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {reservation.partNumber}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {reservation.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    <div>{new Date(reservation.startDate).toLocaleDateString()}</div>
                                                    <div className="text-gray-500">to {new Date(reservation.endDate).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {reservation.purpose}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {statusInfo.status !== 'Expired' && (
                                                    <button
                                                        onClick={() => handleCancelReservation(reservation._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {reservations.filter(r => r.userId === user.id).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No reservations found
                        </div>
                    )}
                </div>
            </div>

            {/* Available Components */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Available Components</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Component
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Available
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {components.map((component) => {
                                const available = getAvailableQuantity(component);
                                return (
                                    <tr key={component._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {component.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {component.partNumber}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {component.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {component.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={available > 0 ? 'text-green-600' : 'text-red-600'}>
                                                {available}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {component.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleReserveComponent(component)}
                                                disabled={available === 0}
                                                className={`${available > 0
                                                        ? 'text-blue-600 hover:text-blue-900'
                                                        : 'text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                Reserve
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reservation Modal */}
            {showReservationModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Reserve {selectedComponent?.name}
                            </h3>
                            <button
                                onClick={() => setShowReservationModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReservation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity (Available: {getAvailableQuantity(selectedComponent || {})})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={getAvailableQuantity(selectedComponent || {})}
                                    value={reservationForm.quantity}
                                    onChange={(e) => setReservationForm(prev => ({ ...prev, quantity: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={reservationForm.startDate}
                                    onChange={(e) => setReservationForm(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={reservationForm.endDate}
                                    onChange={(e) => setReservationForm(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                                <input
                                    type="text"
                                    value={reservationForm.purpose}
                                    onChange={(e) => setReservationForm(prev => ({ ...prev, purpose: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Research Project Alpha"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={reservationForm.notes}
                                    onChange={(e) => setReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Additional details..."
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReservationModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Reservation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
