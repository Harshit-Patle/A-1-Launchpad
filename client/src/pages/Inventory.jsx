import { useState, useEffect } from 'react';
import { useComponents } from '../contexts/ComponentsContext';
import { Link } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { componentsAPI } from '../services/api';

export default function Inventory() {
    const {
        components,
        fetchComponents,
        updateComponentQuantity,
        deleteComponent,
        filters,
        setFilters,
        setPagination,
        pagination,
        loading,
        error
    } = useComponents();

    const [editingQuantity, setEditingQuantity] = useState(null);
    const [newQuantity, setNewQuantity] = useState('');
    const [showQRCode, setShowQRCode] = useState(null);
    const [categories, setCategories] = useState([]);

    // Fetch categories for the filter dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await componentsAPI.getCategories();
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        fetchComponents();
    }, []); // Only fetch on initial load, setFilters will trigger fetches after that

    // Debug pagination state
    useEffect(() => {
        console.log('Current pagination state:', pagination);
    }, [pagination]);

    const handleQuantityEdit = (componentId, currentQuantity) => {
        setEditingQuantity(componentId);
        setNewQuantity(currentQuantity.toString());
    };

    const handleQuantityUpdate = async (componentId) => {
        const quantity = parseInt(newQuantity);
        if (quantity >= 0) {
            await updateComponentQuantity(componentId, quantity);
            setEditingQuantity(null);
            setNewQuantity('');
        }
    };

    const handleQuantityCancel = () => {
        setEditingQuantity(null);
        setNewQuantity('');
    };

    const handleDelete = async (componentId) => {
        if (window.confirm('Are you sure you want to delete this component?')) {
            await deleteComponent(componentId);
        }
    };

    const handleFilterChange = (key, value) => {
        // Reset to page 1 when filters change
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const getStockStatus = (component) => {
        if (component.quantity === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
        if (component.quantity <= component.criticalLow) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
        return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
                    <p className="text-gray-600">Manage your laboratory components</p>
                </div>
                <Link
                    to="/add-component"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add Component
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search components..."
                            value={filters.search || ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={filters.category || ''}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                        <select
                            value={filters.stockStatus || ''}
                            onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Stock Levels</option>
                            <option value="inStock">In Stock</option>
                            <option value="lowStock">Low Stock</option>
                            <option value="outOfStock">Out of Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Components Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Component
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Part Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
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
                                const stockInfo = getStockStatus(component);
                                return (
                                    <tr key={component._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {component.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {component.description || 'No description'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {component.partNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {component.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {editingQuantity === component._id ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={newQuantity}
                                                        onChange={(e) => setNewQuantity(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={() => handleQuantityUpdate(component._id)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={handleQuantityCancel}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleQuantityEdit(component._id, component.quantity)}
                                                    className="hover:bg-gray-100 px-2 py-1 rounded"
                                                >
                                                    {component.quantity} {component.unit}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockInfo.color}`}>
                                                {stockInfo.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${component.unitPrice?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {component.location || 'Not specified'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => setShowQRCode(component)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Generate QR Code"
                                                >
                                                    QR
                                                </button>
                                                <Link
                                                    to={`/edit-component/${component._id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(component._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => {
                                const currentPage = parseInt(pagination.page);
                                const prevPage = Math.max(1, currentPage - 1);
                                console.log(`Moving from page ${currentPage} to ${prevPage} (mobile)`);
                                setPagination({ page: prevPage });
                            }}
                            disabled={parseInt(pagination.page) <= 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium text-gray-700 px-4 py-2">
                            Page {parseInt(pagination.page) || 1} of {parseInt(pagination.totalPages) || 1}
                        </span>
                        <button
                            onClick={() => {
                                const currentPage = parseInt(pagination.page);
                                const nextPage = Math.min(parseInt(pagination.totalPages), currentPage + 1);
                                console.log(`Moving from page ${currentPage} to ${nextPage} (mobile)`);
                                setPagination({ page: nextPage });
                            }}
                            disabled={parseInt(pagination.page) >= parseInt(pagination.totalPages)}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">
                                    {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0}
                                </span>
                                {' '}to{' '}
                                <span className="font-medium">
                                    {pagination.total > 0 ? Math.min(pagination.page * pagination.limit, pagination.total) : 0}
                                </span>
                                {' '}of{' '}
                                <span className="font-medium">{pagination.total || 0}</span>
                                {' '}results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => {
                                        const currentPage = parseInt(pagination.page);
                                        const prevPage = Math.max(1, currentPage - 1);
                                        console.log(`Moving from page ${currentPage} to ${prevPage}`);
                                        setPagination({ page: prevPage });
                                    }}
                                    disabled={pagination.page <= 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {pagination.totalPages > 0 && Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => {
                                    // If we have many pages, show a sensible range around the current page
                                    let pageToShow;
                                    if (pagination.totalPages <= 10) {
                                        // Show all pages if 10 or fewer
                                        pageToShow = i + 1;
                                    } else {
                                        // Calculate the range to show centered around current page
                                        const currentPage = parseInt(pagination.page);
                                        const startPage = Math.max(1, currentPage - 4);
                                        pageToShow = startPage + i;
                                        if (pageToShow > pagination.totalPages) return null;
                                    }

                                    return (
                                        <button
                                            key={pageToShow}
                                            onClick={() => setPagination({ page: pageToShow })}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${parseInt(pageToShow) === parseInt(pagination.page)
                                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                }`}
                                            aria-current={parseInt(pageToShow) === parseInt(pagination.page) ? "page" : undefined}
                                        >
                                            {pageToShow}
                                        </button>
                                    );
                                }).filter(Boolean)}
                                <button
                                    onClick={() => {
                                        const currentPage = parseInt(pagination.page);
                                        const nextPage = Math.min(pagination.totalPages, currentPage + 1);
                                        console.log(`Moving from page ${currentPage} to ${nextPage}`);
                                        setPagination({ page: nextPage });
                                    }}
                                    disabled={parseInt(pagination.page) >= pagination.totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRCode && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                QR Code for {showQRCode.name}
                            </h3>
                            <div className="text-center">
                                <QRCodeGenerator
                                    value={JSON.stringify({
                                        id: showQRCode._id,
                                        partNumber: showQRCode.partNumber,
                                        name: showQRCode.name,
                                        location: showQRCode.location
                                    })}
                                    size={200}
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setShowQRCode(null)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
