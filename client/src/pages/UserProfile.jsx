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
        avatarUrl: ''
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
                avatarUrl: user.avatarUrl || ''
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
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



    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        // If there's an avatar file, upload it first
        if (avatarFile) {
            await uploadAvatar();
        }

        try {
            // Create a copy of the profile without the removed sections
            const profileToUpdate = {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                department: profile.department,
                bio: profile.bio
            };

            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profileToUpdate)
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






            </div>
        </div>
    );
}
