import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComponents } from '../contexts/ComponentsContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function StockMovement() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { components, fetchComponents, updateQuantity } = useComponents();
    const [loading, setLoading] = useState(false);
    const [componentLoading, setComponentLoading] = useState(true);
    const [formData, setFormData] = useState({
        componentId: '',
        type: 'inward',
        quantity: '',
        reason: '',
        project: '',
        location: '',
        supplier: '',
        invoiceNumber: '',
        cost: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComponent, setSelectedComponent] = useState(null);

    useEffect(() => {
        setComponentLoading(true);
        fetchComponents().finally(() => {
            setComponentLoading(false);
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleComponentSelect = (componentId) => {
        const component = components.find(c => c._id === componentId);
        setSelectedComponent(component);
        setFormData(prev => ({
            ...prev,
            componentId,
            location: component?.location || ''
        }));
    };

    const filteredComponents = components.filter(component => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            component.name.toLowerCase().includes(searchTermLower) ||
            component.partNumber.toLowerCase().includes(searchTermLower) ||
            (component.manufacturer && component.manufacturer.toLowerCase().includes(searchTermLower))
        );
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.componentId || !formData.quantity || !formData.type) {
                toast.error('Please fill in all required fields');
                setLoading(false);
                return;
            }

            // Validate quantity is a positive integer
            const quantity = parseInt(formData.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                toast.error('Quantity must be a positive number');
                setLoading(false);
                return;
            }

            // For outward movements, check if there's enough stock
            if (formData.type === 'outward' && selectedComponent && quantity > selectedComponent.quantity) {
                toast.error('Not enough stock available for outward movement');
                setLoading(false);
                return;
            }

            const result = await updateQuantity(formData.componentId, {
                type: formData.type,
                quantity: formData.quantity,
                reason: formData.reason,
                project: formData.project,
                location: formData.location,
                supplier: formData.supplier,
                invoiceNumber: formData.invoiceNumber,
                cost: formData.cost ? parseFloat(formData.cost) : undefined
            });

            if (result.success) {
                toast.success(`Stock ${formData.type} processed successfully!`);
                navigate('/logs');
            } else {
                toast.error(result.error || 'Failed to process stock movement');
            }
        } catch (error) {
            toast.error('An error occurred while processing the transaction');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/inventory');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Movement</h1>
                <p className="text-gray-600">Record inward and outward movements of components</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Movement Type */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Movement Type</h3>
                        <div className="flex space-x-4">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.type === 'inward' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="inward"
                                    checked={formData.type === 'inward'}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <div>
                                    <span className="block font-medium text-gray-900">Inward</span>
                                    <span className="block text-sm text-gray-500">Add components to inventory</span>
                                </div>
                            </label>
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.type === 'outward' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="outward"
                                    checked={formData.type === 'outward'}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <div>
                                    <span className="block font-medium text-gray-900">Outward</span>
                                    <span className="block text-sm text-gray-500">Remove components from inventory</span>
                                </div>
                            </label>
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.type === 'adjustment' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="adjustment"
                                    checked={formData.type === 'adjustment'}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <div>
                                    <span className="block font-medium text-gray-900">Adjustment</span>
                                    <span className="block text-sm text-gray-500">Correct inventory count</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Component Selection */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Component Selection</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Component <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name, part number, or manufacturer"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {componentLoading ? (
                                <div className="flex justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                                    {filteredComponents.length === 0 ? (
                                        <div className="p-3 text-center text-gray-500">
                                            {searchTerm ? 'No components match your search' : 'No components found'}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {filteredComponents.map(component => (
                                                <div
                                                    key={component._id}
                                                    onClick={() => handleComponentSelect(component._id)}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 ${formData.componentId === component._id ? 'bg-blue-50' : ''}`}
                                                >
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{component.name}</div>
                                                            <div className="text-sm text-gray-500">Part #: {component.partNumber}</div>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Qty: {component.quantity} {component.unit || 'pcs'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Component Information */}
                    {selectedComponent && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Selected Component</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-sm text-gray-500">Name</span>
                                    <span className="block text-sm font-medium">{selectedComponent.name}</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-gray-500">Part Number</span>
                                    <span className="block text-sm font-medium">{selectedComponent.partNumber}</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-gray-500">Current Stock</span>
                                    <span className="block text-sm font-medium">{selectedComponent.quantity} {selectedComponent.unit || 'pcs'}</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-gray-500">Location</span>
                                    <span className="block text-sm font-medium">{selectedComponent.location || 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Movement Details */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Movement Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter quantity"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter storage location"
                                />
                            </div>

                            {formData.type === 'inward' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Supplier
                                        </label>
                                        <input
                                            type="text"
                                            name="supplier"
                                            value={formData.supplier}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter supplier name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            name="invoiceNumber"
                                            value={formData.invoiceNumber}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter invoice number"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cost per Unit
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter cost per unit"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project
                                </label>
                                <input
                                    type="text"
                                    name="project"
                                    value={formData.project}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter reason for this transaction"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.componentId || !formData.quantity}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                                    Processing...
                                </>
                            ) : (
                                `Process ${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
