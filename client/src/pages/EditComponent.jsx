import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComponents } from '../contexts/ComponentsContext';
import { toast } from 'react-toastify';

export default function EditComponent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        fetchComponentById,
        updateComponent,
        loading,
        error,
        currentComponent,
        clearCurrentComponent
    } = useComponents();

    const [formData, setFormData] = useState({
        name: '',
        partNumber: '',
        category: '',
        description: '',
        quantity: '',
        unit: 'pcs',
        unitPrice: '',
        location: '',
        minStock: '',
        criticalLow: '',
        datasheetLink: '',
        manufacturer: '',
        notes: ''
    });

    const categories = [
        'Chemical',
        'Equipment',
        'Reagent',
        'Glassware',
        'Consumable',
        'Safety Equipment',
        'Electronic Component',
        'Tool'
    ];

    const units = [
        'pcs', 'ml', 'l', 'g', 'kg', 'mg', 'μg', 'bottles', 'boxes', 'sets'
    ];

    // Load component data only once when component mounts and clean up on unmount
    useEffect(() => {
        // Clear any existing component data first
        clearCurrentComponent();

        // Then fetch the new component if ID is available
        if (id) {
            // Using a local variable to prevent unnecessary re-renders
            let isMounted = true;
            const loadComponent = async () => {
                try {
                    // Fetch the component data
                    if (isMounted && id) {
                        await fetchComponentById(id);
                    }
                } catch (error) {
                    console.error('Error loading component:', error);
                }
            };

            loadComponent();

            // Clean up function
            return () => {
                isMounted = false;
                clearCurrentComponent();
            };
        }
    }, [id]); // Only depend on id to prevent infinite loops    // Update form when currentComponent changes
    useEffect(() => {
        if (currentComponent) {
            setFormData({
                name: currentComponent.name || '',
                partNumber: currentComponent.partNumber || '',
                category: currentComponent.category || '',
                description: currentComponent.description || '',
                quantity: currentComponent.quantity ? currentComponent.quantity.toString() : '',
                unit: currentComponent.unit || 'pcs',
                unitPrice: currentComponent.unitPrice ? currentComponent.unitPrice.toString() : '',
                location: currentComponent.location || '',
                minStock: currentComponent.minStock ? currentComponent.minStock.toString() : '',
                criticalLow: currentComponent.criticalLow ? currentComponent.criticalLow.toString() : '',
                datasheetLink: currentComponent.datasheetLink || '',
                manufacturer: currentComponent.manufacturer || '',
                notes: currentComponent.notes || ''
            });
        }
    }, [currentComponent]); // Depend on currentComponent

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic form validation
        if (!formData.name || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Convert string values to numbers where needed
        const componentData = {
            ...formData,
            quantity: formData.quantity ? parseInt(formData.quantity) : 0,
            unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
            minStock: formData.minStock ? parseInt(formData.minStock) : 0,
            criticalLow: formData.criticalLow ? parseInt(formData.criticalLow) : 0,
        };

        try {
            const result = await updateComponent(id, componentData);
            if (result.success) {
                toast.success('Component updated successfully!');
                // Clear current component before navigating
                clearCurrentComponent();
                navigate('/inventory');
            } else {
                toast.error(result.error || 'Failed to update component');
            }
        } catch (error) {
            console.error('Error updating component:', error);
            toast.error('An unexpected error occurred');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600">
                <p>Error: {error}</p>
                <button
                    onClick={() => navigate('/inventory')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Back to Inventory
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Component</h1>
                <p className="text-gray-600">Update component information</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                            <input
                                type="text"
                                name="partNumber"
                                value={formData.partNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>

                {/* Inventory Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Inventory Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {units.map((unit, index) => (
                                    <option key={index} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                            <input
                                type="number"
                                name="unitPrice"
                                value={formData.unitPrice}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                            <input
                                type="number"
                                name="minStock"
                                value={formData.minStock}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Critical Low Level</label>
                            <input
                                type="number"
                                name="criticalLow"
                                value={formData.criticalLow}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Additional Information</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Datasheet Link</label>
                        <input
                            type="url"
                            name="datasheetLink"
                            value={formData.datasheetLink}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => {
                            clearCurrentComponent();
                            navigate('/inventory');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Update Component
                    </button>
                </div>
            </form>
        </div>
    );
}
