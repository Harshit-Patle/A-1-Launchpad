import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function AdvancedReports() {
    const { user } = useAuth();
    const [reportData, setReportData] = useState({});
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState({
        pdf: false,
        xlsx: false
    });
    const [selectedReport, setSelectedReport] = useState('inventory-overview');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReportData();
    }, [selectedReport, dateRange]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reports/${selectedReport}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setReportData(data);
            }
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (format) => {
        // Set loading state for the specific format
        setExportLoading(prev => ({ ...prev, [format]: true }));

        try {
            toast.info(`Preparing ${format.toUpperCase()} export...`);

            const response = await fetch(`/api/reports/${selectedReport}/export?format=${format}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Export failed: ${errorText || response.statusText}`);
            }

            // Verify the content type
            const contentType = response.headers.get('content-type');
            if (format === 'pdf' && !contentType?.includes('application/pdf')) {
                throw new Error(`Expected PDF but got ${contentType}`);
            }

            if (format === 'xlsx' && !contentType?.includes('spreadsheetml')) {
                throw new Error(`Expected Excel file but got ${contentType}`);
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Received empty response from server');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(`${format.toUpperCase()} export completed successfully!`);
        } catch (error) {
            console.error('Failed to export report:', error);
            toast.error(`Export failed: ${error.message}`);
        } finally {
            setExportLoading(prev => ({ ...prev, [format]: false }));
        }
    };

    const reportTypes = [
        { id: 'inventory-overview', name: 'Inventory Overview', icon: '📊' },
        { id: 'usage-analytics', name: 'Usage Analytics', icon: '📈' },
        { id: 'cost-analysis', name: 'Cost Analysis', icon: '💰' },
        { id: 'stock-movement', name: 'Stock Movement', icon: '📦' },
        { id: 'compliance-report', name: 'Compliance Report', icon: '📋' },
        { id: 'vendor-analysis', name: 'Vendor Analysis', icon: '🏢' },
        { id: 'waste-tracking', name: 'Waste Tracking', icon: '♻️' },
        { id: 'reservation-report', name: 'Reservation Report', icon: '📅' }
    ];

    const renderInventoryOverview = () => {
        if (!reportData.categoryStats) return null;

        const categoryData = {
            labels: reportData.categoryStats.map(stat => stat._id),
            datasets: [{
                label: 'Components by Category',
                data: reportData.categoryStats.map(stat => stat.count),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                ],
            }]
        };

        const valueData = {
            labels: reportData.categoryStats.map(stat => stat._id),
            datasets: [{
                label: 'Total Value by Category ($)',
                data: reportData.categoryStats.map(stat => stat.totalValue),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
            }]
        };

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">{reportData.summary?.totalComponents || 0}</div>
                        <div className="text-gray-600">Total Components</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">{reportData.summary?.totalCategories || 0}</div>
                        <div className="text-gray-600">Categories</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">${(reportData.summary?.totalValue || 0).toLocaleString()}</div>
                        <div className="text-gray-600">Total Value</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">{reportData.summary?.lowStockCount || 0}</div>
                        <div className="text-gray-600">Low Stock Items</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Components by Category</h3>
                        <div className="h-64">
                            <Pie data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Value by Category</h3>
                        <div className="h-64">
                            <Bar data={valueData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsageAnalytics = () => {
        if (!reportData.usageData) return null;

        const usageData = {
            labels: reportData.usageData.map(item => item.date),
            datasets: [
                {
                    label: 'Inward',
                    data: reportData.usageData.map(item => item.inward),
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                },
                {
                    label: 'Outward',
                    data: reportData.usageData.map(item => item.outward),
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                }
            ]
        };

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Stock Movement Trends</h3>
                    <div className="h-96">
                        <Line
                            data={usageData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {reportData.topUsedComponents && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Most Used Components</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.topUsedComponents.map((component, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {component.componentName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {component.usageCount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {component.totalQuantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {component.currentStock}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCostAnalysis = () => {
        if (!reportData.costData) return null;

        const monthlySpending = {
            labels: reportData.costData.monthlySpending?.map(item => item.month) || [],
            datasets: [{
                label: 'Monthly Spending ($)',
                data: reportData.costData.monthlySpending?.map(item => item.amount) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            }]
        };

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">
                            ${(reportData.costData.totalSpending || 0).toLocaleString()}
                        </div>
                        <div className="text-gray-600">Total Spending</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">
                            ${(reportData.costData.averageMonthlySpending || 0).toLocaleString()}
                        </div>
                        <div className="text-gray-600">Avg Monthly Spending</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">
                            ${(reportData.costData.inventoryValue || 0).toLocaleString()}
                        </div>
                        <div className="text-gray-600">Current Inventory Value</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
                    <div className="h-64">
                        <Bar data={monthlySpending} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                {reportData.costData.expensiveComponents && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Most Expensive Components</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.costData.expensiveComponents.map((component, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {component.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${component.unitPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {component.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${(component.unitPrice * component.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderComplianceReport = () => {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-green-600">95%</div>
                        <div className="text-gray-600">Compliance Score</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">3</div>
                        <div className="text-gray-600">Expired Items</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">12</div>
                        <div className="text-gray-600">Missing Datasheets</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-2xl font-bold text-gray-900">2</div>
                        <div className="text-gray-600">Audit Findings</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Compliance Checklist</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">Inventory Tracking</span>
                            </div>
                            <span className="text-green-600 font-semibold">✓ Compliant</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">User Access Controls</span>
                            </div>
                            <span className="text-green-600 font-semibold">✓ Compliant</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="font-medium">Documentation Completeness</span>
                            </div>
                            <span className="text-yellow-600 font-semibold">⚠ Needs Attention</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">Audit Trail</span>
                            </div>
                            <span className="text-green-600 font-semibold">✓ Compliant</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderReportContent = () => {
        switch (selectedReport) {
            case 'inventory-overview':
                return renderInventoryOverview();
            case 'usage-analytics':
                return renderUsageAnalytics();
            case 'cost-analysis':
                return renderCostAnalysis();
            case 'compliance-report':
                return renderComplianceReport();
            default:
                return (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-gray-500">
                            Report data for "{selectedReport}" is not available yet.
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Advanced Reports</h1>
                    <p className="text-gray-600">Comprehensive analytics and insights</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => exportReport('pdf')}
                        disabled={exportLoading.pdf}
                        className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${exportLoading.pdf ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {exportLoading.pdf ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Export PDF'
                        )}
                    </button>
                    <button
                        onClick={() => exportReport('xlsx')}
                        disabled={exportLoading.xlsx}
                        className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${exportLoading.xlsx ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {exportLoading.xlsx ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Export Excel'
                        )}
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                        <select
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {reportTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                renderReportContent()
            )}
        </div>
    );
}
