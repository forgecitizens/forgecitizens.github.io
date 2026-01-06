/**
 * ========================================================================
 * MODERN SCROLL AREA COMPONENT - Windows 98 Style
 * ========================================================================
 * A robust custom scrollbar implementation that:
 * - Maintains the Windows 98 aesthetic
 * - Works with dynamically changing content
 * - Supports touch, mouse, and keyboard navigation
 * - Is accessible and follows modern standards
 * - Does NOT restructure the DOM (preserves event listeners)
 */

class ScrollArea {
    static instances = new Map();
    
    constructor(selector, options = {}) {
        // Handle both selector string and element
        this.container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!this.container) {
            console.warn('ScrollArea: Container not found', selector);
            return;
        }
        
        // Prevent double initialization
        if (ScrollArea.instances.has(this.container)) {
            console.log('ScrollArea: Already initialized', selector);
            return ScrollArea.instances.get(this.container);
        }
        
        this.options = {
            scrollStep: 40,           // Pixels per arrow click
            pageScrollRatio: 0.9,     // Percentage of viewport for page scroll
            wheelMultiplier: 1,       // Mouse wheel speed multiplier
            autoHide: false,          // Hide scrollbar when not scrolling
            hideDelay: 1500,          // ms before hiding scrollbar
            ...options
        };
        
        this.isDragging = false;
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.buttonInterval = null;
        
