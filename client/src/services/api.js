import axios from 'axios';

// When using Vite's proxy feature, we can simply use '/api' as the base URL
// This will be proxied to the actual server address defined in vite.config.js
const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for CORS credentials
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// Components API calls
export const componentsAPI = {
    getAll: (params) => {
        // Clean up empty or null parameters
        const cleanParams = { ...params };
        Object.keys(cleanParams).forEach(key => {
            if (cleanParams[key] === '' || cleanParams[key] === null || cleanParams[key] === undefined) {
                delete cleanParams[key];
            }
        });
        return api.get('/components', { params: cleanParams });
    },
    getById: (id) => api.get(`/components/${id}`),
    create: (data) => api.post('/components', data),
    update: (id, data) => api.put(`/components/${id}`, data),
    updateQuantity: (id, data) => api.put(`/components/${id}/quantity`, data),
    delete: (id) => api.delete(`/components/${id}`),
    getStats: () => api.get('/components/stats'),
    getCategories: () => api.get('/components/categories'),
    getLocations: () => api.get('/components/locations'),
    getLowStock: () => api.get('/components/low-stock'),
    updateNotificationSettings: (id, data) => api.patch(`/component-settings/${id}/notifications`, data),
};

// Logs API calls
export const logsAPI = {
    getAll: (params) => api.get('/logs', { params }),
    getByComponent: (componentId, params) => api.get(`/logs/component/${componentId}`, { params }),
    getUserLogs: (params) => api.get('/logs/user', { params }),
    create: (data) => api.post('/logs', data),
    getStats: (params) => api.get('/logs/stats', { params }),
    exportLogs: (params) => api.get('/logs/export', { params }),
};

// Users API calls
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    updateRole: (id, data) => api.put(`/users/${id}/role`, data),
    delete: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
    getStats: () => api.get('/users/stats'),
    getDepartments: () => api.get('/users/departments'),
};

// Reservations API calls
export const reservationsAPI = {
    getAll: (params) => api.get('/reservations', { params }),
    getUserReservations: (params) => api.get('/reservations/user', { params }),
    checkAvailability: (componentId, params) => api.get(`/reservations/availability/${componentId}`, { params }),
    create: (data) => api.post('/reservations', data),
    update: (id, data) => api.put(`/reservations/${id}`, data),
    delete: (id) => api.delete(`/reservations/${id}`),
};

// Maintenance API calls
export const maintenanceAPI = {
    getAll: (params) => api.get('/maintenance', { params }),
    create: (data) => api.post('/maintenance', data),
    update: (id, data) => api.put(`/maintenance/${id}`, data),
    updateStatus: (id, data) => api.patch(`/maintenance/${id}/status`, data),
    delete: (id) => api.delete(`/maintenance/${id}`),
    getStats: () => api.get('/maintenance/stats'),
};

// Reports API calls
export const reportsAPI = {
    getInventoryReport: (params) => api.get('/reports/inventory', { params }),
    getUsageReport: (params) => api.get('/reports/usage', { params }),
    getMaintenanceReport: (params) => api.get('/reports/maintenance', { params }),
    getReservationReport: (params) => api.get('/reports/reservations', { params }),
    getDashboardAnalytics: () => api.get('/reports/dashboard'),
};

// Dashboard API calls
export const dashboardAPI = {
    getMonthlyMovement: (params) => api.get('/dashboard/monthly-movement', { params }),
    getCriticalComponents: () => api.get('/dashboard/critical-components'),
};

// Import/Export API calls
export const importExportAPI = {
    exportComponents: (format, params) => api.get(`/import-export/export/${format}`, {
        params,
        responseType: 'blob'
    }),
    importComponents: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/import-export/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getTemplate: (format) => api.get(`/import-export/template/${format}`, {
        responseType: 'blob'
    }),
};

// Notifications API calls
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/mark-all-read'),
    delete: (id) => api.delete(`/notifications/${id}`),
};

// Waste tracking API calls
export const wasteAPI = {
    getAll: (params) => api.get('/waste', { params }),
    getById: (id) => api.get(`/waste/${id}`),
    create: (data) => api.post('/waste', data),
    update: (id, data) => api.put(`/waste/${id}`, data),
    delete: (id) => api.delete(`/waste/${id}`),
    getStatistics: () => api.get('/waste/statistics/summary'),
};

// Health check
export const healthAPI = {
    check: () => api.get('/health'),
};

// System Settings API calls
export const settingsAPI = {
    getAll: () => api.get('/settings'),
    update: (section, data) => api.put(`/settings/${section}`, data),
    reset: () => api.post('/settings/reset'),
    getDefaults: () => api.get('/settings/defaults'),
};

export default api;
