// Modal/Window functions - Support both old modal and new window systems
function openModal(modalId, htmlFile = null, title = null, width = null, height = null) {
    console.log('🔍 Opening modal:', { modalId, htmlFile, title, width, height });
    
    // Si htmlFile est fourni, créer une modale dynamique
    if (htmlFile) {
        createDynamicModal(modalId, htmlFile, title, width, height);
        return;
    }
    
    // Chercher d'abord dans le nouveau système .window
    let modal = document.getElementById(modalId);
    const isNewWindow = modal && modal.classList.contains('window');
    
    console.log('Modal found:', modalId, modal, 'isNewWindow:', isNewWindow);
    
    if (modal) {
        // ===== AUTO-MINIMIZE: Si une autre modale est déjà ouverte, la minimiser =====
        autoMinimizeOpenModals(modalId);
        
        modal.classList.add('show');
        
        // Set display mode based on modal type
        if (isNewWindow) {
            modal.style.display = 'flex';
        } else if (modalId === 'file-explorer-modal') {
            // File explorer needs flex layout for proper structure
            modal.style.display = 'flex';
        } else {
            modal.style.display = 'block';
        }
        
        // Sizing moderne pour les nouvelles fenêtres
        if (isNewWindow) {
            applyModernWindowSizing(modal, width, height);
        } else {
            // Ancien système de sizing pour rétrocompatibilité
            applyLegacyModalSizing(modal, width, height);
        }
        
        bringToFront(modal);
        
        // Accessibilité et focus management
        setupModalAccessibility(modal, isNewWindow);
        
        // Initialisation ScrollArea différée
        setTimeout(() => {
            initializeModalScrollArea(modal, modalId, isNewWindow);
        }, 200);
        
        console.log('Modal opened successfully');
        
        // Mettre à jour la taskbar pour montrer la modale active
        if (typeof updateTaskbar === 'function') {
            updateTaskbar();
        }
        
        // Initialiser la galerie si c'est la modale gallery
        if (modalId === 'ia-gallery-modal' && typeof GalleryModule !== 'undefined') {
            setTimeout(() => {
                GalleryModule.init('gallery-content', ['fault-lines']);
            }, 100);
        }
    } else {
        console.error('Modal not found:', modalId);
    }
}

/**
 * Tronque un titre à 8 caractères + "..."
 */
function truncateTitle(title) {
    if (!title) return 'Fenêtre';
    // Retirer les emojis au début si présent pour le comptage
    const cleanTitle = title.replace(/^[\p{Emoji}\s]+/u, '').trim();
    const emoji = title.match(/^[\p{Emoji}\s]+/u)?.[0] || '';
    
    if (cleanTitle.length <= 8) {
        return title; // Pas besoin de tronquer
    }
    return emoji + cleanTitle.substring(0, 8) + '...';
}

/**
 * Récupère le titre d'une modale
 */
function getModalTitle(modal) {
    if (!modal) return 'Fenêtre';
    
    // Essayer plusieurs sélecteurs de titre
    const titleElement = modal.querySelector('.window-title, .modal-title, [class*="title"]');
    if (titleElement && titleElement.textContent.trim()) {
        return truncateTitle(titleElement.textContent.trim());
    }
    
    // Fallback: utiliser l'ID de la modale
    const id = modal.id || '';
    const fallbackTitle = id.replace(/-modal$/, '').replace(/-/g, ' ');
    return truncateTitle(fallbackTitle || 'Fenêtre');
}

/**
 * Minimise automatiquement toutes les modales ouvertes (sauf celle qu'on ouvre)
 */
function autoMinimizeOpenModals(exceptModalId) {
    // Trouver toutes les modales actuellement visibles
    const openModals = document.querySelectorAll('.modal.show, .window.show');
    
    openModals.forEach(modal => {
        if (modal.id !== exceptModalId) {
            console.log(`📥 Auto-minimize: ${modal.id}`);
            minimizeModalSilent(modal.id);
        }
    });
}

