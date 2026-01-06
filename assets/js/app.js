// Main application entry point and initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MyAgileToolbox initializing...');
    
    // Initialize core systems
    initializeGlobalEventHandlers();
    
    // Initialize UI components
    initializeModalDragging();
    initializeDesktopIcons();
    initializeContextMenu();
    initializeTaskbar();
    
    // Initialize ScrollArea components
    initializeScrollAreas();
    
    // Initialize features
    initializeAccordion();
    initializeContactFeatures();
    
    // Load and play startup sound
    loadSounds().then(() => {
        playStartupSound();
    });
    
    // Start testimonial autoplay if testimonials exist
    if (document.querySelectorAll('.testimonial-item').length > 0) {
        if (typeof startTestimonialAutoplay === 'function') {
            startTestimonialAutoplay();
        }
        if (typeof showTestimonial === 'function') {
            showTestimonial(0); // Show first testimonial
        }
    }
    
    console.log('✅ MyAgileToolbox initialized successfully');
});

function initializeGlobalEventHandlers() {
    // Global click handler to close menus
    document.addEventListener('click', function(e) {
        // Close start menu if clicking elsewhere
        if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
            const startMenu = document.querySelector('.start-menu');
            if (startMenu) {
                startMenu.classList.remove('show');
            }
        }
        
        // Close context menu if clicking elsewhere
        if (!e.target.closest('#contextMenu')) {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu) {
                contextMenu.classList.remove('show');
            }
        }
        
        // Close system menu if clicking elsewhere
        if (!e.target.closest('.systray') && !e.target.closest('#systemMenu')) {
            const systemMenu = document.getElementById('systemMenu');
            if (systemMenu) {
                systemMenu.classList.remove('show');
            }
        }
    });
    
    // Prevent right-click context menu on desktop (except on icons)
    document.getElementById('desktop').addEventListener('contextmenu', function(e) {
        if (!e.target.closest('.desktop-icon')) {
            e.preventDefault();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        // Update taskbar and modals if needed
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            // Ensure modals stay within screen bounds
            const rect = modal.getBoundingClientRect();
            const maxX = window.innerWidth - 200;
            const maxY = window.innerHeight - 150;
            
            if (rect.left > maxX) {
                modal.style.left = maxX + 'px';
            }
            if (rect.top > maxY) {
                modal.style.top = maxY + 'px';
            }
        });
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + Tab: Cycle through open windows (if any)
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            cycleWindows();
        }
        
        // Escape: Close menus or modals
        if (e.key === 'Escape') {
            // Close start menu
            const startMenu = document.querySelector('.start-menu');
            if (startMenu && startMenu.classList.contains('show')) {
                startMenu.classList.remove('show');
                return;
            }
            
            // Close context menu
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && contextMenu.classList.contains('show')) {
                contextMenu.classList.remove('show');
                return;
            }
            
            // Close topmost modal
            const openModals = Array.from(document.querySelectorAll('.modal.show'));
            if (openModals.length > 0) {
                const topModal = openModals.reduce((top, modal) => {
                    return parseInt(modal.style.zIndex || '100') > parseInt(top.style.zIndex || '100') ? modal : top;
                });
                const modalId = topModal.id;
                closeModal(modalId);
            }
        }
        
        // F11: Toggle fullscreen (if supported)
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
}

// initializeScrollAreas is now defined in scrollArea.js
// This function is kept for compatibility but delegates to the new implementation

function cycleWindows() {
    const openModals = Array.from(document.querySelectorAll('.modal.show'));
    if (openModals.length <= 1) return;
    
    // Find current top window
    const currentTop = openModals.reduce((top, modal) => {
        return parseInt(modal.style.zIndex || '100') > parseInt(top.style.zIndex || '100') ? modal : top;
    });
    
    // Move it to back
    currentTop.style.zIndex = '100';
    
    // Bring next window to front
    const otherModals = openModals.filter(m => m !== currentTop);
    if (otherModals.length > 0) {
        const nextTop = otherModals.reduce((top, modal) => {
            return parseInt(modal.style.zIndex || '100') > parseInt(top.style.zIndex || '100') ? modal : top;
        });
        nextTop.style.zIndex = '101';
    }
    
    playClickSound();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance monitoring
function logPerformance(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label} took ${end - start} milliseconds`);
    return result;
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('💥 JavaScript Error:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('💥 Unhandled Promise Rejection:', e.reason);
});

// Export for debugging
window.MyAgileToolbox = {
    // Functions that will be available after modules load
    version: '2.0.0',
    modules: 'loaded'
};