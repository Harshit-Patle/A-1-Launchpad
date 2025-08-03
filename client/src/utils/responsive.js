// Responsive utilities for the web app
import { setupResponsiveTable, addScrollIndicator } from './tableResponsive';

// Function to ensure proper viewport on mobile devices
function setupViewport() {
    // Set viewport for mobile devices with correct device-pixel-ratio
    const viewport = document.querySelector('meta[name="viewport"]');

    if (viewport) {
        // This ensures we handle high pixel density mobile screens properly
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover');
    }

    // Add iOS-specific class for proper safe area handling
    if (/iPhone|iPod|iPad/.test(navigator.userAgent)) {
        document.documentElement.classList.add('ios');
    }

    // Add touch-device class for touch-specific styling
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.documentElement.classList.add('touch-device');
    }
}

// Function to adjust elements when soft keyboard appears (especially on mobile)
function handleSoftKeyboard() {
    let viewportHeight = window.innerHeight;
    const originalHeight = window.innerHeight;

    window.addEventListener('resize', () => {
        // If height decreased significantly, keyboard is likely shown
        if (window.innerHeight < viewportHeight * 0.8) {
            document.body.classList.add('keyboard-visible');
        } else {
            document.body.classList.remove('keyboard-visible');
        }

        // Update viewport height reference
        if (window.innerHeight >= originalHeight * 0.9) {
            viewportHeight = window.innerHeight;
        }
    });
}

// Track which tables have already been processed to avoid redundant operations
const processedTables = new Set();

// Function to make tables responsive
function setupResponsiveTables() {
    // Find all table containers
    const tableContainers = document.querySelectorAll('.responsive-table-container');
    tableContainers.forEach(container => {
        const table = container.querySelector('table');
        if (table && !processedTables.has(table)) {
            table.classList.add('responsive-table');
            setupResponsiveTable(table);
            addScrollIndicator(container);
            processedTables.add(table);
        }
    });

    // Add scroll indicator to tables that don't have it yet
    document.querySelectorAll('.responsive-table').forEach(table => {
        if (!processedTables.has(table)) {
            const container = table.closest('.responsive-table-container');
            if (container && !container.querySelector('.table-scroll-indicator')) {
                addScrollIndicator(container);
            }
            processedTables.add(table);
        }
    });
}

// Helper to throttle function calls for better performance
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

// Initialize responsive functions
export function initResponsive() {
    setupViewport();
    handleSoftKeyboard();

    // Setup tables when DOM is fully loaded
    if (document.readyState === 'complete') {
        setupResponsiveTables();
    } else {
        window.addEventListener('DOMContentLoaded', setupResponsiveTables, { once: true });
    }

    // Throttled version of setupResponsiveTables to avoid excessive calls
    const throttledSetupTables = throttle(setupResponsiveTables, 300);

    // Use a lighter mutation observer that only watches for table-related changes
    const observer = new MutationObserver(mutations => {
        let shouldProcess = false;

        for (const mutation of mutations) {
            // Check if any added nodes contain tables or are tables themselves
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'TABLE' ||
                            node.classList?.contains('responsive-table-container') ||
                            node.querySelector('table')) {
                            shouldProcess = true;
                            break;
                        }
                    }
                }
            }

            if (shouldProcess) break;
        }

        if (shouldProcess) {
            throttledSetupTables();
        }
    });

    // Start observing once DOM is ready, but be selective about what to observe
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
        }, { once: true });
    }    // Handle orientation changes (with once flag for cleanup)
    const handleOrientationChange = () => {
        // Small timeout to let the orientation actually complete
        setTimeout(() => {
            // Force a resize event to recalculate responsive layouts
            window.dispatchEvent(new Event('resize'));
        }, 150);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
}

export default {
    initResponsive
};
