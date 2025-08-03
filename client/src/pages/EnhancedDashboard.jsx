import { useState, useEffect, useMemo } from 'react';
import { useComponents } from '../contexts/ComponentsContext';
import { useAuth } from '../contexts/AuthContext';
import { logsAPI, dashboardAPI, wasteAPI, notificationsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale } from 'chart.js';
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import { format, parseISO, subDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale);

export default function EnhancedDashboard() {
    const { user } = useAuth();
    const { stats, fetchStats, lowStockComponents, fetchLowStock } = useComponents();
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyMovement, setMonthlyMovement] = useState(null);
    const [criticalComponents, setCriticalComponents] = useState(null);
    const [chartView, setChartView] = useState('quantity'); // 'quantity' or 'unique'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [wasteData, setWasteData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    // Keep dashboardTheme but always set to 'light'
    const [dashboardTheme] = useState('light');

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchStats(),
                    fetchLowStock(),
                    fetchRecentLogs(),
                    fetchMonthlyMovement(),
                    fetchWasteData(),
                    fetchNotifications(),
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

    // Fetch waste data for dashboard
    const fetchWasteData = async () => {
        try {
            const response = await wasteAPI.getStatistics();
            setWasteData(response.data);
        } catch (error) {
            console.error('Failed to fetch waste statistics:', error);
        }
    };

    // Fetch notifications for dashboard
    const fetchNotifications = async () => {
        try {
            const response = await notificationsAPI.getAll({ limit: 5 });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Change month handler
    const changeMonth = (increment) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    // Toggle dashboard theme
    const toggleTheme = () => {
        // Dark mode toggle removed
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
            value: `₹${(stats?.totalValue || 0).toLocaleString()}`,
            icon: (
                <span className="text-2xl font-semibold w-6 h-6 text-green-600" viewBox="0 0 24 24">₹</span>
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

    // Function to generate colors for any number of categories
    const generateColors = (count) => {
        const baseColors = [
            [59, 130, 246],   // Blue
            [16, 185, 129],   // Green
            [245, 158, 11],   // Amber
            [239, 68, 68],    // Red
            [139, 92, 246],   // Purple
            [236, 72, 153],   // Pink
            [6, 182, 212],    // Cyan
            [249, 115, 22],   // Orange
            [168, 85, 247],   // Violet
            [37, 99, 235],    // Indigo
            [234, 88, 12],    // Dark Orange
            [5, 150, 105]     // Emerald
        ];

        // If we have more categories than colors, generate additional ones
        const backgroundColors = [];
        const borderColors = [];

        if (count <= baseColors.length) {
            // If we have fewer categories than base colors, use the base colors
            for (let i = 0; i < count; i++) {
                const [r, g, b] = baseColors[i];
                backgroundColors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
                borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
            }
        } else {
            // Use all base colors first
            for (let i = 0; i < baseColors.length; i++) {
                const [r, g, b] = baseColors[i];
                backgroundColors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
                borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
            }

            // Generate additional colors using HSL for better distribution
            for (let i = baseColors.length; i < count; i++) {
                // Golden angle approximation for even distribution of hues
                const hue = (i * 137.5) % 360;
                const saturation = 70;
                const lightness = 60;

                backgroundColors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
                borderColors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 1)`);
            }
        }

        return { backgroundColors, borderColors };
    };

    const categoryCount = stats?.categoryStats?.length || 0;
    const categoryColors = useMemo(() => generateColors(categoryCount), [categoryCount]);

    // Create category chart data with optimized display for many categories
    const categoryChartData = useMemo(() => {
        if (!stats?.categoryStats || stats.categoryStats.length === 0) {
            return {
                labels: [],
                datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
            };
        }

        // Limit categories for better visibility, group small ones into "Other"
        const MAX_VISIBLE_CATEGORIES = 8;
        const sortedCategories = [...stats.categoryStats].sort((a, b) => b.count - a.count);

        let labels = [];
        let data = [];
        let backgroundColors = [];
        let borderColors = [];

        if (sortedCategories.length > MAX_VISIBLE_CATEGORIES) {
            // Take top categories
            const topCategories = sortedCategories.slice(0, MAX_VISIBLE_CATEGORIES - 1);

            // Group the rest into "Other"
            const otherCount = sortedCategories
                .slice(MAX_VISIBLE_CATEGORIES - 1)
                .reduce((sum, cat) => sum + cat.count, 0);

            // Add the top categories
            topCategories.forEach((cat, index) => {
                labels.push(cat._id);
                data.push(cat.count);
                backgroundColors.push(categoryColors.backgroundColors[index]);
                borderColors.push(categoryColors.borderColors[index]);
            });

            // Add the "Other" category if there are any remaining categories
            if (otherCount > 0) {
                labels.push("Other");
                data.push(otherCount);
                // Use gray for "Other" category
                backgroundColors.push("rgba(160, 160, 160, 0.8)");
                borderColors.push("rgba(160, 160, 160, 1)");
            }
        } else {
            // If we have few categories, show all of them
            sortedCategories.forEach((cat, index) => {
                labels.push(cat._id);
                data.push(cat.count);
                backgroundColors.push(categoryColors.backgroundColors[index]);
                borderColors.push(categoryColors.borderColors[index]);
            });
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Components by Category',
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                }
            ]
        };
    }, [stats?.categoryStats, categoryColors]);

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

    // Chart options
    const getChartOptions = (position = 'bottom', showTitle = false, titleText = '', showPercentages = false) => ({
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position,
                align: position === 'right' ? 'start' : 'center',
                labels: {
                    color: dashboardTheme === 'dark' ? '#e5e7eb' : '#374151',
                    font: {
                        size: position === 'right' ? 11 : 12
                    },
                    boxWidth: position === 'right' ? 12 : 40,
                    padding: position === 'right' ? 15 : 10
                }
            },
            title: {
                display: showTitle,
                text: titleText,
                color: dashboardTheme === 'dark' ? '#e5e7eb' : '#374151',
                font: {
                    size: 14,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: showPercentages ? {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                } : {}
            }
        },
    });

    const chartOptions = getChartOptions('bottom', false, '', true);

    const barChartOptions = {
        ...getChartOptions(
            'top',
            true,
            chartView === 'quantity'
                ? 'Monthly Component Movement (Quantity)'
                : 'Monthly Component Movement (Unique Components)'
        ),
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: chartView === 'quantity'
                        ? 'Number of Components'
                        : 'Unique Components'
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

    // Prepare waste data for charts
    const wasteChartData = {
        labels: wasteData?.wasteTypes?.map(type => type._id) || [],
        datasets: [{
            label: 'Waste Distribution by Type',
            data: wasteData?.wasteTypes?.map(type => type.count) || [],
            backgroundColor: [
                'rgba(239, 68, 68, 0.7)',  // red
                'rgba(245, 158, 11, 0.7)', // amber
                'rgba(16, 185, 129, 0.7)', // green
                'rgba(59, 130, 246, 0.7)', // blue
                'rgba(139, 92, 246, 0.7)', // purple
                'rgba(236, 72, 153, 0.7)',  // pink
                'rgba(75, 85, 99, 0.7)',   // gray
                'rgba(107, 114, 128, 0.7)' // gray
            ],
            borderWidth: 1
        }]
    };

    const dashboardClasses = 'bg-white text-gray-900';

    return (
        <div className={`p-6 space-y-4 ${dashboardClasses}`}>
            {/* Enhanced Header */}
            <div className="rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-100">
                <div className="flex justify-between items-start dashboard-header">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-2 text-gray-600">
                            Welcome back, {user?.name}. Here's what's happening in your lab today.
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {quickStats.map((stat, index) => (
                    <div
                        key={index}
                        className={`rounded-lg shadow-sm border-2 ${stat.borderColor} p-6 hover:shadow-md transition-shadow
                            ${dashboardTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${dashboardTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {stat.name}
                                </p>
                                <p className={`text-3xl font-bold mt-2 ${dashboardTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.value}
                                </p>
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
                <div className={`rounded-lg shadow-sm border ${dashboardTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`p-6 border-b ${dashboardTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-lg font-semibold ${dashboardTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Monthly Component Movement</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Critical Stock Section */}
                <div className="lg:col-span-2 space-y-4">
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
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-3">
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
                <div className="space-y-4">
                    {/* Waste Statistics Chart */}
                    <div className={`rounded-lg shadow-sm border ${dashboardTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className={`p-6 border-b ${dashboardTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-lg font-semibold ${dashboardTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Waste Management</h2>
                                <Link
                                    to="/waste-tracking"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Manage waste
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {!wasteData ? (
                                <div className="flex justify-center items-center h-48">
                                    <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : (
                                <div>
                                    <div className="h-60">
                                        <PolarArea
                                            data={wasteChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'right',
                                                        labels: {
                                                            color: '#374151',
                                                            font: {
                                                                size: 12
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    r: {
                                                        ticks: {
                                                            color: '#374151',
                                                        },
                                                        grid: {
                                                            color: 'rgba(0, 0, 0, 0.1)',
                                                        },
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                            <p className="text-sm text-gray-600">Total Waste Entries</p>
                                            <p className="text-xl font-bold text-red-700">{wasteData?.totalEntries || 0}</p>
                                        </div>
                                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                            <p className="text-sm text-gray-600">High Hazard Items</p>
                                            <p className="text-xl font-bold text-orange-700">{wasteData?.highHazardCount || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Status Chart */}
                    <div className={`rounded-lg shadow-sm border ${dashboardTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className={`p-6 border-b ${dashboardTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h2 className={`text-lg font-semibold ${dashboardTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stock Status</h2>
                        </div>
                        <div className="p-6">
                            <div className="h-64">
                                <Doughnut data={stockStatusData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Category Chart */}
                    {stats?.categoryStats && stats.categoryStats.length > 0 && (
                        <div className={`rounded-lg shadow-sm border ${dashboardTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className={`p-6 border-b ${dashboardTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h2 className={`text-lg font-semibold ${dashboardTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Category Distribution</h2>
                            </div>
                            <div className="p-6">
                                <div className="h-64">
                                    <Doughnut
                                        data={categoryChartData}
                                        options={getChartOptions('right', false, '', true)}
                                    />
                                </div>
                                {stats.categoryStats.length > 8 && (
                                    <div className={`mt-4 max-h-36 overflow-y-auto p-3 rounded-lg border ${dashboardTheme === 'dark'
                                        ? 'bg-gray-700 border-gray-600'
                                        : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <p className={`text-xs font-medium mb-2 ${dashboardTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                                            }`}>All Categories</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {stats.categoryStats.map((cat, index) => (
                                                <div key={cat._id} className="flex items-center text-xs">
                                                    <div
                                                        className="w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: categoryColors.backgroundColors[index % categoryColors.backgroundColors.length] }}
                                                    ></div>
                                                    <span className={`truncate ${dashboardTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                        }`} title={`${cat._id} (${cat.count})`}>
                                                        {cat._id} ({cat.count})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Card removed */}
                </div>
            </div>

            {/* Recent Activity with reduced spacing */}
            <div className="mt-3 rounded-lg shadow-sm border bg-white border-gray-200">
                <div className={`p-6 border-b ${dashboardTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h2 className={`text-lg font-semibold ${dashboardTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
                </div>
                <div className="p-6">
                    {recentLogs.length === 0 ? (
                        <p className={`text-center py-4 ${dashboardTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No recent activity</p>
                    ) : (
                        <div className="space-y-4">
                            {recentLogs.map((log) => (
                                <div key={log._id} className={`flex items-center space-x-3 p-3 rounded-lg
                                    ${dashboardTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
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
