/**
 * Custom React hook for responsive table management
 */
import { useEffect, useRef } from 'react';
import { makeTableResponsive } from '../utils/tableResponsive';

/**
 * Helper function to throttle resize events
 */
const throttle = (func, delay) => {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
};

/**
 * Hook to make tables responsive in React components
 * @param {Object} options - Configuration options
 * @param {string} options.tableSelector - CSS selector for the table (default: '.responsive-table')
 * @param {boolean} options.enableCardView - Enable card view for mobile screens (default: true)
 * @param {Array<string>} options.dependencies - React dependencies array to control when the hook runs
 * @returns {Object} Reference object that can be attached to table container
 */
const useResponsiveTables = (options = {}) => {
    const {
        tableSelector = '.responsive-table',
        enableCardView = true,
        dependencies = []
    } = options;

    // Create ref for the table container
    const tableContainerRef = useRef(null);

    useEffect(() => {
        // Process only tables that match the selector and haven't been processed
        const processTable = (table) => {
            // Skip tables without ID
            if (!table.id) {
                table.id = `resp-table-${Math.random().toString(36).substr(2, 9)}`;
            }

            // Apply responsive features
            if (!table._responsive_processed) {
                // Apply card view class if enabled and on small screens
                if (enableCardView && window.innerWidth <= 480) {
                    table.classList.add('responsive-card-table');
                }

                // Make table responsive
                makeTableResponsive(`#${table.id}`);

                // Mark as processed to avoid duplicate processing
                table._responsive_processed = true;
            }
        };

        // Handle the ref table (most important as it's directly in the component)
        if (tableContainerRef.current) {
            const refTable = tableContainerRef.current.querySelector('table');
            if (refTable) {
                refTable.classList.add('responsive-table');
                processTable(refTable);
            }
        }

        // Throttled resize handler for better performance
        const handleResize = throttle(() => {
            // Process only the table in our ref to avoid affecting others
            if (tableContainerRef.current) {
                const refTable = tableContainerRef.current.querySelector('table');
                if (refTable) {
                    if (window.innerWidth <= 480 && enableCardView) {
                        refTable.classList.add('responsive-card-table');
                    } else {
                        refTable.classList.remove('responsive-card-table');
                    }
                }
            }
        }, 100);

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);

            // Clean up scroll listeners to prevent memory leaks
            if (tableContainerRef.current) {
                if (tableContainerRef.current._tableScrollListeners) {
                    window.removeEventListener('resize', tableContainerRef.current._tableScrollListeners.resize);
                    tableContainerRef.current.removeEventListener('scroll', tableContainerRef.current._tableScrollListeners.scroll);
                }
            }
        };
    }, [...dependencies, tableSelector, enableCardView]);

    return tableContainerRef;
};

export default useResponsiveTables;
