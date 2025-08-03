import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { usersAPI } from '../services/api';

export default function RoleManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [permissions, setPermissions] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');

    const roles = ['Admin', 'Manager', 'Technician', 'User'];
    const availablePermissions = [
        { key: 'view_inventory', label: 'View Inventory' },
        { key: 'edit_inventory', label: 'Edit Inventory' },
        { key: 'delete_inventory', label: 'Delete Inventory' },
        { key: 'manage_users', label: 'Manage Users' },
        { key: 'view_reports', label: 'View Reports' },
        { key: 'export_data', label: 'Export Data' },
        { key: 'manage_reservations', label: 'Manage Reservations' },
        { key: 'manage_maintenance', label: 'Manage Maintenance' },
        { key: 'approve_requests', label: 'Approve Requests' },
        { key: 'system_settings', label: 'System Settings' }
    ];

    useEffect(() => {
        if (user.role === 'Admin') {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.getAll();
            if (response.data && Array.isArray(response.data.users)) {
                setUsers(response.data.users);
            } else {
                // Handle cases where users is not an array or is missing
                setUsers([]);
                console.error("Fetched data is not in expected format:", response.data);
                toast.error('Received invalid user data from server.');
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const openRoleModal = (selectedUser) => {
        setSelectedUser(selectedUser);
        setNewRole(selectedUser.role);
        setPermissions(selectedUser.permissions || {});
        setShowModal(true);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            const response = await usersAPI.updateRole(selectedUser._id, {
                role: newRole,
                permissions: permissions
            });

            if (response.data) {
                toast.success('User role updated successfully!');
                setShowModal(false);
                fetchUsers();
            } else {
                toast.error('Failed to update user role');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to update user role');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (permissionKey) => {
        setPermissions(prev => ({
            ...prev,
            [permissionKey]: !prev[permissionKey]
        }));
    };

    const getDefaultPermissions = (role) => {
        const defaultPerms = {};
        switch (role) {
            case 'Admin':
                availablePermissions.forEach(p => defaultPerms[p.key] = true);
                break;
            case 'Manager':
                defaultPerms.view_inventory = true;
                defaultPerms.edit_inventory = true;
                defaultPerms.view_reports = true;
                defaultPerms.manage_reservations = true;
                defaultPerms.manage_maintenance = true;
                defaultPerms.approve_requests = true;
                break;
            case 'Technician':
                defaultPerms.view_inventory = true;
                defaultPerms.edit_inventory = true;
                defaultPerms.manage_reservations = true;
                defaultPerms.manage_maintenance = true;
                break;
            case 'User':
                defaultPerms.view_inventory = true;
                break;
            default:
                break;
        }
        return defaultPerms;
    };

    const handleRoleChange = (role) => {
        setNewRole(role);
        setPermissions(getDefaultPermissions(role));
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'All' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin': return 'text-red-600 bg-red-100';
            case 'Manager': return 'text-blue-600 bg-blue-100';
            case 'Technician': return 'text-green-600 bg-green-100';
            case 'User': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (user.role !== 'Admin') {
        return (
            <div className="text-center py-8">
                <div className="text-red-600 text-lg font-semibold">Access Denied</div>
                <p className="text-gray-600">You don't have permission to access role management.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
                <p className="text-gray-600">Manage user roles and permissions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {roles.map(role => (
                    <div key={role} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full ${getRoleColor(role)}`}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.role === role).length}
                                </p>
                                <p className="text-gray-600">{role}s</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="All">All Roles</option>
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Users ({filteredUsers.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((userItem) => (
                                <tr key={userItem._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {userItem.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {userItem.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {userItem.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {userItem.department || 'Not specified'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
                                            {userItem.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openRoleModal(userItem)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Edit Role
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Edit Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit Role for {selectedUser.name}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Permissions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Permissions
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {availablePermissions.map(permission => (
                                        <div key={permission.key} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={permission.key}
                                                checked={permissions[permission.key] || false}
                                                onChange={() => handlePermissionChange(permission.key)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                                                {permission.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
