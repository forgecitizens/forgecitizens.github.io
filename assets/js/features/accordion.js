/**
 * ========================================================================
 * SYSTÈME D'ACCORDÉON MODERNE - Windows 98 Style
 * ========================================================================
 * Gestion des accordéons avec transitions fluides, accessibilité,
 * navigation clavier et responsive design.
 */

// Legacy function pour compatibilité HTML onclick handlers
function toggleAccordion(sectionId) {
    const section = document.getElementById(sectionId);
    const toggleIcon = document.getElementById(sectionId.replace('-section', '-toggle'));
    
    if (!section) return;
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    if (section.style.display === 'none' || section.style.display === '') {
        // Open section
        section.style.display = 'block';
        if (toggleIcon) toggleIcon.textContent = '−';
    } else {
        // Close section
        section.style.display = 'none';
        if (toggleIcon) toggleIcon.textContent = '+';
    }
}

/**
 * Toggle visibility of details sections (used for chapter details in research modal)
 */
function toggleDetails(detailsId) {
    const details = document.getElementById(detailsId);
    
    if (!details) {
        console.error('Details element not found:', detailsId);
        return;
    }
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // Toggle display
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'block';
    } else {
        details.style.display = 'none';
    }
    
    // Refresh parent ScrollArea after content change
    setTimeout(() => {
        refreshParentScrollArea(details);
    }, 50);
}

/**
 * Refresh the ScrollArea containing an element
 */
function refreshParentScrollArea(element) {
    // Find the closest scroll-area container
    const scrollArea = element.closest('.scroll-area');
    if (scrollArea && typeof ScrollArea !== 'undefined' && ScrollArea.get) {
        const instance = ScrollArea.get(scrollArea);
        if (instance) {
            instance.refresh();
            console.log('🔄 ScrollArea refreshed after content change');
        }
    }
}

/**
 * Système d'accordéon moderne avec animations et accessibilité
 */
function initializeAccordion() {
    console.log('🎵 Initialisation système accordéon moderne...');
    
    // Sélectionner tous les headers d'accordéon
    document.querySelectorAll('.accordion-header').forEach(header => {
        // Éviter de réattacher les listeners si déjà initialisé
        if (header.dataset.accordionInitialized) return;
        header.dataset.accordionInitialized = 'true';
        
        // Ajouter les attributs d'accessibilité
        setupAccordionAccessibility(header);
        
        // Gestionnaire de clic
        header.addEventListener('click', function(e) {
            e.preventDefault();
            handleAccordionClick(this);
        });
        
        // Navigation clavier
        header.addEventListener('keydown', function(e) {
            handleAccordionKeydown(e, this);
        });
        
        // Effet visuel lors du press/release
        header.addEventListener('mousedown', function() {
            this.classList.add('pressed');
        });
        
        header.addEventListener('mouseup', function() {
            this.classList.remove('pressed');
        });
        
        header.addEventListener('mouseleave', function() {
            this.classList.remove('pressed');
        });
    });
    
    // Observer pour ajustement dynamique des hauteurs
    setupContentResizeObserver();
    
    console.log('✅ Accordéon initialisé:', document.querySelectorAll('.accordion-header').length, 'headers');
}

/**
 * Configuration de l'accessibilité pour les accordéons
 */
function setupAccordionAccessibility(header) {
    const accordionItem = header.parentElement;
    const content = accordionItem.querySelector('.accordion-content');
    
    if (!content) return;
    
    // IDs uniques
    const headerId = `accordion-header-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const contentId = `accordion-content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Attributs ARIA
    header.setAttribute('id', headerId);
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', contentId);
    header.setAttribute('tabindex', '0');
    
    content.setAttribute('id', contentId);
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', headerId);
    
    // Icône si pas présente
    let icon = header.querySelector('.accordion-icon');
    if (!icon) {
        icon = document.createElement('span');
        icon.className = 'accordion-icon';
        icon.textContent = '▼';
        icon.setAttribute('aria-hidden', 'true');
        header.appendChild(icon);
    }
}

/**
 * Gestion du clic sur un accordéon
 */
function handleAccordionClick(header) {
    const accordionItem = header.parentElement;
    const content = accordionItem.querySelector('.accordion-content');
    const isCurrentlyActive = accordionItem.classList.contains('active');
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // Comportement accordéon : fermer les autres dans le même conteneur
    const container = accordionItem.closest('.accordion-container') || accordionItem.parentElement;
    const siblingAccordions = container.querySelectorAll('.accordion-item');
    
    siblingAccordions.forEach(sibling => {
        if (sibling !== accordionItem) {
            closeAccordionItem(sibling);
        }
    });
    
    // Toggle de l'accordéon actuel
    if (isCurrentlyActive) {
        closeAccordionItem(accordionItem);
    } else {
        openAccordionItem(accordionItem);
    }
}