/**
 * Minimise une modale sans jouer de son (pour l'auto-minimize)
 */
function minimizeModalSilent(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.remove('show');
    
    // Get modal title avec troncature
    const title = getModalTitle(modal);
    
    // Add to minimized windows if not already there
    if (!minimizedWindows.find(w => w.id === modalId)) {
        minimizedWindows.push({ id: modalId, title: title });
        updateTaskbar();
    }
}

// Sizing moderne pour .window
function applyModernWindowSizing(modal, width, height) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 28; // Subtract taskbar
    const modalId = modal.id || '';
    
    // Liste des modales "compactes" qui ne doivent pas prendre toute la hauteur
    const compactModals = ['contact-modal', 'radio-popup', 'calendar-modal'];
    const isCompact = compactModals.includes(modalId);
    
    // Mobile (phone): near full-screen sauf pour les modales compactes
    if (screenWidth < 480) {
        if (isCompact) {
            // Modale compacte : centré, hauteur auto
            modal.style.width = '95%';
            modal.style.height = 'auto';
            modal.style.maxHeight = (screenHeight - 20) + 'px';
            modal.style.left = '2.5%';
            modal.style.top = '10px';
        } else {
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = screenHeight + 'px';
        }
        return;
    }
    
    // Large phone / small tablet
    if (screenWidth < 768) {
        const tabletWidth = Math.floor(screenWidth * 0.95);
        const tabletHeight = Math.floor(screenHeight * 0.90);
        modal.style.width = tabletWidth + 'px';
        modal.style.height = tabletHeight + 'px';
        modal.style.left = Math.floor((screenWidth - tabletWidth) / 2) + 'px';
        modal.style.top = Math.floor((screenHeight - tabletHeight) / 2) + 'px';
        return;
    }
    
    // Tablet / small desktop
    if (screenWidth < 1024) {
        const smallWidth = Math.floor(screenWidth * 0.90);
        const smallHeight = Math.floor(screenHeight * 0.85);
        modal.style.width = smallWidth + 'px';
        modal.style.height = smallHeight + 'px';
        modal.style.left = Math.floor((screenWidth - smallWidth) / 2) + 'px';
        modal.style.top = Math.floor((screenHeight - smallHeight) / 2) + 'px';
        return;
    }
    
    // Desktop: intelligent sizing with reasonable defaults
    const defaultWidth = 560;  // Medium modal default
    const defaultHeight = 480;
    
    const modalWidth = width || defaultWidth;
    const modalHeight = height || defaultHeight;
    
    // Respect min/max constraints
    const minWidth = 320;
    const minHeight = 200;
    const maxWidth = Math.floor(screenWidth * 0.90);
    const maxHeight = Math.floor(screenHeight * 0.85);
    
    const finalWidth = Math.max(minWidth, Math.min(modalWidth, maxWidth));
    const finalHeight = Math.max(minHeight, Math.min(modalHeight, maxHeight));
    
    // Center with slight upward offset (40% from top instead of 50%)
    const leftPos = Math.floor((screenWidth - finalWidth) / 2);
    const topPos = Math.floor((screenHeight - finalHeight) * 0.4);
    
    modal.style.left = leftPos + 'px';
    modal.style.top = topPos + 'px';
    modal.style.width = finalWidth + 'px';
    modal.style.height = finalHeight + 'px';
    
    console.log(`🪟 Window: ${finalWidth}x${finalHeight} at (${leftPos},${topPos})`);
}

