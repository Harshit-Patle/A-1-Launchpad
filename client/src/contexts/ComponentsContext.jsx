import React, { createContext, useContext, useReducer } from 'react';
import { componentsAPI } from '../services/api';
import { toast } from 'react-toastify';

const ComponentsContext = createContext();

const initialState = {
    components: [],
    currentComponent: null,
    categories: [],
    locations: [],
    lowStockComponents: [],
    stats: null,
    filters: {
        search: '',
        category: 'all',
        location: 'all',
        lowStock: false,
        sortBy: 'name',
        sortOrder: 'asc',
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: 10,
    },
    isLoading: false,
    error: null,
};

const componentsReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        case 'SET_COMPONENTS':
            return {
                ...state,
                components: action.payload.components,
                pagination: {
                    ...state.pagination,
                    currentPage: action.payload.currentPage,
                    totalPages: action.payload.totalPages,
                    total: action.payload.total,
                },
                isLoading: false,
                error: null,
            };
        case 'SET_CURRENT_COMPONENT':
            return {
                ...state,
                currentComponent: action.payload,
                isLoading: false,
                error: null,
            };
        case 'ADD_COMPONENT':
            return {
                ...state,
                components: [action.payload, ...state.components],
                isLoading: false,
                error: null,
            };
        case 'UPDATE_COMPONENT':
            return {
                ...state,
                components: state.components.map(component =>
                    component._id === action.payload._id ? action.payload : component
                ),
                currentComponent: state.currentComponent?._id === action.payload._id
                    ? action.payload
                    : state.currentComponent,
                isLoading: false,
                error: null,
            };
        case 'DELETE_COMPONENT':
            return {
                ...state,
                components: state.components.filter(component => component._id !== action.payload),
                isLoading: false,
                error: null,
            };
        case 'SET_CATEGORIES':
            return {
                ...state,
                categories: action.payload,
            };
        case 'SET_LOCATIONS':
            return {
                ...state,
                locations: action.payload,
            };
        case 'SET_LOW_STOCK':
            return {
                ...state,
                lowStockComponents: action.payload,
            };
        case 'SET_STATS':
            return {
                ...state,
                stats: action.payload,
            };
        case 'SET_FILTERS':
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload,
                },
            };
        case 'SET_PAGINATION':
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload,
                },
            };
        default:
            return state;
    }
};

export const ComponentsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(componentsReducer, initialState);

    // Fetch all components
    const fetchComponents = async (params = {}) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const queryParams = {
                ...state.filters,
                ...state.pagination,
                ...params,
            };
            const response = await componentsAPI.getAll(queryParams);
            dispatch({ type: 'SET_COMPONENTS', payload: response.data });
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to fetch components';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
        }
    };

    // Fetch component by ID
    const fetchComponentById = async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await componentsAPI.getById(id);
            dispatch({ type: 'SET_CURRENT_COMPONENT', payload: response.data });
            return response.data;
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to fetch component';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
        }
    };

    // Create new component
    const createComponent = async (componentData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await componentsAPI.create(componentData);
            dispatch({ type: 'ADD_COMPONENT', payload: response.data });
            toast.success('Component created successfully!');
            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to create component';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Update component
    const updateComponent = async (id, componentData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await componentsAPI.update(id, componentData);
            dispatch({ type: 'UPDATE_COMPONENT', payload: response.data });
            toast.success('Component updated successfully!');
            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to update component';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Update component quantity
    const updateQuantity = async (id, quantityData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await componentsAPI.updateQuantity(id, quantityData);
            dispatch({ type: 'UPDATE_COMPONENT', payload: response.data.component });
            toast.success(response.data.msg);
            // Refresh components list to show updated quantities
            fetchComponents();
            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to update quantity';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Delete component
    const deleteComponent = async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await componentsAPI.delete(id);
            dispatch({ type: 'DELETE_COMPONENT', payload: id });
            toast.success('Component deleted successfully!');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to delete component';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await componentsAPI.getCategories();
            dispatch({ type: 'SET_CATEGORIES', payload: response.data });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    // Fetch locations
    const fetchLocations = async () => {
        try {
            const response = await componentsAPI.getLocations();
            dispatch({ type: 'SET_LOCATIONS', payload: response.data });
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    // Fetch low stock components
    const fetchLowStock = async () => {
        try {
            const response = await componentsAPI.getLowStock();
            dispatch({ type: 'SET_LOW_STOCK', payload: response.data });
        } catch (error) {
            console.error('Failed to fetch low stock components:', error);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await componentsAPI.getStats();
            dispatch({ type: 'SET_STATS', payload: response.data });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // Set filters
    const setFilters = (filters) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    };

    // Set pagination
    const setPagination = (pagination) => {
        dispatch({ type: 'SET_PAGINATION', payload: pagination });
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        fetchComponents,
        fetchComponentById,
        createComponent,
        updateComponent,
        updateQuantity,
        deleteComponent,
        fetchCategories,
        fetchLocations,
        fetchLowStock,
        fetchStats,
        setFilters,
        setPagination,
        clearError,
    };

    return (
        <ComponentsContext.Provider value={value}>
            {children}
        </ComponentsContext.Provider>
    );
};

export const useComponents = () => {
    const context = useContext(ComponentsContext);
    if (!context) {
        throw new Error('useComponents must be used within a ComponentsProvider');
    }
    return context;
};

export default ComponentsContext;
