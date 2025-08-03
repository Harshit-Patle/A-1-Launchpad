import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { wasteAPI } from '../services/api';

export default function WasteTracking() {
    const [wasteEntries, setWasteEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('add');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [filters, setFilters] = useState({
        wasteType: '',
        dateRange: '',
        search: '',
        disposalMethod: '',
        startDate: '',
        endDate: ''
    });
    const [formData, setFormData] = useState({
        componentId: '',
        componentName: '',
        quantity: '',
        unit: 'g',
        wasteType: '',
        hazardLevel: 'low',
        disposalMethod: '',
        disposalDate: new Date().toISOString().split('T')[0],
        disposedBy: '',
        containerCode: '',
        notes: '',
        isCompliant: true,
        attachments: []
    });

    // Reference data
    const wasteTypes = [
        'Chemical',
        'Biological',
        'Radioactive',
        'Sharps',
        'Electronic',
        'Glass',
        'Mixed',
        'Other'
    ];

    const hazardLevels = [
        'low',
        'medium',
        'high',
        'extreme'
    ];

    const disposalMethods = [
        'Incineration',
        'Neutralization',
        'Recycling',
        'Landfill',
        'Special Disposal',
        'External Vendor'
    ];

    const units = [
        'g', 'kg', 'ml', 'l', 'pcs', 'container'
    ];

    useEffect(() => {
        fetchWasteEntries();
    }, []);

    const fetchWasteEntries = async () => {
        setLoading(true);
        try {
            // Build query parameters based on filters
            const params = {};
            if (filters.wasteType) params.wasteType = filters.wasteType;
            if (filters.disposalMethod) params.disposalMethod = filters.disposalMethod;
            if (filters.search) params.keyword = filters.search;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            // Fetch data from API
            const response = await wasteAPI.getAll(params);
            setWasteEntries(response.data || []);
            toast.success("Waste entries loaded successfully");
        } catch (error) {
            console.error('Failed to fetch waste entries:', error);
            toast.error('Failed to load waste tracking data');
            // Use sample data as fallback
            useSampleData();
        } finally {
            setLoading(false);
        }
    };

    const useSampleData = () => {
        const sampleEntries = [
            {
                id: 1,
                componentId: 'CHM-001',
                componentName: 'Sodium Hydroxide Solution',
                quantity: 500,
                unit: 'ml',
                wasteType: 'Chemical',
                hazardLevel: 'medium',
                disposalMethod: 'Neutralization',
                disposalDate: '2025-07-15',
                disposedBy: 'John Doe',
                containerCode: 'WC-20250715-001',
                notes: 'Neutralized with HCl before disposal',
                isCompliant: true,
                attachments: ['disposal-cert-001.pdf']
            },
            {
                id: 2,
                componentId: 'BIO-023',
                componentName: 'Used Petri Dishes',
                quantity: 20,
                unit: 'pcs',
                wasteType: 'Biological',
                hazardLevel: 'medium',
                disposalMethod: 'Incineration',
                disposalDate: '2025-07-20',
                disposedBy: 'Emma Wilson',
                containerCode: 'WC-20250720-005',
                notes: 'Autoclave sterilized before incineration',
                isCompliant: true,
                attachments: []
            },
            {
                id: 3,
                componentId: 'CHM-045',
                componentName: 'Mercury Compounds',
                quantity: 100,
                unit: 'g',
                wasteType: 'Chemical',
                hazardLevel: 'high',
                disposalMethod: 'Special Disposal',
                disposalDate: '2025-07-25',
                disposedBy: 'Robert Chen',
                containerCode: 'WC-20250725-002',
                notes: 'Specialized hazardous waste contractor used',
                isCompliant: true,
                attachments: ['disposal-cert-045.pdf', 'manifest-045.pdf']
            }
        ];
        setWasteEntries(sampleEntries);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === 'attachments') {
            // Handle file uploads
            setFormData(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...Array.from(files).map(file => file.name)]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNew = () => {
        setFormData({
            componentId: '',
            componentName: '',
            quantity: '',
            unit: 'g',
            wasteType: '',
            hazardLevel: 'low',
            disposalMethod: '',
            disposalDate: new Date().toISOString().split('T')[0],
            disposedBy: '',
            containerCode: '',
            notes: '',
            isCompliant: true,
            attachments: []
        });
        setFormType('add');
        setShowForm(true);
    };

    const handleEdit = (entry) => {
        setSelectedEntry(entry);
        setFormData({
            componentId: entry.componentId,
            componentName: entry.componentName,
            quantity: entry.quantity,
            unit: entry.unit,
            wasteType: entry.wasteType,
            hazardLevel: entry.hazardLevel,
            disposalMethod: entry.disposalMethod,
            disposalDate: entry.disposalDate,
            disposedBy: entry.disposedBy,
            containerCode: entry.containerCode,
            notes: entry.notes,
            isCompliant: entry.isCompliant,
            attachments: entry.attachments
        });
        setFormType('edit');
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.componentName || !formData.quantity || !formData.wasteType || !formData.disposalMethod) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            if (formType === 'add') {
                // Simulate adding a new waste entry
                const newEntry = {
                    id: wasteEntries.length + 1,
                    ...formData
                };

                setWasteEntries(prev => [...prev, newEntry]);
                toast.success('Waste entry added successfully!');
            } else {
                // Simulate updating a waste entry
                const updatedEntries = wasteEntries.map(entry =>
                    entry.id === selectedEntry.id ? { ...entry, ...formData } : entry
                );

                setWasteEntries(updatedEntries);
                toast.success('Waste entry updated successfully!');
            }

            setShowForm(false);
        } catch (error) {
            console.error('Error saving waste entry:', error);
            toast.error('Failed to save waste entry');
        }
    };

    const handleDelete = async (entry) => {
        if (window.confirm(`Are you sure you want to delete this waste entry for ${entry.componentName}?`)) {
            try {
                // Simulate deleting a waste entry
                const filteredEntries = wasteEntries.filter(e => e.id !== entry.id);
                setWasteEntries(filteredEntries);
                toast.success('Waste entry deleted successfully!');
            } catch (error) {
                console.error('Error deleting waste entry:', error);
                toast.error('Failed to delete waste entry');
            }
        }
    };

    const generateReport = () => {
        toast.info('Generating waste compliance report...');
        // In a real app, this would generate and download a report
        setTimeout(() => {
            toast.success('Waste compliance report generated successfully!');
        }, 1500);
    };

    const getHazardLevelClass = (level) => {
        switch (level) {
            case 'low':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'extreme':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Apply filters
    const filteredEntries = wasteEntries
        .filter(entry =>
        (filters.search === '' ||
            entry.componentName.toLowerCase().includes(filters.search.toLowerCase()) ||
            entry.containerCode.toLowerCase().includes(filters.search.toLowerCase()) ||
            entry.disposedBy.toLowerCase().includes(filters.search.toLowerCase()))
        )
        .filter(entry => filters.wasteType === '' || entry.wasteType === filters.wasteType)
        .filter(entry => filters.disposalMethod === '' || entry.disposalMethod === filters.disposalMethod)
        .filter(entry => !filters.startDate || new Date(entry.disposalDate) >= new Date(filters.startDate))
        .filter(entry => !filters.endDate || new Date(entry.disposalDate) <= new Date(filters.endDate));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Waste Tracking</h1>
                    <p className="text-gray-600">Track and manage laboratory waste disposal</p>
                </div>
                <div>
                    <button
                        onClick={generateReport}
                        className="inline-flex items-center px-4 py-2 mr-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Generate Report
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Waste Entry
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
                            placeholder="Search waste entries..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <div>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.wasteType}
                            onChange={(e) => handleFilterChange('wasteType', e.target.value)}
                        >
                            <option value="">All Waste Types</option>
                            {wasteTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.disposalMethod}
                            onChange={(e) => handleFilterChange('disposalMethod', e.target.value)}
                        >
                            <option value="">All Disposal Methods</option>
                            {disposalMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Start Date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                        <input
                            type="date"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="End Date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Waste Entry Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-xl font-medium text-gray-900">
                                {formType === 'add' ? 'Add New Waste Entry' : 'Edit Waste Entry'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-500">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Component ID
                                    </label>
                                    <input
                                        name="componentId"
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.componentId}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Component Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="componentName"
                                        type="text"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.componentName}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="quantity"
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.quantity}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit
                                    </label>
                                    <select
                                        name="unit"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.unit}
                                        onChange={handleFormChange}
                                    >
                                        {units.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Waste Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="wasteType"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.wasteType}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Select Waste Type</option>
                                        {wasteTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hazard Level
                                    </label>
                                    <select
                                        name="hazardLevel"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.hazardLevel}
                                        onChange={handleFormChange}
                                    >
                                        {hazardLevels.map(level => (
                                            <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Disposal Method <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="disposalMethod"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.disposalMethod}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Select Disposal Method</option>
                                        {disposalMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Disposal Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="disposalDate"
                                        type="date"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.disposalDate}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Disposed By <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="disposedBy"
                                        type="text"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.disposedBy}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Container Code
                                    </label>
                                    <input
                                        name="containerCode"
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.containerCode}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows="3"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Attachments
                                    </label>
                                    <input
                                        name="attachments"
                                        type="file"
                                        multiple
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={handleFormChange}
                                    />
                                    {formData.attachments.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-gray-500">Current Attachments:</p>
                                            <ul className="list-disc pl-5 text-xs text-gray-500">
                                                {formData.attachments.map((attachment, index) => (
                                                    <li key={index}>{attachment}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center">
                                        <input
                                            name="isCompliant"
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            checked={formData.isCompliant}
                                            onChange={handleFormChange}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Compliant with disposal regulations</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {formType === 'add' ? 'Add Entry' : 'Update Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Waste Entries List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Component
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Waste Details
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Disposal
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hazard
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Compliance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEntries.length > 0 ? (
                                    filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{entry.componentName}</div>
                                                        <div className="text-xs text-gray-500">ID: {entry.componentId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{entry.wasteType}</div>
                                                <div className="text-xs text-gray-500">
                                                    {entry.quantity} {entry.unit}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{entry.disposalMethod}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(entry.disposalDate).toLocaleDateString()} by {entry.disposedBy}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getHazardLevelClass(entry.hazardLevel)}`}>
                                                    {entry.hazardLevel.charAt(0).toUpperCase() + entry.hazardLevel.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {entry.isCompliant ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Compliant
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                        Non-Compliant
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No waste entries found. {filters.search || filters.wasteType || filters.disposalMethod || filters.startDate || filters.endDate ? 'Try adjusting your search or filters.' : ''}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Total Entries</h3>
                            <p className="text-3xl font-bold text-gray-900">{wasteEntries.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Compliant</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {wasteEntries.filter(entry => entry.isCompliant).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">High Hazard</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {wasteEntries.filter(entry => entry.hazardLevel === 'high' || entry.hazardLevel === 'extreme').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Non-Compliant</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {wasteEntries.filter(entry => !entry.isCompliant).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
