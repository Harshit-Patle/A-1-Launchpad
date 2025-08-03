import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { reservationsAPI, componentsAPI } from '../services/api';

export default function ReservationSystem() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [componentsLoading, setComponentsLoading] = useState(false);
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
            console.log('Fetching user reservations...');
            setLoading(true);
            const response = await reservationsAPI.getUserReservations();
            console.log('User reservations response:', response);
            console.log('User reservations data:', response.data);

            // Handle array or object response
            let reservationsData;
            if (Array.isArray(response.data)) {
                reservationsData = response.data;
            } else if (response.data && Array.isArray(response.data.reservations)) {
                reservationsData = response.data.reservations;
            } else {
                reservationsData = [];
            }

            console.log('Processed reservations data:', reservationsData);
            console.log('Current user:', user);

            setReservations(reservationsData);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
            toast.error('Failed to load your reservations');
            setLoading(false);
        }
    };

    const fetchComponents = async () => {
        try {
            console.log('Fetching components...');
            setComponentsLoading(true);
            
            const response = await componentsAPI.getAll({ forceRefresh: true });
            console.log('Components response:', response);
            console.log('Components data:', response.data);
            
            const componentsList = response.data.components || [];
            console.log(`Retrieved ${componentsList.length} components`);
            
            setComponents(componentsList);
            
            // After setting components, recalculate available quantities
            componentsList.forEach(component => {
                const available = getAvailableQuantity(component);
                console.log(`Component ${component.name}: Available ${available} of ${component.quantity}`);
            });
        } catch (error) {
            console.error('Failed to fetch components:', error);
            toast.error('Failed to load components');
        } finally {
            setComponentsLoading(false);
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
            console.log('Creating reservation:', {
                componentId: selectedComponent._id,
                ...reservationForm
            });

            // Use the API service instead of raw fetch
            const response = await reservationsAPI.create({
                componentId: selectedComponent._id,
                ...reservationForm
            });

            console.log('Reservation created successfully:', response.data);
            toast.success('Reservation created successfully!');
            setShowReservationModal(false);

            // Wait a short moment before fetching the updated reservations
            setTimeout(() => {
                fetchReservations();
                fetchComponents();
            }, 500);
        } catch (error) {
            console.error('Reservation creation error:', error);
            const errorMsg = error.response?.data?.msg || error.message || 'Unknown error';
            toast.error('Failed to create reservation: ' + errorMsg);
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
        // For debugging
        console.log('Calculating available quantity for component:', component.name, component._id);
        
        // Ensure we're comparing strings to handle both ObjectId and string types
        const componentId = component._id?.toString();
        
        // Filter active reservations for this component
        const componentReservations = reservations.filter(r => {
            const resComponentId = r.componentId?._id?.toString() || r.componentId?.toString() || r.componentId;
            const isActive = r.status === 'active' || !r.status;
            
            // Debug 
            if (resComponentId === componentId) {
                console.log('Found matching reservation:', r);
            }
            
            return resComponentId === componentId && isActive;
        });
        
        // Sum the quantities
        const reservedQuantity = componentReservations.reduce((sum, r) => {
            const qty = parseInt(r.quantity) || 0;
            return sum + qty;
        }, 0);
        
        console.log(`Component ${component.name}: Total ${component.quantity}, Reserved ${reservedQuantity}`);
        
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
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">My Reservations</h2>
                    <button
                        onClick={() => fetchReservations()}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                        Refresh List
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-4">
                        <p>Loading reservations...</p>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50">
                        <p className="text-gray-500">You don't have any active reservations.</p>
                        <p className="mt-2 text-sm text-gray-400">Reserve components from the list below.</p>
                    </div>
                ) : (
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
                                    // No need to filter, the API already returns only user's reservations
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
                        {reservations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No reservations found
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Available Components */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Available Components</h2>
                    <button 
                        onClick={fetchComponents} 
                        disabled={componentsLoading}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                        {componentsLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Refreshing...
                            </>
                        ) : 'Refresh Stock'}
                    </button>
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
                                            <span title="Total quantity in inventory">
                                                {component.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                            <span 
                                                className={available > 0 ? 'text-green-600' : 'text-red-600'}
                                                title={`${component.quantity - available} units reserved`}
                                            >
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
