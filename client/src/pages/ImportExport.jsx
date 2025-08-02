import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useComponents } from '../contexts/ComponentsContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import BarcodeScanner from '../components/BarcodeScanner';

export default function ImportExport() {
    const { user } = useAuth();
    const { components, fetchComponents } = useComponents();
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [file, setFile] = useState(null);

    // Enhanced functionality
    const [activeTab, setActiveTab] = useState('components');
    const [exportFormat, setExportFormat] = useState('xlsx');
    const [exportOptions, setExportOptions] = useState({
        includeMetadata: true,
        includeQuantityHistory: false,
        includeNotes: true,
        dateRange: 'all',
        customStartDate: '',
        customEndDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [importProgress, setImportProgress] = useState({ total: 0, processed: 0, success: 0, errors: 0 });
    const [importErrors, setImportErrors] = useState([]);
    const [importType, setImportType] = useState('create'); // 'create', 'update', or 'both'

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                setFile(selectedFile);
            } else {
                toast.error('Please select a valid Excel file (.xlsx or .xls)');
                e.target.value = '';
            }
        }
    };

    const exportComponents = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/import-export/components/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            saveAs(blob, `components-export-${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Components exported successfully!');
        } catch (error) {
            toast.error('Failed to export components');
            console.error('Export error:', error);
        } finally {
            setExporting(false);
        }
    };

    const exportLogs = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/import-export/logs/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            saveAs(blob, `activity-logs-export-${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Activity logs exported successfully!');
        } catch (error) {
            toast.error('Failed to export activity logs');
            console.error('Export error:', error);
        } finally {
            setExporting(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/import-export/components/template', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Template download failed');
            }

            const blob = await response.blob();
            saveAs(blob, 'components-import-template.xlsx');
            toast.success('Template downloaded successfully!');
        } catch (error) {
            toast.error('Failed to download template');
            console.error('Template download error:', error);
        }
    };

    const importComponents = async () => {
        if (!file) {
            toast.error('Please select a file to import');
            return;
        }

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/import-export/components/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.msg || 'Import failed');
            }

            toast.success(`Import completed! ${result.results.successful} successful, ${result.results.failed} failed`);

            if (result.results.errors.length > 0) {
                console.log('Import errors:', result.results.errors);
                toast.warn(`${result.results.errors.length} errors occurred during import. Check console for details.`);
            }

            // Refresh components list
            await fetchComponents();
            setFile(null);
            document.getElementById('file-input').value = '';
        } catch (error) {
            toast.error(error.message || 'Failed to import components');
            console.error('Import error:', error);
        } finally {
            setImporting(false);
        }
    };

    const exportClientSide = () => {
        if (components.length === 0) {
            toast.error('No components to export');
            return;
        }

        // Prepare data for export
        const exportData = components.map(component => ({
            'Component Name': component.name,
            'Part Number': component.partNumber,
            'Category': component.category,
            'Description': component.description || '',
            'Quantity': component.quantity,
            'Unit': component.unit,
            'Unit Price': component.unitPrice || 0,
            'Location': component.location || '',
            'Minimum Stock': component.minStock || 0,
            'Critical Low': component.criticalLow || 0,
            'Manufacturer': component.manufacturer || '',
            'Datasheet Link': component.datasheetLink || ''
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Components');

        // Write file
        XLSX.writeFile(wb, `components-export-${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Components exported successfully!');
    };

    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
                    <p className="mt-1 text-sm text-gray-500">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Import/Export</h1>
                <p className="text-gray-600">Manage bulk data operations</p>
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Components</h4>
                        <p className="text-sm text-gray-600">Export all component data to Excel format</p>
                        <div className="flex space-x-2">
                            <button
                                onClick={exportComponents}
                                disabled={exporting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {exporting ? 'Exporting...' : 'Export Components'}
                            </button>
                            <button
                                onClick={exportClientSide}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Quick Export
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Activity Logs</h4>
                        <p className="text-sm text-gray-600">Export activity logs and transaction history</p>
                        <button
                            onClick={exportLogs}
                            disabled={exporting}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {exporting ? 'Exporting...' : 'Export Logs'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Import Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Components</h3>

                {/* Download Template */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Download Import Template</h4>
                    <p className="text-sm text-blue-700 mb-3">
                        Download the Excel template with the correct format for importing components
                    </p>
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Download Template
                    </button>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Excel File
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-green-600">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={importComponents}
                            disabled={!file || importing}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {importing ? 'Importing...' : 'Import Components'}
                        </button>

                        {file && (
                            <button
                                onClick={() => {
                                    setFile(null);
                                    document.getElementById('file-input').value = '';
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Clear File
                            </button>
                        )}
                    </div>
                </div>

                {/* Import Guidelines */}
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Import Guidelines</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Use the provided template format</li>
                        <li>• Required fields: Component Name, Part Number, Category</li>
                        <li>• Existing components will be updated based on Part Number</li>
                        <li>• Invalid data rows will be skipped</li>
                        <li>• Maximum file size: 5MB</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