        this.init();
        ScrollArea.instances.set(this.container, this);
    }
    
    init() {
        // Setup container structure WITHOUT destroying existing content
        this.setupStructure();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial scrollbar update
        this.updateScrollbar();
        
        // Setup resize observer for dynamic content
        this.setupResizeObserver();
        
        // Setup mutation observer for DOM changes
        this.setupMutationObserver();
        
        console.log('✅ ScrollArea initialized:', this.container.id || 'unnamed');
    }
    
    setupStructure() {
        // Add the scroll-area class to container
        this.container.classList.add('scroll-area');
        
        // Check if structure already exists (avoid double wrapping)
        let content = this.container.querySelector('.scroll-content');
        let scrollbar = this.container.querySelector('.scroll-bar');
        
        if (!content) {
            // Wrap existing content WITHOUT using innerHTML (preserves event listeners)
            content = document.createElement('div');
            content.className = 'scroll-content';
            
            // Move all children to the content wrapper
            while (this.container.firstChild) {
                content.appendChild(this.container.firstChild);
            }
            
            this.container.appendChild(content);
        }
        
        if (!scrollbar) {
            // Create scrollbar structure
            scrollbar = document.createElement('div');
            scrollbar.className = 'scroll-bar';
            scrollbar.setAttribute('role', 'scrollbar');
            scrollbar.setAttribute('aria-controls', content.id || '');
            scrollbar.setAttribute('aria-orientation', 'vertical');
            scrollbar.innerHTML = `
                <button class="scroll-button scroll-button-up" aria-label="Scroll up" tabindex="-1">▲</button>
                <div class="scroll-track">
                    <div class="scroll-thumb" tabindex="0" role="slider" aria-label="Scroll position"></div>
                </div>
                <button class="scroll-button scroll-button-down" aria-label="Scroll down" tabindex="-1">▼</button>
            `;
            
            this.container.appendChild(scrollbar);
        }
        
        // Create spacer for layout if not exists
        let spacer = this.container.querySelector('.scroll-spacer');
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.className = 'scroll-spacer';
            this.container.insertBefore(spacer, scrollbar);
        }
        
        // Store references
        this.content = content;
        this.scrollbar = scrollbar;
        this.spacer = spacer;
        this.track = scrollbar.querySelector('.scroll-track');
        this.thumb = scrollbar.querySelector('.scroll-thumb');
        this.buttonUp = scrollbar.querySelector('.scroll-button-up');
        this.buttonDown = scrollbar.querySelector('.scroll-button-down');
    }
    
    setupEventListeners() {
        // Mouse wheel scrolling - passive to allow native scroll
        this.content.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });
        
        // Thumb dragging
        this.thumb.addEventListener('mousedown', this.handleThumbMouseDown.bind(this));
        
        // Touch support for thumb
        this.thumb.addEventListener('touchstart', this.handleThumbTouchStart.bind(this), { passive: false });
        
        // Track clicking (page up/down)
        this.track.addEventListener('mousedown', this.handleTrackClick.bind(this));
        
        // Arrow button clicks with repeat
        this.buttonUp.addEventListener('mousedown', () => this.startScrolling(-1));
        this.buttonDown.addEventListener('mousedown', () => this.startScrolling(1));
        
        // Stop scrolling on mouseup/mouseleave
        const stopScrolling = () => this.stopScrolling();
        this.buttonUp.addEventListener('mouseup', stopScrolling);
        this.buttonUp.addEventListener('mouseleave', stopScrolling);
        this.buttonDown.addEventListener('mouseup', stopScrolling);
        this.buttonDown.addEventListener('mouseleave', stopScrolling);
        
        // Keyboard navigation on content
        this.content.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Keyboard navigation on thumb
        this.thumb.addEventListener('keydown', this.handleThumbKeydown.bind(this));
        
        // Native scroll event (for programmatic scrolling)
        this.content.addEventListener('scroll', () => {
            this.updateThumbPosition();
            this.updateButtonStates();
        });
        
        // Touch scrolling on content
        this.content.addEventListener('touchstart', this.handleContentTouchStart.bind(this), { passive: true });
    }
    
    setupResizeObserver() {
        if (!window.ResizeObserver) return;
        
        this.resizeObserver = new ResizeObserver(() => {
            // Debounce resize updates
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.updateScrollbar();
            }, 50);
        });
        
        this.resizeObserver.observe(this.container);
        this.resizeObserver.observe(this.content);
    }
    
    setupMutationObserver() {
        if (!window.MutationObserver) return;
        
        this.mutationObserver = new MutationObserver(() => {
            // Debounce mutation updates
            clearTimeout(this.mutationTimeout);
            this.mutationTimeout = setTimeout(() => {
                this.updateScrollbar();
            }, 150); // Slightly longer to catch CSS transitions
        });
        
        this.mutationObserver.observe(this.content, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,  // Watch for style changes (display, height, etc.)
            attributeFilter: ['style', 'class'] // Only watch style and class changes
        });
    }
    
    // ========== Event Handlers ==========
    
    handleWheel(e) {
        // Don't prevent default - let native scroll work
        // The native scroll event listener will update thumb position
        // Only scroll programmatically if native scroll isn't working
        const beforeScroll = this.content.scrollTop;
        
        // Use a small delay to check if native scroll happened
        requestAnimationFrame(() => {
            // If scroll position didn't change and content is scrollable, scroll manually
            if (this.content.scrollTop === beforeScroll) {
                const delta = e.deltaY * this.options.wheelMultiplier;
                this.content.scrollTop += delta;
            }
            this.updateScrollbar();
        });
    }
    
    handleThumbMouseDown(e) {
        e.preventDefault();
        this.startDragging(e.clientY);
        
        const onMouseMove = (e) => this.handleDragMove(e.clientY);
        const onMouseUp = () => {
            this.stopDragging();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    handleThumbTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDragging(touch.clientY);
        
        const onTouchMove = (e) => {
            const touch = e.touches[0];
            this.handleDragMove(touch.clientY);
        };
        const onTouchEnd = () => {
            this.stopDragging();
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
        
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
    }
    
    handleContentTouchStart(e) {
        // Track touch for scroll inertia (optional enhancement)
        this.lastTouchY = e.touches[0].clientY;
    }
    
    handleTrackClick(e) {
        // Don't process if clicking on thumb
        if (e.target === this.thumb) return;
        
        const rect = this.track.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const thumbRect = this.thumb.getBoundingClientRect();
        const thumbMiddle = thumbRect.top - rect.top + thumbRect.height / 2;
        
        // Page up or page down based on click position relative to thumb
        const pageAmount = this.content.clientHeight * this.options.pageScrollRatio;
        
        if (clickY < thumbMiddle) {
            this.scrollBy(-pageAmount);
        } else {
            this.scrollBy(pageAmount);
        }
    }
    
    handleKeydown(e) {
        const { scrollStep, pageScrollRatio } = this.options;
        const pageAmount = this.content.clientHeight * pageScrollRatio;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.scrollBy(-scrollStep);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.scrollBy(scrollStep);
                break;
            case 'PageUp':
                e.preventDefault();
                this.scrollBy(-pageAmount);
                break;
            case 'PageDown':
                e.preventDefault();
                this.scrollBy(pageAmount);
                break;
            case 'Home':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.scrollTo(0);
                }
                break;
            case 'End':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.scrollTo(this.content.scrollHeight);
                }
                break;
        }
    }
    
    handleThumbKeydown(e) {
        // Allow keyboard control when thumb is focused
        this.handleKeydown(e);
    }
    
    // ========== Dragging Logic ==========
    
    startDragging(clientY) {
        this.isDragging = true;
        this.dragStartY = clientY;
        this.dragStartScrollTop = this.content.scrollTop;
        this.thumb.classList.add('dragging');
        document.body.style.userSelect = 'none';
    }
    
    handleDragMove(clientY) {
        if (!this.isDragging) return;
        
        const deltaY = clientY - this.dragStartY;
        const trackHeight = this.track.clientHeight;
        const thumbHeight = this.thumb.offsetHeight;
        const maxThumbTravel = trackHeight - thumbHeight;
        const maxScrollTop = this.content.scrollHeight - this.content.clientHeight;
        
        if (maxThumbTravel <= 0 || maxScrollTop <= 0) return;
        
        const scrollRatio = deltaY / maxThumbTravel;
        const newScrollTop = this.dragStartScrollTop + (scrollRatio * maxScrollTop);
        
        this.content.scrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop));
    }
    
    stopDragging() {
        this.isDragging = false;
        this.thumb.classList.remove('dragging');
        document.body.style.userSelect = '';
    }
    
    // ========== Button Scrolling ==========
    
    startScrolling(direction) {
        // Immediate scroll
        this.scrollBy(direction * this.options.scrollStep);
        
        // Repeat scroll after delay
        this.buttonTimeout = setTimeout(() => {
            this.buttonInterval = setInterval(() => {
                this.scrollBy(direction * this.options.scrollStep);
            }, 50);
        }, 400);
    }
    
    stopScrolling() {
        clearTimeout(this.buttonTimeout);
        clearInterval(this.buttonInterval);
        this.buttonTimeout = null;
        this.buttonInterval = null;
    }
    
    // ========== Scrollbar Updates ==========
    
    updateScrollbar() {
        const viewportHeight = this.content.clientHeight;
        const contentHeight = this.content.scrollHeight;
        const hasScroll = contentHeight > viewportHeight + 1; // +1 for rounding errors
        
        console.log(`📜 ScrollArea update: viewport=${viewportHeight}, content=${contentHeight}, hasScroll=${hasScroll}`);
        
        // Toggle visibility
        if (hasScroll) {
            this.container.classList.remove('no-scroll');
            this.scrollbar.style.display = '';
            this.scrollbar.setAttribute('aria-valuenow', this.content.scrollTop);
            this.scrollbar.setAttribute('aria-valuemin', 0);
            this.scrollbar.setAttribute('aria-valuemax', contentHeight - viewportHeight);
            this.updateThumbSize();
            this.updateThumbPosition();
            this.updateButtonStates();
        } else {
            this.container.classList.add('no-scroll');
            this.scrollbar.style.display = 'none';
        }
    }
    
    updateThumbSize() {
        const viewportHeight = this.content.clientHeight;
        const contentHeight = this.content.scrollHeight;
        const trackHeight = this.track.clientHeight;
        
        // Calculate thumb height proportionally
        const ratio = viewportHeight / contentHeight;
        const thumbHeight = Math.max(20, Math.floor(trackHeight * ratio));
        
        this.thumb.style.height = `${thumbHeight}px`;
    }
    
    updateThumbPosition() {
        const viewportHeight = this.content.clientHeight;
        const contentHeight = this.content.scrollHeight;
        const scrollTop = this.content.scrollTop;
        const trackHeight = this.track.clientHeight;
        const thumbHeight = this.thumb.offsetHeight;
        
        const maxScrollTop = contentHeight - viewportHeight;
        const maxThumbTop = trackHeight - thumbHeight;
        
        if (maxScrollTop <= 0) {
            this.thumb.style.top = '0px';
            return;
        }
        
        const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;
        this.thumb.style.top = `${Math.max(0, Math.min(maxThumbTop, thumbTop))}px`;
        
        // Update ARIA
        this.scrollbar.setAttribute('aria-valuenow', Math.round(scrollTop));
    }
    
    updateButtonStates() {
        const scrollTop = this.content.scrollTop;
        const maxScrollTop = this.content.scrollHeight - this.content.clientHeight;
        
        // Update button disabled states
        this.buttonUp.classList.toggle('disabled', scrollTop <= 0);
        this.buttonDown.classList.toggle('disabled', scrollTop >= maxScrollTop - 1);
    }
    
    // ========== Public API ==========
    
    scrollTo(position, smooth = false) {
        if (smooth) {
            this.content.scrollTo({
                top: position,
                behavior: 'smooth'
            });
        } else {
            this.content.scrollTop = position;
        }
        this.updateThumbPosition();
        this.updateButtonStates();
    }
    
    scrollBy(delta, smooth = false) {
        if (smooth) {
            this.content.scrollBy({
                top: delta,
                behavior: 'smooth'
            });
        } else {
            this.content.scrollTop += delta;
        }
        this.updateThumbPosition();
        this.updateButtonStates();
    }
    
    scrollToElement(element, offset = 0) {
        const elementRect = element.getBoundingClientRect();
        const contentRect = this.content.getBoundingClientRect();
        const scrollTop = this.content.scrollTop + (elementRect.top - contentRect.top) - offset;
        this.scrollTo(scrollTop);
    }
    
    refresh() {
        this.updateScrollbar();
    }
    
    destroy() {
        // Cleanup observers
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Cleanup timeouts
        clearTimeout(this.resizeTimeout);
        clearTimeout(this.mutationTimeout);
        clearTimeout(this.buttonTimeout);
        clearInterval(this.buttonInterval);
        
        // Remove from instances
        ScrollArea.instances.delete(this.container);
        
        // Remove added elements (keep original content)
        if (this.scrollbar) {
            this.scrollbar.remove();
        }
        if (this.spacer) {
            this.spacer.remove();
        }
        
        // Unwrap content
        if (this.content) {
            while (this.content.firstChild) {
                this.container.insertBefore(this.content.firstChild, this.content);
            }
            this.content.remove();
        }
        
        // Remove classes
        this.container.classList.remove('scroll-area', 'no-scroll');
        
        console.log('🗑️ ScrollArea destroyed:', this.container.id || 'unnamed');
    }
    
    // ========== Static Methods ==========
    
    static get(element) {
        return ScrollArea.instances.get(element);
    }
    
    static destroyAll() {
        ScrollArea.instances.forEach(instance => instance.destroy());
    }
    
    static refreshAll() {
        ScrollArea.instances.forEach(instance => instance.refresh());
    }
}

/**
 * Initialize scroll areas for modal content
 * Called when modals are opened
 */
function initializeScrollAreas() {
    console.log('🔄 Initialisation des ScrollAreas...');
    
    // Only initialize for visible modals with content that needs scrolling
    const visibleModals = document.querySelectorAll('.modal.show, .window.show');
    
    visibleModals.forEach(modal => {
        const content = modal.querySelector('.modal-content, .window-content');
        if (!content) return;
        
        // Skip if already a scroll-area
        if (content.classList.contains('scroll-area')) {
            // Just refresh existing instance
            const instance = ScrollArea.get(content);
            if (instance) {
                instance.refresh();
            }
            return;
        }
        
        // Check if content needs scrollbar
        const needsScrollbar = content.scrollHeight > content.clientHeight + 10;
        
        if (needsScrollbar) {
            if (!content.id) {
                content.id = `scrollarea-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            }
            new ScrollArea(content);
        }
    });
    
    console.log('✅ ScrollAreas initialisés:', ScrollArea.instances.size);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScrollArea, initializeScrollAreas };
}
