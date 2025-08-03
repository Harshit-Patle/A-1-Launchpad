import { useState, useEffect } from 'react';
import { useComponents } from '../contexts/ComponentsContext';
import { useAuth } from '../contexts/AuthContext';
import { logsAPI, dashboardAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function EnhancedDashboard() {
    const { user } = useAuth();
    const { stats, fetchStats, lowStockComponents, fetchLowStock } = useComponents();
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyMovement, setMonthlyMovement] = useState(null);
    const [criticalComponents, setCriticalComponents] = useState(null);
    const [chartView, setChartView] = useState('quantity'); // 'quantity' or 'unique'
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchStats(),
                    fetchLowStock(),
                    fetchRecentLogs(),
                    fetchMonthlyMovement(),
                    fetchCriticalComponents()
                ]);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [currentDate]);

    const fetchRecentLogs = async () => {
        try {
            const response = await logsAPI.getAll({ limit: 5 });
            setRecentLogs(response.data.logs);
        } catch (error) {
            console.error('Failed to fetch recent logs:', error);
        }
    };

    const fetchMonthlyMovement = async () => {
        try {
            const month = currentDate.getMonth() + 1; // Months are 0-indexed in JS
            const year = currentDate.getFullYear();
            const response = await dashboardAPI.getMonthlyMovement({ month, year });
            setMonthlyMovement(response.data);
        } catch (error) {
            console.error('Failed to fetch monthly movement data:', error);
        }
    };

    const fetchCriticalComponents = async () => {
        try {
            const response = await dashboardAPI.getCriticalComponents();
            setCriticalComponents(response.data);
        } catch (error) {
            console.error('Failed to fetch critical components:', error);
        }
    };

    // Change month handler
    const changeMonth = (increment) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    // Enhanced Quick Stats with better visuals
    const quickStats = [
        {
            name: 'Total Components',
            value: stats?.totalComponents || 0,
            icon: (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            name: 'Low Stock Items',
            value: stats?.lowStockCount || 0,
            icon: (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        },
        {
            name: 'Total Value',
            value: `$${(stats?.totalValue || 0).toLocaleString()}`,
            icon: (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            ),
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            name: 'Categories',
            value: stats?.categoryStats?.length || 0,
            icon: (
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        }
    ];

    // Chart data for monthly movement
    const generateMovementChartData = () => {
        if (!monthlyMovement || !monthlyMovement.dailyStats) {
            return null;
        }

        // Extract dates and sort them chronologically
        const dates = monthlyMovement.dailyStats.map(stat => stat.date).sort();

        // Create datasets based on the selected view (quantity or unique components)
        const inwardData = dates.map(date => {
            const dayStat = monthlyMovement.dailyStats.find(s => s.date === date);
            return chartView === 'quantity'
                ? dayStat?.inward.totalQuantity || 0
                : dayStat?.inward.uniqueComponents || 0;
        });

        const outwardData = dates.map(date => {
            const dayStat = monthlyMovement.dailyStats.find(s => s.date === date);
            return chartView === 'quantity'
                ? dayStat?.outward.totalQuantity || 0
                : dayStat?.outward.uniqueComponents || 0;
        });

        // Format dates for display
        const formattedDates = dates.map(date => format(parseISO(date), 'MMM d'));

        return {
            labels: formattedDates,
            datasets: [
                {
                    label: 'Inward',
                    data: inwardData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Outward',
                    data: outwardData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                }
            ]
        };
    };

    const categoryChartData = {
        labels: stats?.categoryStats?.map(cat => cat._id) || [],
        datasets: [
            {
                label: 'Components by Category',
                data: stats?.categoryStats?.map(cat => cat.count) || [],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const stockStatusData = {
        labels: ['In Stock', 'Low Stock', 'Out of Stock'],
        datasets: [
            {
                data: [
                    (stats?.totalComponents || 0) - (stats?.lowStockCount || 0) - (criticalComponents?.outOfStock?.length || 0),
                    stats?.lowStockCount || 0,
                    criticalComponents?.outOfStock?.length || 0,
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: false,
            },
        },
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: chartView === 'quantity'
                    ? 'Monthly Component Movement (Quantity)'
                    : 'Monthly Component Movement (Unique Components)',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: chartView === 'quantity'
                        ? 'Number of Components'
                        : 'Unique Components',
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back, {user?.name}. Here's what's happening in your lab today.</p>
                <div className="mt-4 flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickStats.map((stat, index) => (
                    <div key={index} className={`bg-white rounded-lg shadow-sm border-2 ${stat.borderColor} p-6 hover:shadow-md transition-shadow`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Movement Chart */}
            {monthlyMovement && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Monthly Component Movement</h2>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="text-sm font-medium">
                                        {format(currentDate, 'MMMM yyyy')}
                                    </span>
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="border-l border-gray-300 pl-4">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setChartView('quantity')}
                                            className={`text-xs px-3 py-1 rounded-full ${chartView === 'quantity'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Quantity
                                        </button>
                                        <button
                                            onClick={() => setChartView('unique')}
                                            className={`text-xs px-3 py-1 rounded-full ${chartView === 'unique'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Unique Components
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="h-80">
                            <Bar
                                data={generateMovementChartData()}
                                options={barChartOptions}
                            />
                        </div>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h3 className="text-sm font-medium text-green-800">Inward Summary</h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Quantity:</span>
                                        <span className="font-medium">{monthlyMovement.monthlyTotals.inward.totalQuantity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Unique Components:</span>
                                        <span className="font-medium">{monthlyMovement.monthlyTotals.inward.uniqueComponents}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                <h3 className="text-sm font-medium text-red-800">Outward Summary</h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Quantity:</span>
                                        <span className="font-medium">{monthlyMovement.monthlyTotals.outward.totalQuantity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Unique Components:</span>
                                        <span className="font-medium">{monthlyMovement.monthlyTotals.outward.uniqueComponents}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Critical Stock Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Low Stock Alerts */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
                                <Link
                                    to="/inventory?filter=lowStock"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {criticalComponents && criticalComponents.lowStock.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500">No low stock items</p>
                                    <p className="text-sm text-gray-400 mt-1">All components are well stocked!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {criticalComponents && criticalComponents.lowStock.slice(0, 5).map((component) => (
                                        <div key={component._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <div>
                                                <p className="font-medium text-gray-900">{component.name}</p>
                                                <p className="text-sm text-gray-600">{component.partNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-yellow-800">
                                                    {component.quantity} remaining
                                                </p>
                                                <p className="text-xs text-yellow-600">
                                                    Critical: {component.criticalLow}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {criticalComponents && criticalComponents.lowStock.length > 5 && (
                                        <p className="text-sm text-gray-500 text-center pt-2">
                                            And {criticalComponents.lowStock.length - 5} more items...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Old Stock (3+ Months) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Old Stock (3+ Months)</h2>
                                <Link
                                    to="/inventory?sort=oldestFirst"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {criticalComponents && criticalComponents.oldStock.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500">No old stock items</p>
                                    <p className="text-sm text-gray-400 mt-1">All inventory is moving regularly!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {criticalComponents && criticalComponents.oldStock.slice(0, 5).map((component) => (
                                        <div key={component._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div>
                                                <p className="font-medium text-gray-900">{component.name}</p>
                                                <p className="text-sm text-gray-600">{component.partNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-blue-800">
                                                    {component.quantity} in stock
                                                </p>
                                                <p className="text-xs text-blue-600">
                                                    {component.daysSinceLastMovement} days without movement
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {criticalComponents && criticalComponents.oldStock.length > 5 && (
                                        <p className="text-sm text-gray-500 text-center pt-2">
                                            And {criticalComponents.oldStock.length - 5} more items...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts & Quick Actions */}
                <div className="space-y-6">
                    {/* Stock Status Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Stock Status</h2>
                        </div>
                        <div className="p-6">
                            <div className="h-64">
                                <Doughnut data={stockStatusData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Category Chart */}
                    {stats?.categoryStats && stats.categoryStats.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Category Distribution</h2>
                            </div>
                            <div className="p-6">
                                <div className="h-64">
                                    <Doughnut data={categoryChartData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link
                                to="/add-component"
                                className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add New Component
                            </Link>
                            <Link
                                to="/inventory"
                                className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                View Inventory
                            </Link>
                            <Link
                                to="/logs"
                                className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Activity Logs
                            </Link>
                            {user?.role === 'Admin' && (
                                <Link
                                    to="/reports"
                                    className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Advanced Reports
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-6">
                    {recentLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                    ) : (
                        <div className="space-y-4">
                            {recentLogs.map((log) => (
                                <div key={log._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        {log.type === 'inward' ? (
                                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                        ) : log.type === 'outward' ? (
                                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                        ) : (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{log.type ? log.type.toUpperCase() : 'ACTION'}</span> - {log.componentId?.name || 'Unknown Component'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {log.userName} • {new Date(log.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            Qty: {log.quantity}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {log.reason}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