/**
 * Ouvrir un élément d'accordéon
 */
function openAccordionItem(accordionItem) {
    const header = accordionItem.querySelector('.accordion-header');
    const content = accordionItem.querySelector('.accordion-content');
    
    if (!content || !header) return;
    
    // État actif
    accordionItem.classList.add('active');
    header.setAttribute('aria-expanded', 'true');
    
    // Animation d'ouverture
    content.style.height = content.scrollHeight + 'px';
    
    // Refresh ScrollArea after transition completes (CSS transition is 0.2s)
    setTimeout(() => {
        refreshParentScrollArea(accordionItem);
    }, 250);
    
    // Focus management
    content.setAttribute('tabindex', '-1');
    
    console.log('📂 Accordéon ouvert:', accordionItem.id || 'sans-id');
}

/**
 * Fermer un élément d'accordéon
 */
function closeAccordionItem(accordionItem) {
    const header = accordionItem.querySelector('.accordion-header');
    const content = accordionItem.querySelector('.accordion-content');
    
    if (!content || !header) return;
    
    // État inactif
    accordionItem.classList.remove('active');
    header.setAttribute('aria-expanded', 'false');
    
    // Animation de fermeture
    content.style.height = '0px';
    
    // Refresh ScrollArea after transition completes
    setTimeout(() => {
        refreshParentScrollArea(accordionItem);
    }, 250);
    
    // Focus management
    content.removeAttribute('tabindex');
    
    console.log('📁 Accordéon fermé:', accordionItem.id || 'sans-id');
}

/**
 * Gestion de la navigation clavier
 */
function handleAccordionKeydown(e, header) {
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleAccordionClick(header);
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            focusNextAccordion(header);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            focusPreviousAccordion(header);
            break;
            
        case 'Home':
            e.preventDefault();
            focusFirstAccordion(header);
            break;
            
        case 'End':
            e.preventDefault();
            focusLastAccordion(header);
            break;
    }
}

/**
 * Navigation vers l'accordéon suivant
 */
function focusNextAccordion(currentHeader) {
    const allHeaders = Array.from(document.querySelectorAll('.accordion-header'));
    const currentIndex = allHeaders.indexOf(currentHeader);
    const nextIndex = (currentIndex + 1) % allHeaders.length;
    allHeaders[nextIndex].focus();
}

/**
 * Navigation vers l'accordéon précédent
 */
function focusPreviousAccordion(currentHeader) {
    const allHeaders = Array.from(document.querySelectorAll('.accordion-header'));
    const currentIndex = allHeaders.indexOf(currentHeader);
    const prevIndex = currentIndex === 0 ? allHeaders.length - 1 : currentIndex - 1;
    allHeaders[prevIndex].focus();
}

/**
 * Navigation vers le premier accordéon
 */
function focusFirstAccordion() {
    const firstHeader = document.querySelector('.accordion-header');
    if (firstHeader) firstHeader.focus();
}

/**
 * Navigation vers le dernier accordéon
 */
function focusLastAccordion() {
    const allHeaders = document.querySelectorAll('.accordion-header');
    if (allHeaders.length > 0) {
        allHeaders[allHeaders.length - 1].focus();
    }
}

/**
 * Observer pour ajustement automatique des hauteurs
 */
function setupContentResizeObserver() {
    const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const content = entry.target;
            const accordionItem = content.closest('.accordion-item');
            
            if (accordionItem && accordionItem.classList.contains('active')) {
                // Réajuster la hauteur si le contenu change
                content.style.height = content.scrollHeight + 'px';
            }
        });
    });
    
    // Observer tous les contenus d'accordéon
    document.querySelectorAll('.accordion-content').forEach(content => {
        resizeObserver.observe(content);
    });
    
    console.log('👀 ResizeObserver configuré pour', document.querySelectorAll('.accordion-content').length, 'contenus');
}

/**
 * Utilitaire pour créer un accordéon programmatiquement
 */
function createAccordionItem(title, content, container) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
        <span>${title}</span>
        <span class="accordion-icon" aria-hidden="true">▼</span>
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'accordion-content';
    
    const contentInner = document.createElement('div');
    contentInner.className = 'accordion-content-inner';
    contentInner.innerHTML = content;
    
    contentDiv.appendChild(contentInner);
    accordionItem.appendChild(header);
    accordionItem.appendChild(contentDiv);
    
    if (container) {
        container.appendChild(accordionItem);
    }
    
    // Réinitialiser pour ce nouvel élément
    setupAccordionAccessibility(header);
    header.addEventListener('click', () => handleAccordionClick(header));
    header.addEventListener('keydown', (e) => handleAccordionKeydown(e, header));
    
    return accordionItem;
}

