import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_START':
        case 'REGISTER_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'LOGIN_SUCCESS':
        case 'REGISTER_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'LOGIN_FAILURE':
        case 'REGISTER_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case 'LOAD_USER_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'LOAD_USER_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case 'UPDATE_PROFILE_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                error: null,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load user on app start
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        } else {
            dispatch({ type: 'LOAD_USER_FAILURE' });
        }
    }, []);

    // Login function
    const login = async (credentials) => {
        try {
            dispatch({ type: 'LOGIN_START' });
            const response = await authAPI.login(credentials);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { token, user },
            });

            toast.success(`Welcome back, ${user.name}!`);
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Login failed';
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: errorMsg,
            });
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            dispatch({ type: 'REGISTER_START' });
            const response = await authAPI.register(userData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: 'REGISTER_SUCCESS',
                payload: { token, user },
            });

            toast.success('Registration successful!');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Registration failed';
            dispatch({
                type: 'REGISTER_FAILURE',
                payload: errorMsg,
            });
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Load user function
    const loadUser = async () => {
        try {
            const response = await authAPI.getMe();
            dispatch({
                type: 'LOAD_USER_SUCCESS',
                payload: response.data,
            });
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOAD_USER_FAILURE' });
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
        toast.info('Logged out successfully');
    };

    // Update profile function
    const updateProfile = async (profileData) => {
        try {
            const response = await authAPI.updateProfile(profileData);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            dispatch({
                type: 'UPDATE_PROFILE_SUCCESS',
                payload: response.data,
            });
            toast.success('Profile updated successfully!');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Profile update failed';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Change password function
    const changePassword = async (passwordData) => {
        try {
            await authAPI.changePassword(passwordData);
            toast.success('Password changed successfully!');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Password change failed';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Clear error function
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // Update user function (for external updates)
    const updateUser = (updatedUser) => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch({
            type: 'UPDATE_PROFILE_SUCCESS',
            payload: { user: updatedUser },
        });
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        clearError,
        loadUser,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
