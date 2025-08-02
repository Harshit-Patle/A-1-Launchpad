import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        general: {
            siteName: 'A-1 Launchpad',
            description: 'Laboratory Inventory Management System',
            contactEmail: 'admin@a1launchpad.com',
            dateFormat: 'MM/DD/YYYY',
            timeZone: 'UTC'
        },
        notifications: {
            emailNotifications: true,
            lowStockAlerts: true,
            expiryAlerts: true,
            stockThreshold: 10,
            expiryThresholdDays: 30,
            dailyDigest: false
        },
        security: {
            passwordExpiry: 90,
            sessionTimeout: 30,
            enforceTwoFactor: false,
            lockoutAttempts: 5,
            requireStrongPassword: true
        },
        backup: {
            autoBackup: true,
            backupFrequency: 'daily',
            retentionPeriod: 30,
            backupTime: '01:00'
        },
        integrations: {
            enableApiAccess: false,
            enableVendorPortal: false,
            enableEmailService: true
        }
    });

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // In a real app, this would fetch from the server
            const response = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Using default settings if fetch fails
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // In a real app, this would send to the server
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast.success('Settings saved successfully!');
            } else {
                const error = await response.json();
                toast.error(error.msg || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const renderGeneralSettings = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Site Name</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.general.siteName}
                        onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.general.contactEmail}
                        onChange={(e) => handleChange('general', 'contactEmail', e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Site Description</label>
                <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={settings.general.description}
                    onChange={(e) => handleChange('general', 'description', e.target.value)}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date Format</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.general.dateFormat}
                        onChange={(e) => handleChange('general', 'dateFormat', e.target.value)}
                    >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.general.timeZone}
                        onChange={(e) => handleChange('general', 'timeZone', e.target.value)}
                    >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive system notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => handleChange('notifications', 'emailNotifications', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Low Stock Alerts</h4>
                    <p className="text-sm text-gray-500">Get alerts when components fall below threshold</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.lowStockAlerts}
                        onChange={(e) => handleChange('notifications', 'lowStockAlerts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Expiry Alerts</h4>
                    <p className="text-sm text-gray-500">Get alerts when components are near expiry</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.expiryAlerts}
                        onChange={(e) => handleChange('notifications', 'expiryAlerts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Daily Digest</h4>
                    <p className="text-sm text-gray-500">Receive a daily summary of system activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.dailyDigest}
                        onChange={(e) => handleChange('notifications', 'dailyDigest', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Alert Threshold</label>
                    <input
                        type="number"
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.notifications.stockThreshold}
                        onChange={(e) => handleChange('notifications', 'stockThreshold', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Alert Threshold (Days)</label>
                    <input
                        type="number"
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.notifications.expiryThresholdDays}
                        onChange={(e) => handleChange('notifications', 'expiryThresholdDays', parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password Expiry (Days)</label>
                    <input
                        type="number"
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.security.passwordExpiry}
                        onChange={(e) => handleChange('security', 'passwordExpiry', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500 mt-1">0 means no expiry</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Session Timeout (Minutes)</label>
                    <input
                        type="number"
                        min="5"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Account Lockout After (Failed Attempts)</label>
                    <input
                        type="number"
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.security.lockoutAttempts}
                        onChange={(e) => handleChange('security', 'lockoutAttempts', parseInt(e.target.value) || 5)}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Enforce Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Require all users to set up 2FA</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.security.enforceTwoFactor}
                        onChange={(e) => handleChange('security', 'enforceTwoFactor', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Require Strong Passwords</h4>
                    <p className="text-sm text-gray-500">Enforce passwords with numbers, uppercase, lowercase, and symbols</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.security.requireStrongPassword}
                        onChange={(e) => handleChange('security', 'requireStrongPassword', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>
    );

    const renderBackupSettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Automatic Backups</h4>
                    <p className="text-sm text-gray-500">Automatically create database backups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.backup.autoBackup}
                        onChange={(e) => handleChange('backup', 'autoBackup', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.backup.backupFrequency}
                        onChange={(e) => handleChange('backup', 'backupFrequency', e.target.value)}
                    >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Time</label>
                    <input
                        type="time"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={settings.backup.backupTime}
                        onChange={(e) => handleChange('backup', 'backupTime', e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Retention Period (Days)</label>
                <input
                    type="number"
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={settings.backup.retentionPeriod}
                    onChange={(e) => handleChange('backup', 'retentionPeriod', parseInt(e.target.value) || 30)}
                />
            </div>

            <div className="pt-4">
                <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Create Manual Backup Now
                </button>

                <button
                    type="button"
                    className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    View Backup History
                </button>
            </div>
        </div>
    );

    const renderIntegrationSettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">API Access</h4>
                    <p className="text-sm text-gray-500">Allow external applications to access the system via API</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.integrations.enableApiAccess}
                        onChange={(e) => handleChange('integrations', 'enableApiAccess', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Vendor Portal</h4>
                    <p className="text-sm text-gray-500">Allow vendors to access a limited portal</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.integrations.enableVendorPortal}
                        onChange={(e) => handleChange('integrations', 'enableVendorPortal', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900">Email Service</h4>
                    <p className="text-sm text-gray-500">Enable email sending from the system</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.integrations.enableEmailService}
                        onChange={(e) => handleChange('integrations', 'enableEmailService', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {settings.integrations.enableApiAccess && (
                <div className="border p-4 rounded-md bg-gray-50 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">API Settings</h4>
                    <p className="text-sm text-gray-700 mb-4">
                        Manage your API keys and access tokens for external integrations.
                    </p>
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Manage API Keys
                    </button>
                </div>
            )}

            {settings.integrations.enableEmailService && (
                <div className="border p-4 rounded-md bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">Email Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Server</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="smtp.example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="587"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Test Connection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralSettings();
            case 'notifications':
                return renderNotificationSettings();
            case 'security':
                return renderSecuritySettings();
            case 'backup':
                return renderBackupSettings();
            case 'integrations':
                return renderIntegrationSettings();
            default:
                return renderGeneralSettings();
        }
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600">Configure system-wide preferences and options</p>
            </div>

            {/* Settings Container */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px overflow-x-auto">
                        <button
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'general'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('general')}
                        >
                            General
                        </button>
                        <button
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'notifications'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('notifications')}
                        >
                            Notifications
                        </button>
                        <button
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'security'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('security')}
                        >
                            Security
                        </button>
                        <button
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'backup'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('backup')}
                        >
                            Backup & Restore
                        </button>
                        <button
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'integrations'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('integrations')}
                        >
                            Integrations
                        </button>
                    </nav>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        {renderTabContent()}
                    </div>

                    <div className="bg-gray-50 px-6 py-3 flex justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
