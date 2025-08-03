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
        category: '',
        location: '',
        stockStatus: '',
        sortBy: 'name',
        sortOrder: 'asc',
    },
    pagination: {
        page: 1,
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
                    page: parseInt(action.payload.currentPage) || 1,
                    totalPages: parseInt(action.payload.totalPages) || 1,
                    total: parseInt(action.payload.total) || 0,
                    limit: parseInt(action.payload.limit || state.pagination.limit) || 10
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
            // Extract the page from action.payload if it exists
            const { page, ...otherFilters } = action.payload;
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...otherFilters,
                },
                // Update pagination if page is provided
                pagination: page ? {
                    ...state.pagination,
                    page: parseInt(page) || 1
                } : state.pagination
            };
        case 'SET_PAGINATION':
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload,
                },
            };
        case 'CLEAR_CURRENT_COMPONENT':
            return {
                ...state,
                currentComponent: null,
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

            // Get the latest state to ensure we have the most current values
            const currentState = state;

            // Create query parameters with pagination correctly included
            const queryParams = {
                // Include filters first (lower priority)
                ...currentState.filters,

                // Override with pagination parameters (higher priority)
                page: currentState.pagination.page,
                limit: currentState.pagination.limit,

                // Allow explicit overrides with params argument (highest priority)
                ...params,
            };

            // Debug the query parameters
            console.log('Final query params for API:', queryParams);

            // Remove empty filters to avoid sending unnecessary parameters
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
                    delete queryParams[key];
                }
            });

            console.log('Fetching components with params:', queryParams);
            const response = await componentsAPI.getAll(queryParams);
            dispatch({ type: 'SET_COMPONENTS', payload: response.data });
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to fetch components';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
        }
    };

    // Fetch component by ID with debouncing to prevent multiple calls
    const fetchComponentById = async (id) => {
        try {
            if (!id) {
                // Clear current component if no ID provided
                dispatch({ type: 'CLEAR_CURRENT_COMPONENT' });
                return null;
            }

            // Set loading state without clearing component yet to prevent flicker
            dispatch({ type: 'SET_LOADING', payload: true });

            // Use a static variable to store the last ID requested to avoid redundant requests
            if (fetchComponentById.lastRequestId === id && fetchComponentById.lastRequestTime &&
                (Date.now() - fetchComponentById.lastRequestTime < 500)) {
                console.log('Skipping duplicate request for component:', id);
                return null;
            }

            // Update the last request info
            fetchComponentById.lastRequestId = id;
            fetchComponentById.lastRequestTime = Date.now();

            const response = await componentsAPI.getById(id);

            // Only dispatch if we have valid data
            if (response && response.data) {
                dispatch({ type: 'SET_CURRENT_COMPONENT', payload: response.data });
                return response.data;
            } else {
                // If no data, ensure we clear any existing component
                dispatch({ type: 'CLEAR_CURRENT_COMPONENT' });
                return null;
            }
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to fetch component';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            toast.error(errorMsg);
            // Also clear current component on error
            dispatch({ type: 'CLEAR_CURRENT_COMPONENT' });
            return null;
        } finally {
            // Reset loading state regardless of outcome
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Initialize the static properties
    fetchComponentById.lastRequestId = null;
    fetchComponentById.lastRequestTime = null;    // Create new component
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

            // Refresh the component list after update to ensure data consistency
            await fetchComponents();

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
        // Create a copy of the filters
        const payload = { ...filters };

        // Check if this is specifically a page change request
        const isPageChangeOnly = Object.keys(filters).length === 1 && 'page' in filters;

        // If explicitly setting page, ensure it's a number
        if ('page' in payload) {
            payload.page = parseInt(payload.page) || 1;
        }

        // Only reset page to 1 if other filters are changing (not when explicitly changing page)
        if (!isPageChangeOnly && !('page' in filters) && Object.keys(filters).length > 0) {
            payload.page = 1;
        }

        console.log('Setting filters with payload:', payload);

        if (isPageChangeOnly) {
            // If only changing page, update pagination directly
            dispatch({
                type: 'SET_PAGINATION',
                payload: { page: payload.page }
            });
        } else {
            // For other filter changes
            dispatch({ type: 'SET_FILTERS', payload });
        }

        // Always fetch with updated parameters
        setTimeout(() => {
            fetchComponents();
        }, 0);
    };

    // Set pagination
    const setPagination = (paginationData) => {
        // Make sure we're working with parsed integers
        if ('page' in paginationData) {
            paginationData.page = parseInt(paginationData.page) || 1;
        }

        // First update state
        dispatch({ type: 'SET_PAGINATION', payload: paginationData });

        // Create a complete query params object for the API call
        const queryParams = {
            ...state.filters,
            ...paginationData
        };

        // Fetch data with the complete query parameters
        setTimeout(() => {
            fetchComponents(queryParams);
        }, 0);
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // Clear current component and associated states
    const clearCurrentComponent = () => {
        dispatch({ type: 'CLEAR_CURRENT_COMPONENT' });
        dispatch({ type: 'CLEAR_ERROR' }); // Also clear any errors
        dispatch({ type: 'SET_LOADING', payload: false }); // Reset loading state
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
        clearCurrentComponent,
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