// Sizing legacy pour .modal (rétrocompatibilité)
function applyLegacyModalSizing(modal, width, height) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 28;
    
    // Mobile (phone): near full-screen
    if (screenWidth < 480) {
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = screenHeight + 'px';
        return;
    }
    
    // Large phone / small tablet
    if (screenWidth < 768) {
        const tabletWidth = Math.floor(screenWidth * 0.95);
        const tabletHeight = Math.floor(screenHeight * 0.90);
        modal.style.width = tabletWidth + 'px';
        modal.style.height = tabletHeight + 'px';
        modal.style.left = Math.floor((screenWidth - tabletWidth) / 2) + 'px';
        modal.style.top = Math.floor((screenHeight - tabletHeight) / 2) + 'px';
        return;
    }
    
    // Tablet / small desktop
    if (screenWidth < 1024) {
        const smallWidth = Math.floor(screenWidth * 0.90);
        const smallHeight = Math.floor(screenHeight * 0.85);
        modal.style.width = smallWidth + 'px';
        modal.style.height = smallHeight + 'px';
        modal.style.left = Math.floor((screenWidth - smallWidth) / 2) + 'px';
        modal.style.top = Math.floor((screenHeight - smallHeight) / 2) + 'px';
        return;
    }
    
    // Desktop: 70% instead of 80% for better aesthetics
    const modalWidth = width || Math.floor(screenWidth * 0.70);
    const modalHeight = height || Math.floor(screenHeight * 0.75);
    
    // Center with slight upward offset
    const leftPos = Math.floor((screenWidth - modalWidth) / 2);
    const topPos = Math.floor((screenHeight - modalHeight) * 0.4);
    
    modal.style.left = leftPos + 'px';
    modal.style.top = topPos + 'px';
    modal.style.width = modalWidth + 'px';
    modal.style.height = modalHeight + 'px';
    
    console.log(`📄 Modal legacy: ${modalWidth}x${modalHeight}`);
}

// Accessibilité et focus management
function setupModalAccessibility(modal, isNewWindow) {
    // Focus trap basique
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
    
    // Gestion Escape key
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModal(modal.id);
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
    
    // Stocker la référence pour cleanup
    modal._escapeHandler = handleEscape;
}

// ScrollArea initialization pour modales/windows
function initializeModalScrollArea(modal, modalId, isNewWindow) {
    console.log(`🔍 Init ScrollArea pour ${modalId} (isNewWindow: ${isNewWindow})`);
    
    // Réinitialiser les accordéons AVANT le ScrollArea pour préserver les event listeners
    reinitializeModalAccordions(modal);
    
    // Pour les nouvelles fenêtres, pas de ScrollArea custom - utilise overflow: auto natif
    if (isNewWindow) {
        console.log(`✅ Window moderne: scroll natif activé pour ${modalId}`);
        return;
    }
    
    // File explorer has its own scroll handling via folder-content class
    if (modalId === 'file-explorer-modal') {
        console.log(`✅ File explorer: scroll natif via folder-content`);
        return;
    }
    
    // Pour les anciennes modales, initialise le système ScrollArea custom
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent && !modalContent.classList.contains('scroll-area')) {
        try {
            if (!modalContent.id) {
                modalContent.id = `modal-content-${modalId}`;
            }
            new ScrollArea(modalContent);
            console.log(`✅ ScrollArea custom pour modal #${modalContent.id}`);
        } catch (error) {
            console.error(`❌ Erreur ScrollArea:`, error);
        }
    } else if (modalContent && modalContent.classList.contains('scroll-area')) {
        // Refresh existing ScrollArea if content changed
        const instance = ScrollArea.get ? ScrollArea.get(modalContent) : null;
        if (instance) {
            instance.refresh();
            console.log(`🔄 ScrollArea refreshed pour modal #${modalContent.id}`);
        }
    }
}

/**
 * Réinitialise les accordéons dans une modale spécifique
 * Nécessaire car ScrollArea peut recréer le DOM et perdre les event listeners
 */
