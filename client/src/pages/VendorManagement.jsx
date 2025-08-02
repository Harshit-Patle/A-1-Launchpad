import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function VendorManagement() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('add'); // 'add' or 'edit'
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ field: 'name', direction: 'asc' });
    const [filterCategory, setFilterCategory] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        category: '',
        paymentTerms: '',
        notes: '',
        active: true
    });

    // Sample vendor categories
    const categories = [
        'Chemical Supplier',
        'Equipment Manufacturer',
        'Consumables',
        'Reagents',
        'Glassware',
        'Safety Equipment',
        'Electronics',
        'Service Provider',
        'Other'
    ];

    // Payment terms options
    const paymentTermsOptions = [
        'Net 30',
        'Net 60',
        'Net 90',
        'Immediate',
        'COD',
        'Custom'
    ];

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            // In a real app, this would be fetched from the server
            // Simulating API call with sample data
            setTimeout(() => {
                const sampleVendors = [
                    {
                        id: 1,
                        name: 'Sigma-Aldrich',
                        contactPerson: 'John Smith',
                        email: 'john@sigmaaldrich.com',
                        phone: '123-456-7890',
                        address: '123 Science Park, St. Louis, MO',
                        website: 'https://www.sigmaaldrich.com',
                        category: 'Chemical Supplier',
                        paymentTerms: 'Net 30',
                        rating: 4.5,
                        notes: 'Preferred supplier for most chemicals',
                        active: true
                    },
                    {
                        id: 2,
                        name: 'Thermo Fisher Scientific',
                        contactPerson: 'Emily Johnson',
                        email: 'emily@thermofisher.com',
                        phone: '234-567-8901',
                        address: '456 Lab Avenue, Waltham, MA',
                        website: 'https://www.thermofisher.com',
                        category: 'Equipment Manufacturer',
                        paymentTerms: 'Net 60',
                        rating: 4.7,
                        notes: 'Primary equipment supplier',
                        active: true
                    },
                    {
                        id: 3,
                        name: 'VWR International',
                        contactPerson: 'Robert Lee',
                        email: 'robert@vwr.com',
                        phone: '345-678-9012',
                        address: '789 Research Blvd, Radnor, PA',
                        website: 'https://www.vwr.com',
                        category: 'Consumables',
                        paymentTerms: 'Net 30',
                        rating: 4.2,
                        notes: 'Good for bulk orders',
                        active: true
                    }
                ];

                setVendors(sampleVendors);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
            toast.error('Failed to load vendors');
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddNewVendor = () => {
        setFormData({
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            website: '',
            category: '',
            paymentTerms: 'Net 30',
            notes: '',
            active: true
        });
        setFormType('add');
        setShowForm(true);
    };

    const handleEditVendor = (vendor) => {
        setSelectedVendor(vendor);
        setFormData({
            name: vendor.name,
            contactPerson: vendor.contactPerson,
            email: vendor.email,
            phone: vendor.phone,
            address: vendor.address,
            website: vendor.website,
            category: vendor.category,
            paymentTerms: vendor.paymentTerms,
            notes: vendor.notes,
            active: vendor.active
        });
        setFormType('edit');
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.category) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            if (formType === 'add') {
                // Simulate adding a new vendor
                const newVendor = {
                    id: vendors.length + 1,
                    ...formData,
                    rating: 0
                };

                setVendors(prev => [...prev, newVendor]);
                toast.success('Vendor added successfully!');
            } else {
                // Simulate updating a vendor
                const updatedVendors = vendors.map(v =>
                    v.id === selectedVendor.id ? { ...v, ...formData } : v
                );

                setVendors(updatedVendors);
                toast.success('Vendor updated successfully!');
            }

            setShowForm(false);
        } catch (error) {
            console.error('Error saving vendor:', error);
            toast.error('Failed to save vendor');
        }
    };

    const handleDelete = async (vendor) => {
        if (window.confirm(`Are you sure you want to delete ${vendor.name}?`)) {
            try {
                // Simulate deleting a vendor
                const filteredVendors = vendors.filter(v => v.id !== vendor.id);
                setVendors(filteredVendors);
                toast.success('Vendor deleted successfully!');
            } catch (error) {
                console.error('Error deleting vendor:', error);
                toast.error('Failed to delete vendor');
            }
        }
    };

    const handleSort = (field) => {
        setSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredVendors = vendors
        .filter(vendor =>
            vendor.name.toLowerCase().includes(search.toLowerCase()) ||
            vendor.category.toLowerCase().includes(search.toLowerCase()) ||
            vendor.contactPerson.toLowerCase().includes(search.toLowerCase())
        )
        .filter(vendor => filterCategory ? vendor.category === filterCategory : true)
        .sort((a, b) => {
            if (sort.field === 'rating') {
                return sort.direction === 'asc' ? a.rating - b.rating : b.rating - a.rating;
            }

            const aValue = a[sort.field].toString().toLowerCase();
            const bValue = b[sort.field].toString().toLowerCase();

            if (sort.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
                <p className="text-gray-600">Manage your suppliers and service providers</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
                                placeholder="Search vendors..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>

                        <select
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleAddNewVendor}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* Vendor Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-xl font-medium text-gray-900">
                                {formType === 'add' ? 'Add New Vendor' : 'Edit Vendor'}
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
                                        Vendor Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.category}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person
                                    </label>
                                    <input
                                        name="contactPerson"
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.contactPerson}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        name="phone"
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.phone}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Website
                                    </label>
                                    <input
                                        name="website"
                                        type="url"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.website}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Terms
                                    </label>
                                    <select
                                        name="paymentTerms"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.paymentTerms}
                                        onChange={handleFormChange}
                                    >
                                        {paymentTermsOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        name="address"
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.address}
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
                                    <label className="flex items-center">
                                        <input
                                            name="active"
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            checked={formData.active}
                                            onChange={handleFormChange}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active Vendor</span>
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
                                    {formType === 'add' ? 'Add Vendor' : 'Update Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vendor List */}
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
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Vendor
                                            {sort.field === 'name' && (
                                                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    {sort.direction === 'asc' ? (
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center">
                                            Category
                                            {sort.field === 'category' && (
                                                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    {sort.direction === 'asc' ? (
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('contactPerson')}
                                    >
                                        Contact
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('rating')}
                                    >
                                        <div className="flex items-center">
                                            Rating
                                            {sort.field === 'rating' && (
                                                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    {sort.direction === 'asc' ? (
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredVendors.length > 0 ? (
                                    filteredVendors.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                                                        <div className="text-sm text-gray-500">{vendor.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {vendor.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{vendor.contactPerson}</div>
                                                <div className="text-sm text-gray-500">{vendor.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-900 mr-1">{vendor.rating}</span>
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg
                                                                key={i}
                                                                className={`h-4 w-4 ${i < Math.floor(vendor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {vendor.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditVendor(vendor)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vendor)}
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
                                            No vendors found. {search || filterCategory ? 'Try adjusting your search or filters.' : ''}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
