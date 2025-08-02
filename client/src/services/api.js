import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
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
    getAll: (params) => api.get('/components', { params }),
    getById: (id) => api.get(`/components/${id}`),
    create: (data) => api.post('/components', data),
    update: (id, data) => api.put(`/components/${id}`, data),
    updateQuantity: (id, data) => api.put(`/components/${id}/quantity`, data),
    delete: (id) => api.delete(`/components/${id}`),
    getStats: () => api.get('/components/stats'),
    getCategories: () => api.get('/components/categories'),
    getLocations: () => api.get('/components/locations'),
    getLowStock: () => api.get('/components/low-stock'),
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

// Health check
export const healthAPI = {
    check: () => api.get('/health'),
};

export default api;
