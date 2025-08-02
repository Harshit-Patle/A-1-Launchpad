import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function UserProfile() {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: '',
        bio: '',
        avatarUrl: '',
        preferences: {
            notifications: true,
            emailAlerts: true,
            theme: 'light',
            language: 'en',
            dateFormat: 'MM/DD/YYYY',
            useCompactView: false,
            lowStockNotification: true,
            expiryNotification: true
        },
        security: {
            twoFactorEnabled: false,
            lastPasswordChange: null,
            passwordExpiryDays: 90,
            apiTokens: []
        }
    });
    const fileInputRef = useRef(null);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [activityLogs, setActivityLogs] = useState([]);
    const [apiTokenForm, setApiTokenForm] = useState({
        name: '',
        expiresIn: '30'
    });
    const [showApiTokenForm, setShowApiTokenForm] = useState(false);
    const [newToken, setNewToken] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || '',
                role: user.role || '',
                bio: user.bio || '',
                avatarUrl: user.avatarUrl || '',
                preferences: {
                    notifications: user.preferences?.notifications ?? true,
                    emailAlerts: user.preferences?.emailAlerts ?? true,
                    theme: user.preferences?.theme || 'light',
                    language: user.preferences?.language || 'en',
                    dateFormat: user.preferences?.dateFormat || 'MM/DD/YYYY',
                    useCompactView: user.preferences?.useCompactView ?? false,
                    lowStockNotification: user.preferences?.lowStockNotification ?? true,
                    expiryNotification: user.preferences?.expiryNotification ?? true
                },
                security: {
                    twoFactorEnabled: user.security?.twoFactorEnabled ?? false,
                    lastPasswordChange: user.security?.lastPasswordChange || null,
                    passwordExpiryDays: user.security?.passwordExpiryDays || 90,
                    apiTokens: user.security?.apiTokens || []
                }
            });
        }

        // Fetch user activity logs
        const fetchActivityLogs = async () => {
            try {
                const response = await fetch('/api/users/activity-logs', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setActivityLogs(data);
                }
            } catch (error) {
                console.error('Error fetching activity logs:', error);
            }
        };

        fetchActivityLogs();
    }, [user]);

    const handleApiTokenFormChange = (e) => {
        const { name, value } = e.target;
        setApiTokenForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('preferences.')) {
            const prefKey = name.split('.')[1];
            setProfile(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [prefKey]: type === 'checkbox' ? checked : value
                }
            }));
        } else if (name.startsWith('security.')) {
            const secKey = name.split('.')[1];
            setProfile(prev => ({
                ...prev,
                security: {
                    ...prev.security,
                    [secKey]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);

            // Show preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfile(prev => ({
                    ...prev,
                    avatarUrl: event.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile);

            const response = await fetch('/api/users/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Avatar updated successfully');
                // Update user context with new avatar URL
                updateUser({ ...user, avatarUrl: data.avatarUrl });
            } else {
                toast.error('Failed to upload avatar');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Error uploading avatar');
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generateApiToken = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/users/api-tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(apiTokenForm)
            });

            if (response.ok) {
                const data = await response.json();
                setNewToken(data.token);
                toast.success('API token created successfully');

                // Update the user's token list
                setProfile(prev => ({
                    ...prev,
                    security: {
                        ...prev.security,
                        apiTokens: [...prev.security.apiTokens, {
                            id: data.id,
                            name: apiTokenForm.name,
                            createdAt: new Date().toISOString(),
                            expiresAt: data.expiresAt
                        }]
                    }
                }));

                // Reset form
                setApiTokenForm({ name: '', expiresIn: '30' });
                setShowApiTokenForm(false);
            } else {
                toast.error('Failed to create API token');
            }
        } catch (error) {
            console.error('Error generating API token:', error);
            toast.error('Error generating API token');
        }
    };

    const revokeApiToken = async (tokenId) => {
        try {
            const response = await fetch(`/api/users/api-tokens/${tokenId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                toast.success('API token revoked successfully');

                // Remove token from list
                setProfile(prev => ({
                    ...prev,
                    security: {
                        ...prev.security,
                        apiTokens: prev.security.apiTokens.filter(token => token.id !== tokenId)
                    }
                }));
            } else {
                toast.error('Failed to revoke API token');
            }
        } catch (error) {
            console.error('Error revoking API token:', error);
            toast.error('Error revoking API token');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        // If there's an avatar file, upload it first
        if (avatarFile) {
            await uploadAvatar();
        }

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                const data = await response.json();
                updateUser(data.user);
                setIsEditingProfile(false);
                toast.success('Profile updated successfully!');
            } else {
                const error = await response.json();
                toast.error(error.msg || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            if (response.ok) {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsChangingPassword(false);
                toast.success('Password changed successfully!');
            } else {
                const error = await response.json();
                toast.error(error.msg || 'Failed to change password');
            }
        } catch (error) {
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                        <p className="text-gray-600">{user?.email}</p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user?.role}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-blue-600">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                        {isEditingProfile && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 shadow-md hover:bg-blue-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                        <p className="text-gray-600">{profile.email}</p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {profile.role}
                        </span>
                        {profile.bio && (
                            <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
                        )}
                    </div>
                </div>

                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex flex-wrap">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'profile'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Profile Information
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'password'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Change Password
                        </button>
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'preferences'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Preferences
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'security'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'activity'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Activity Log
                        </button>
                    </nav>
                </div>

                {/* Profile Information Tab */}
                {activeTab === 'profile' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                            <button
                                onClick={() => setIsEditingProfile(!isEditingProfile)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        value={profile.jobTitle || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={profile.department}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Office Location
                                    </label>
                                    <input
                                        type="text"
                                        name="office"
                                        value={profile.office || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Role can only be changed by administrators</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={profile.bio || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditingProfile}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        placeholder="Tell us a little about yourself..."
                                    />
                                </div>
                            </div>

                            {isEditingProfile && (
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingProfile(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* Change Password Tab */}
                {activeTab === 'password' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Theme
                                    </label>
                                    <select
                                        name="preferences.theme"
                                        value={profile.preferences.theme}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="system">System Default</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language
                                    </label>
                                    <select
                                        name="preferences.language"
                                        value={profile.preferences.language}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date Format
                                    </label>
                                    <select
                                        name="preferences.dateFormat"
                                        value={profile.preferences.dateFormat}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time Zone
                                    </label>
                                    <select
                                        name="timezone"
                                        value={profile.timezone}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">Eastern Time (ET)</option>
                                        <option value="America/Chicago">Central Time (CT)</option>
                                        <option value="America/Denver">Mountain Time (MT)</option>
                                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Notifications</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="preferences.notifications"
                                            checked={profile.preferences.notifications}
                                            onChange={handleProfileChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Enable in-app notifications
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="preferences.emailAlerts"
                                            checked={profile.preferences.emailAlerts}
                                            onChange={handleProfileChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Enable email alerts
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Display Settings</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="preferences.useCompactView"
                                            checked={profile.preferences.useCompactView}
                                            onChange={handleProfileChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Use compact view
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="preferences.lowStockNotification"
                                            checked={profile.preferences.lowStockNotification}
                                            onChange={handleProfileChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Low stock notifications
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="preferences.expiryNotification"
                                            checked={profile.preferences.expiryNotification}
                                            onChange={handleProfileChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Expiry notifications
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
                                <div className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        name="security.twoFactorEnabled"
                                        checked={profile.security.twoFactorEnabled}
                                        onChange={handleProfileChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="ml-3">
                                        <label className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</label>
                                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                                    </div>
                                </div>

                                {profile.security.twoFactorEnabled && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-2">
                                        <p className="text-sm text-yellow-700">
                                            To configure two-factor authentication, you'll need to set up an authenticator app like Google Authenticator or Authy.
                                            Contact your administrator for detailed instructions.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">API Tokens</h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    API tokens allow external applications to access data on your behalf. Be careful as tokens have access to your data.
                                </p>

                                {profile.security.apiTokens && profile.security.apiTokens.length > 0 ? (
                                    <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-4">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {profile.security.apiTokens.map((token) => (
                                                    <tr key={token.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{token.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(token.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(token.expiresAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                            <button
                                                                onClick={() => revokeApiToken(token.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Revoke
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic mb-4">No active API tokens</p>
                                )}

                                {newToken && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                                        <h5 className="text-sm font-medium text-green-800 mb-2">Your new token has been created</h5>
                                        <p className="text-xs text-green-700 mb-2">
                                            Please copy your new API token now. For security reasons, you won't be able to see it again.
                                        </p>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                readOnly
                                                value={newToken}
                                                className="flex-1 px-3 py-2 border border-green-300 bg-green-50 rounded-md text-green-800 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(newToken);
                                                    toast.success('Token copied to clipboard');
                                                }}
                                                className="ml-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!showApiTokenForm ? (
                                    <button
                                        onClick={() => setShowApiTokenForm(true)}
                                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        Generate New Token
                                    </button>
                                ) : (
                                    <form onSubmit={generateApiToken} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Token Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={apiTokenForm.name}
                                                onChange={handleApiTokenFormChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., Development API, Integration Testing"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Token Expiration
                                            </label>
                                            <select
                                                name="expiresIn"
                                                value={apiTokenForm.expiresIn}
                                                onChange={handleApiTokenFormChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="1">1 day</option>
                                                <option value="7">7 days</option>
                                                <option value="30">30 days</option>
                                                <option value="90">90 days</option>
                                                <option value="365">1 year</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowApiTokenForm(false)}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                Generate Token
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Password Security</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Password Last Changed</p>
                                            <p className="text-sm text-gray-500">
                                                {profile.security.lastPasswordChange ?
                                                    new Date(profile.security.lastPasswordChange).toLocaleDateString() :
                                                    'Never changed'
                                                }
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('password')}
                                            className="px-3 py-1 bg-gray-200 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-300"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Security Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activityLogs.length > 0 ? (
                                        activityLogs.map((log, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipAddress}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.details}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-sm text-center text-gray-500">
                                                No activity logs available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