function reinitializeModalAccordions(modal) {
    const accordionHeaders = modal.querySelectorAll('.accordion-header');
    if (accordionHeaders.length === 0) return;
    
    console.log(`🎵 Réinitialisation accordéons dans modale:`, accordionHeaders.length, 'headers');
    
    accordionHeaders.forEach(header => {
        // Éviter de réattacher les listeners si déjà initialisé
        if (header.dataset.accordionInitialized) return;
        header.dataset.accordionInitialized = 'true';
        
        // Gestionnaire de clic
        header.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof handleAccordionClick === 'function') {
                handleAccordionClick(this);
            }
        });
        
        // Navigation clavier
        header.addEventListener('keydown', function(e) {
            if (typeof handleAccordionKeydown === 'function') {
                handleAccordionKeydown(e, this);
            }
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
    
    console.log(`✅ Accordéons réinitialisés dans modale`);
}

function closeModal(modalId) {
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        // Cas spécial : démontage du calendrier
        if (modalId === 'calendar-modal' && typeof unmountCalendar === 'function') {
            console.log('🧹 Démontage du calendrier...');
            try {
                unmountCalendar();
            } catch (e) {
                console.warn('Erreur démontage calendrier:', e);
            }
        }
        
        // Cas spécial : retirer le backdrop blur de la machine à écrire
        if (modalId === 'typewriter-modal') {
            const backdrop = document.getElementById('typewriter-backdrop');
            if (backdrop) {
                backdrop.classList.remove('show');
            }
        }
        
        modal.classList.remove('show');
        modal.style.display = 'none';
        
        // Cleanup escape handler
        if (modal._escapeHandler) {
            document.removeEventListener('keydown', modal._escapeHandler);
            delete modal._escapeHandler;
        }
        
        // Remove from minimized windows
        minimizedWindows = minimizedWindows.filter(w => w.id !== modalId);
        updateTaskbar();
    }
}

function minimizeModal(modalId) {
    // Play click sound
    playClickSound();
    
    const modal = document.getElementById(modalId);
    if (modal && minimizedWindows.length < 5) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        
        // Get modal title avec troncature
        const title = getModalTitle(modal);
        
        // Add to minimized windows if not already there
        if (!minimizedWindows.find(w => w.id === modalId)) {
            minimizedWindows.push({ id: modalId, title: title });
            updateTaskbar();
        }
    }
}

function maximizeModal(modalId) {
    // Play click sound
    playClickSound();
    
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.style.width === '100vw') {
            modal.style.width = '400px';
            modal.style.height = '300px';
            modal.style.left = '50px';
            modal.style.top = '50px';
        } else {
            modal.style.width = '100vw';
            modal.style.height = 'calc(100vh - 28px)';
            modal.style.left = '0';
            modal.style.top = '0';
        }
        
        // Refresh ScrollArea after resize (give time for layout to update)
        setTimeout(() => {
            const scrollArea = modal.querySelector('.scroll-area');
            if (scrollArea && typeof ScrollArea !== 'undefined' && ScrollArea.get) {
                const instance = ScrollArea.get(scrollArea);
                if (instance) {
                    instance.refresh();
                    console.log('🔄 ScrollArea refreshed after maximize');
                }
            }
        }, 100);
    }
}

function bringToFront(modal) {
    // Support both .modal and .window systems
    const allModals = document.querySelectorAll('.modal, .window');
    allModals.forEach(m => m.style.zIndex = '100');
    modal.style.zIndex = '101';
}

/**
 * Crée une modale dynamique avec contenu chargé depuis un fichier HTML externe
 */
