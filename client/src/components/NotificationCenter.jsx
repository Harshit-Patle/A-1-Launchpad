import { useState, useEffect } from 'react';
import { useComponents } from '../contexts/ComponentsContext';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch notifications from the server
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationsAPI.getAll();

            // Transform server notifications to the format used in the component
            const formattedNotifications = response.data.notifications.map(n => ({
                id: n._id,
                type: getNotificationType(n.type),
                title: n.title,
                message: n.message,
                timestamp: new Date(n.createdAt),
                read: n.isRead,
                data: n.data,
                priority: n.priority
            }));

            setNotifications(formattedNotifications);
            setUnreadCount(response.data.unreadCount);
            setError(null);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Convert server notification type to UI notification type
    const getNotificationType = (serverType) => {
        switch (serverType) {
            case 'low_stock':
                return 'warning';
            case 'old_stock':
                return 'clock';  // Using clock icon for old stock alerts
            case 'maintenance_due':
                return 'primary';
            case 'approval_required':
                return 'secondary';
            case 'reservation_reminder':
                return 'info';
            case 'system_alert':
                return 'error';
            default:
                return 'info';
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Poll for notifications every minute
        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            await notificationsAPI.markAsRead(notificationId);

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    const getNotificationIcon = (type, priority) => {
        // First determine the color based on priority
        let colorClass;
        switch (priority) {
            case 'critical':
                colorClass = 'text-red-600';
                break;
            case 'high':
                colorClass = 'text-orange-600';
                break;
            case 'medium':
                colorClass = 'text-yellow-600';
                break;
            case 'low':
                colorClass = 'text-blue-600';
                break;
            default:
                colorClass = 'text-gray-600';
        }

        // Then determine the icon based on type
        switch (type) {
            case 'warning':
                return (
                    <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
            case 'clock':
                return (
                    <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-sm text-gray-500">Loading notifications...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-red-500">
                        <svg className="mx-auto w-12 h-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                        <button
                            onClick={fetchNotifications}
                            className="text-blue-500 hover:text-blue-700 text-sm mt-2"
                        >
                            Try again
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <svg className="mx-auto w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p>No notifications</p>
                        <p className="text-xs mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notification.priority === 'critical' ? 'bg-red-50' :
                                    notification.priority === 'high' ? 'bg-orange-50' :
                                        !notification.read ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    {getNotificationIcon(notification.type, notification.priority)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-medium ${notification.priority === 'critical' ? 'text-red-800' :
                                                notification.priority === 'high' ? 'text-orange-800' :
                                                    'text-gray-900'
                                            }`}>
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <div className={`w-2 h-2 rounded-full ${notification.priority === 'critical' ? 'bg-red-600' :
                                                    notification.priority === 'high' ? 'bg-orange-600' :
                                                        'bg-blue-600'
                                                }`}></div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {notification.timestamp.toLocaleTimeString()} - {notification.timestamp.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {unreadCount > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-600">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