/**
 * Migration des accordéons legacy vers le nouveau système
 */
function upgradeAccordionSections() {
    console.log('🔄 Migration accordéons legacy...');
    
    let upgradedCount = 0;
    
    document.querySelectorAll('.accordion-section').forEach(section => {
        const header = section.querySelector('.accordion-header');
        const content = section.querySelector('.accordion-content');
        
        if (!header || !content) return;
        
        // Convertir vers la nouvelle structure
        section.classList.remove('accordion-section');
        section.classList.add('accordion-item');
        
        // Migrer le contenu vers le nouveau wrapper
        const existingContent = content.innerHTML;
        content.innerHTML = `<div class="accordion-content-inner">${existingContent}</div>`;
        
        // Configurer le nouvel accordéon
        setupAccordionAccessibility(header);
        
        // Remplacer les handlers onclick par les nouveaux
        header.removeAttribute('onclick');
        header.addEventListener('click', () => handleAccordionClick(header));
        header.addEventListener('keydown', (e) => handleAccordionKeydown(e, header));
        
        // Ajuster les styles
        content.style.display = '';
        content.style.height = '0px';
        
        upgradedCount++;
    });
    
    console.log(`✅ ${upgradedCount} accordéon(s) legacy migré(s)`);
}

/**
 * Initialisation complète du système accordéon
 */
function initializeFullAccordionSystem() {
    console.log('🎹 Initialisation système accordéon complet...');
    
    // Migrer les accordéons legacy
    upgradeAccordionSections();
    
    // Initialiser le système moderne
    initializeAccordion();
    
    console.log('🎵 Système accordéon initialisé avec succès');
}

// Auto-initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFullAccordionSystem);
} else {
    // DOM déjà chargé
    initializeFullAccordionSystem();
}

// FAQ specific functions
function searchFAQ() {
    const searchTerm = document.getElementById('faqSearch').value.toLowerCase();
    const accordionItems = document.querySelectorAll('.accordion-item');
    let visibleCount = 0;
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const headerText = header ? header.textContent.toLowerCase() : '';
        const contentText = content ? content.textContent.toLowerCase() : '';
        
        if (headerText.includes(searchTerm) || contentText.includes(searchTerm)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
            // Close if hidden
            item.classList.remove('active');
            if (content) content.style.height = '0px';
        }
    });
    
    // Show/hide no results message
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function clearFAQSearch() {
    const searchInput = document.getElementById('faqSearch');
    if (searchInput) {
        searchInput.value = '';
        searchFAQ(); // Reset display
    }
}

// Skills accordion functions
function filterSkills(category) {
    const skillItems = document.querySelectorAll('.skill-item');
    const filterButtons = document.querySelectorAll('.skill-filter');
    
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="filterSkills('${category}')"]`).classList.add('active');
    
    skillItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    playClickSound();
}

// Portfolio accordion functions  
function filterProjects(category) {
    const projectItems = document.querySelectorAll('.project-item');
    const filterButtons = document.querySelectorAll('.project-filter');
    
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="filterProjects('${category}')"]`).classList.add('active');
    
    projectItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    playClickSound();
}

function openProject(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
        playClickSound();
    }
}

// Testimonial carousel
let currentTestimonial = 0;

function showTestimonial(index) {
    const testimonials = document.querySelectorAll('.testimonial-item');
    const indicators = document.querySelectorAll('.testimonial-indicator');
    
    if (testimonials.length === 0) return;
    
    // Hide all testimonials
    testimonials.forEach(testimonial => {
        testimonial.classList.remove('active');
    });
    
    // Update indicators
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
    });
    
    // Show current testimonial
    if (testimonials[index]) {
        testimonials[index].classList.add('active');
    }
    if (indicators[index]) {
        indicators[index].classList.add('active');
    }
    
    currentTestimonial = index;
}

function nextTestimonial() {
    const testimonials = document.querySelectorAll('.testimonial-item');
    const next = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(next);
    playClickSound();
}

function prevTestimonial() {
    const testimonials = document.querySelectorAll('.testimonial-item');
    const prev = currentTestimonial === 0 ? testimonials.length - 1 : currentTestimonial - 1;
    showTestimonial(prev);
    playClickSound();
}

// Auto-advance testimonials
function startTestimonialAutoplay() {
    setInterval(() => {
        const testimonials = document.querySelectorAll('.testimonial-item');
        if (testimonials.length > 1) {
            nextTestimonial();
        }
    }, 5000); // Change every 5 seconds
}