function createDynamicModal(modalId, htmlFile, title, width = 400, height = 300) {
    // Vérifier si la modale existe déjà
    let existingModal = document.getElementById(modalId);
    if (existingModal) {
        // ===== AUTO-MINIMIZE: Si une autre modale est déjà ouverte, la minimiser =====
        autoMinimizeOpenModals(modalId);
        
        // Si elle existe déjà, juste la rouvrir
        existingModal.classList.add('show');
        const isNewWindow = existingModal.classList.contains('window');
        existingModal.style.display = isNewWindow ? 'flex' : 'block';
        bringToFront(existingModal);
        
        // Mettre à jour la taskbar pour montrer la modale active
        if (typeof updateTaskbar === 'function') {
            updateTaskbar();
        }
        
        // Cas spécial : remonter le calendrier s'il a été démonté
        if (modalId === 'calendar-modal') {
            setTimeout(() => {
                const mountPoint = document.getElementById('calendar-mount-point');
                if (mountPoint && typeof mountCalendar === 'function' && !window.retroCalendar) {
                    console.log('🔄 Remontage du calendrier...');
                    mountCalendar(mountPoint, { showClock: true, enableNotes: true, theme: 'retro' });
                }
            }, 100);
        }
        
        return;
    }
    
    // ===== AUTO-MINIMIZE: Avant de créer une nouvelle modale =====
    autoMinimizeOpenModals(modalId);
    
    // Créer la structure HTML avec nouveau système .window pour meilleure UX
    const modalHTML = `
        <div class="window" id="${modalId}" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
            <div class="window-titlebar">
                <div class="window-title" id="${modalId}-title">${title || 'Fenêtre'}</div>
                <div class="window-controls">
                    <div class="window-button" onclick="minimizeModal('${modalId}')" aria-label="Réduire">_</div>
                    <div class="window-button" onclick="maximizeModal('${modalId}')" aria-label="Agrandir">□</div>
                    <div class="window-button" onclick="closeModal('${modalId}')" aria-label="Fermer">×</div>
                </div>
            </div>
            <div class="window-body">
                <div class="window-content" id="${modalId}-content">
                    <div style="text-align: center; padding: 20px; color: #808080;">
                        <div style="animation: spin 1s linear infinite; display: inline-block;">⏳</div>
                        <div>Chargement...</div>
                    </div>
                </div>
            </div>
            <div class="window-resize-handle" aria-hidden="true"></div>
        </div>
    `;
    
    // Ajouter au DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById(modalId);
    
    // Charger le contenu externe
    fetch(htmlFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            const contentDiv = document.getElementById(`${modalId}-content`);
            if (contentDiv) {
                // Injecter le HTML
                contentDiv.innerHTML = html;
                
                // Exécuter les scripts contenus dans le HTML
                const scripts = contentDiv.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    script.parentNode.replaceChild(newScript, script);
                });
                
                console.log(`✅ Contenu chargé pour ${modalId} depuis ${htmlFile}`);
                console.log(`🔧 ${scripts.length} script(s) réexécuté(s)`);
                
                // Pas besoin d'initialiser ScrollArea pour les nouvelles fenêtres
                console.log(`📅 Window moderne: scroll natif activé pour ${modalId}`);
            }
        })
        .catch(error => {
            console.error(`❌ Erreur chargement ${htmlFile}:`, error);
            const contentDiv = document.getElementById(`${modalId}-content`);
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #800000;">
                        <div>❌ Erreur de chargement</div>
                        <div style="font-size: 10px; margin-top: 10px; color: #606060;">
                            ${error.message}
                        </div>
                    </div>
                `;
            }
        });
    
    // Configurer la modale avec sizing moderne
    applyModernWindowSizing(modal, width, height);
    
    // Afficher et amener au premier plan
    modal.classList.add('show');
    modal.style.display = 'flex';
    bringToFront(modal);
    
    // Accessibilité
    setupModalAccessibility(modal, true);
    
    // Mettre à jour la taskbar pour montrer la modale active
    if (typeof updateTaskbar === 'function') {
        updateTaskbar();
    }
    
    console.log(`🪟 Modale dynamique créée: ${modalId} (${width}x${height})`);
}

function initializeModalDragging() {
    // Modal dragging
    document.querySelectorAll('.modal-header').forEach(header => {
        header.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('modal-button')) return;
            
            draggedModal = this.parentElement;
            bringToFront(draggedModal);
            
            const rect = draggedModal.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
        });
    });

    // Modal resizing
    document.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            resizingModal = this.parentElement;
            bringToFront(resizingModal);
            
            const rect = resizingModal.getBoundingClientRect();
            resizeStart.x = e.clientX;
            resizeStart.y = e.clientY;
            resizeStart.width = rect.width;
            resizeStart.height = rect.height;
            
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Mouse move events
    document.addEventListener('mousemove', function(e) {
        if (draggedModal) {
            draggedModal.style.left = (e.clientX - dragOffset.x) + 'px';
            draggedModal.style.top = (e.clientY - dragOffset.y) + 'px';
        }
        
        if (resizingModal) {
            const newWidth = resizeStart.width + (e.clientX - resizeStart.x);
            const newHeight = resizeStart.height + (e.clientY - resizeStart.y);
            
            if (newWidth > 200) {
                resizingModal.style.width = newWidth + 'px';
            }
            if (newHeight > 150) {
                resizingModal.style.height = newHeight + 'px';
            }
        }
    });

    document.addEventListener('mouseup', function() {
        draggedModal = null;
        resizingModal = null;
    });

    // Click on modal to bring to front
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('mousedown', function() {
            bringToFront(this);
        });
    });
}

function initializeDesktopIcons() {
    console.log('🖥️ Initializing desktop icons...');
    console.log('🔍 window.openFolderExplorer =', typeof window.openFolderExplorer);
    
    // Desktop icon functionality
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            // Play click sound
            playClickSound();
            
            // Remove selection from other icons
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            // Select this icon
            this.classList.add('selected');
            
            // Check if this is a folder navigation icon
            const folderPath = this.getAttribute('data-folder-path');
            console.log('📂 Click on icon, folderPath =', folderPath);
            console.log('📂 window.openFolderExplorer at click time =', typeof window.openFolderExplorer);
            
            if (folderPath !== null) {
                // Use window.openFolderExplorer to ensure we get the global function
                if (typeof window.openFolderExplorer === 'function') {
                    console.log('✅ Calling openFolderExplorer with path:', folderPath);
                    window.openFolderExplorer(folderPath);
                } else {
                    console.error('❌ openFolderExplorer not found, falling back to modal');
                    const modalId = this.getAttribute('data-modal') + '-modal';
                    openModal(modalId);
                }
                return;
            }
            
            // Open modal immediately on single click
            const modalId = this.getAttribute('data-modal') + '-modal';
            console.log('Opening modal:', modalId); // Debug log
            openModal(modalId);
        });

        // Right click context menu
        icon.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            currentContextIcon = this;
            
            const contextMenu = document.getElementById('contextMenu');
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
            contextMenu.classList.add('show');
        });
    });

    // Deselect icons when clicking on desktop
    document.getElementById('desktop').addEventListener('click', function(e) {
        if (e.target === this) {
            document.querySelectorAll('.desktop-icon').forEach(icon => {
                icon.classList.remove('selected');
            });
        }
    });
}

function initializeContextMenu() {
    // Context menu functions
    window.openFromContext = function() {
        if (currentContextIcon) {
            const modalId = currentContextIcon.getAttribute('data-modal') + '-modal';
            openModal(modalId);
            document.getElementById('contextMenu').classList.remove('show');
        }
    };

    window.showInfo = function() {
        document.getElementById('infoPopup').classList.add('show');
        document.getElementById('contextMenu').classList.remove('show');
    };

    window.closeInfo = function() {
        document.getElementById('infoPopup').classList.remove('show');
    };

    // Close info popup when clicking elsewhere
    document.addEventListener('click', function(e) {
        const infoPopup = document.getElementById('infoPopup');
        if (!infoPopup.contains(e.target) && !e.target.closest('.context-menu-item')) {
            infoPopup.classList.remove('show');
        }
    });
}