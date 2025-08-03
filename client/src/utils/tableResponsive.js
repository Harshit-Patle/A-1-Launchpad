/**
 * Utilities for making tables responsive
 */

/**
 * Adds data-label attributes to table cells based on their column headers
 * This enables the card view on mobile devices
 * @param {HTMLTableElement} table - The table element to process
 */
export const setupResponsiveTable = (tableElement) => {
    if (!tableElement) return;

    const headers = Array.from(tableElement.querySelectorAll('thead th')).map(
        header => header.textContent.trim()
    );

    const rows = tableElement.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            if (headers[index]) {
                cell.setAttribute('data-label', headers[index]);
            }
        });
    });
};

/**
 * Helper function to throttle function calls
 */
const throttle = (func, limit) => {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Creates a scroll indicator for tables that overflow horizontally
 * @param {HTMLElement} containerElement - The table container element
 */
export const addScrollIndicator = (containerElement) => {
    if (!containerElement || containerElement.querySelector('.table-scroll-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'table-scroll-indicator';
    containerElement.appendChild(indicator);

    const updateIndicator = () => {
        const { scrollWidth, clientWidth, scrollLeft } = containerElement;
        if (scrollWidth > clientWidth) {
            const scrollPercent = scrollLeft / (scrollWidth - clientWidth);
            indicator.style.opacity = '0.7';
            indicator.style.transform = `scaleX(${1 - scrollPercent})`;
        } else {
            indicator.style.opacity = '0';
        }
    };

    // Throttle the scroll handler for better performance
    const throttledUpdate = throttle(updateIndicator, 50);

    containerElement.addEventListener('scroll', throttledUpdate);

    // Throttle resize events which are expensive
    const throttledResize = throttle(updateIndicator, 100);
    window.addEventListener('resize', throttledResize);

    // Use requestAnimationFrame for the initial update to ensure DOM is painted
    requestAnimationFrame(() => {
        updateIndicator();
    });

    // Store listeners on the element for potential cleanup
    containerElement._tableScrollListeners = {
        scroll: throttledUpdate,
        resize: throttledResize
    };
};

// Track processed tables to avoid duplicate processing
const processedTableSelectors = new Set();

/**
 * Makes a table responsive by applying both data-labels and scroll indicator
 * @param {string} tableSelector - CSS selector for the table
 */
export const makeTableResponsive = (tableSelector) => {
    // Skip if already processed
    if (processedTableSelectors.has(tableSelector)) return;
    processedTableSelectors.add(tableSelector);

    // Find the table element
    const table = document.querySelector(tableSelector);
    if (!table) return;

    // Find or create the container
    let container = table.parentElement;
    if (!container.classList.contains('responsive-table-container')) {
        container = document.createElement('div');
        container.className = 'responsive-table-container';
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
    }

    // Add responsive classes (only if needed)
    if (!table.classList.contains('responsive-table')) {
        table.classList.add('responsive-table');
    }

    // For very small screens, enable card view
    if (window.innerWidth <= 480 && !table.classList.contains('responsive-card-table')) {
        table.classList.add('responsive-card-table');
    }

    // Setup data labels and scroll indicator only once
    setupResponsiveTable(table);

    // Only add scroll indicator if one doesn't exist
    if (!container.querySelector('.table-scroll-indicator')) {
        addScrollIndicator(container);
    }
}; export default {
    setupResponsiveTable,
    addScrollIndicator,
    makeTableResponsive,
};
