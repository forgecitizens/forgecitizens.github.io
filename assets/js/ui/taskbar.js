// Update date and time
function updateDateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    document.getElementById('datetime').textContent = `${timeString} ${dateString}`;
}

// Start menu functionality
function initializeStartMenu() {
    document.getElementById('startButton').addEventListener('click', function(e) {
        e.stopPropagation();
        playClickSound();
        const startMenu = document.getElementById('startMenu');
        const startButton = document.getElementById('startButton');
        
        if (startMenu.classList.contains('show')) {
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        } else {
            startMenu.classList.add('show');
            startButton.classList.add('active');
        }
    });
    
    // Start menu items functionality
    document.querySelectorAll('.start-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const modalData = this.getAttribute('data-modal');
            const folderPath = this.getAttribute('data-folder-path');
            
            // Gestion spéciale pour les dossiers (Programmes, etc.)
            if (folderPath !== null) {
                if (typeof window.openFolderExplorer === 'function') {
                    window.openFolderExplorer(folderPath);
                } else {
                    console.error('openFolderExplorer not available');
                }
            }
            // Gestion spéciale pour le calendrier
            else if (modalData === 'calendar') {
                createDynamicModal('calendar-modal', 'components/calendar/calendar-content.html', '📅 Calendrier', 420, 480);
            } else if (modalData) {
                const modalId = modalData + '-modal';
                openModal(modalId);
            }
            
            // Close start menu
            const startMenu = document.getElementById('startMenu');
            const startButton = document.getElementById('startButton');
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    });
}

// Global click handler
function initializeGlobalHandlers() {
    // Close start menu and context menu when clicking elsewhere
    document.addEventListener('click', function(e) {
        const startMenu = document.getElementById('startMenu');
        const startButton = document.getElementById('startButton');
        const contextMenu = document.getElementById('contextMenu');
        const moreMenu = document.getElementById('taskbarMoreMenu');
        const moreButton = document.getElementById('taskbarMoreButton');
        
        // Close start menu
        if (!startButton.contains(e.target)) {
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        }
        
        // Close context menu
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.remove('show');
        }
        
        // Close "More" menu
        if (moreMenu && moreButton && !moreButton.contains(e.target) && !moreMenu.contains(e.target)) {
            moreMenu.classList.remove('show');
            moreButton.classList.remove('active');
        }
    });
}

// ===== TASKBAR AVEC SUPPORT "PLUS/MORE" =====
function updateTaskbar() {
    const taskbarWindows = document.getElementById('taskbarWindows');
    taskbarWindows.innerHTML = '';
    
    // Construire la liste complète : modale active + modales minimisées
    const allWindows = [];
    
    // Trouver la modale active (visible)
    const activeModal = document.querySelector('.modal.show, .window.show');
    if (activeModal && activeModal.id) {
        const title = typeof getModalTitle === 'function' ? getModalTitle(activeModal) : activeModal.id;
        allWindows.push({ id: activeModal.id, title: title, isActive: true });
    }
    
    // Ajouter les modales minimisées
    minimizedWindows.forEach(w => {
        allWindows.push({ ...w, isActive: false });
    });
    
    if (allWindows.length === 0) return;
    
    const isMobile = window.innerWidth < 768;
    const maxVisibleOnMobile = 1; // Seulement 1 modale visible dans la taskbar sur mobile
    
    if (isMobile && allWindows.length > maxVisibleOnMobile) {
        // ===== MODE MOBILE: 1 visible + bouton "Plus" =====
        
        // Afficher la première fenêtre (priorité à l'active)
        const firstWindow = allWindows[0];
        const button = document.createElement('div');
        button.className = 'taskbar-window' + (firstWindow.isActive ? ' active' : '');
        button.textContent = firstWindow.title;
        button.onclick = () => {
            if (firstWindow.isActive) {
                // Cliquer sur la modale active la met au premier plan
                bringToFront(document.getElementById(firstWindow.id));
            } else {
                restoreWindow(firstWindow.id);
            }
        };
        taskbarWindows.appendChild(button);
        
        // Créer le bouton "Plus" avec le nombre de modales cachées
        const hiddenCount = allWindows.length - maxVisibleOnMobile;
        if (hiddenCount > 0) {
            const moreButton = document.createElement('div');
            moreButton.className = 'taskbar-more-button';
            moreButton.id = 'taskbarMoreButton';
            
            // Détecter la langue (FR par défaut)
            const lang = document.documentElement.lang || 'fr';
            const isFrench = lang.toLowerCase().startsWith('fr');
            moreButton.textContent = isFrench ? `Plus (${hiddenCount})` : `More (${hiddenCount})`;
            
            moreButton.onclick = (e) => {
                e.stopPropagation();
                toggleMoreMenu();
            };
            taskbarWindows.appendChild(moreButton);
            
            // Créer le menu déroulant "Plus"
            createMoreMenu(allWindows.slice(maxVisibleOnMobile));
        }
        
    } else {
        // ===== MODE DESKTOP ou peu de modales: affichage normal =====
        allWindows.forEach(window => {
            const button = document.createElement('div');
            button.className = 'taskbar-window' + (window.isActive ? ' active' : '');
            button.textContent = window.title;
            button.onclick = () => {
                if (window.isActive) {
                    bringToFront(document.getElementById(window.id));
                } else {
                    restoreWindow(window.id);
                }
            };
            taskbarWindows.appendChild(button);
        });
    }
}

/**
 * Crée le menu déroulant pour les modales cachées
 */
function createMoreMenu(hiddenWindows) {
    // Supprimer l'ancien menu s'il existe
    let existingMenu = document.getElementById('taskbarMoreMenu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    if (!hiddenWindows || hiddenWindows.length === 0) return;
    
    const menu = document.createElement('div');
    menu.className = 'taskbar-more-menu';
    menu.id = 'taskbarMoreMenu';
    
    // Ajouter les modales cachées
    hiddenWindows.forEach(window => {
        const item = document.createElement('div');
        item.className = 'taskbar-more-menu-item' + (window.isActive ? ' active' : '');
        item.textContent = window.title;
        item.onclick = (e) => {
            e.stopPropagation();
            if (window.isActive) {
                closeMoreMenu();
                bringToFront(document.getElementById(window.id));
            } else {
                restoreWindowFromMore(window.id);
            }
        };
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
}

/**
 * Affiche/masque le menu "Plus"
 */
function toggleMoreMenu() {
    const menu = document.getElementById('taskbarMoreMenu');
    const button = document.getElementById('taskbarMoreButton');
    
    if (menu) {
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
            if (button) button.classList.remove('active');
        } else {
            // Positionner le menu au-dessus du bouton
            if (button) {
                const rect = button.getBoundingClientRect();
                menu.style.left = rect.left + 'px';
                menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
                button.classList.add('active');
            }
            menu.classList.add('show');
        }
    }
}

/**
 * Ferme le menu "Plus"
 */
function closeMoreMenu() {
    const menu = document.getElementById('taskbarMoreMenu');
    const button = document.getElementById('taskbarMoreButton');
    if (menu) menu.classList.remove('show');
    if (button) button.classList.remove('active');
}

/**
 * Restaure une fenêtre depuis le menu "Plus"
 * La modale actuellement affichée (s'il y en a une) sera auto-minimisée par openModal
 */
function restoreWindowFromMore(modalId) {
    closeMoreMenu();
    
    // Retirer de la liste des minimisées AVANT d'appeler openModal
    // (pour éviter qu'elle soit re-minimisée par autoMinimizeOpenModals)
    minimizedWindows = minimizedWindows.filter(w => w.id !== modalId);
    
    // Ouvrir la modale (autoMinimize les autres si nécessaire)
    openModal(modalId);
}

function restoreWindow(modalId) {
    closeMoreMenu();
    
    const modal = document.getElementById(modalId);
    if (modal) {
        // Retirer de la liste des minimisées AVANT d'appeler openModal
        minimizedWindows = minimizedWindows.filter(w => w.id !== modalId);
        
        // Ouvrir la modale (autoMinimize les autres si nécessaire)
        openModal(modalId);
    }
}

// Main taskbar initialization function
function initializeTaskbar() {
    initializeStartMenu();
    initializeGlobalHandlers();
    initializeDateTimeClick(); // Ajouter l'événement de clic sur la date/heure
    initializeAboutPopup(); // Initialiser la popup "Qui suis-je ?"
    initializeTrayIcons(); // Initialiser les icônes du system tray
    updateDateTime();
    
    // Set up periodic updates
    setInterval(updateDateTime, 1000);
}

// ===== SYSTEM TRAY ICONS =====
function initializeTrayIcons() {
    // Contact icon in tray
    const trayContact = document.getElementById('trayContact');
    if (trayContact) {
        trayContact.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (typeof playClickSound === 'function') {
                playClickSound();
            }
            
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                openModal(modalId + '-modal');
            }
        });
        console.log('✅ Tray Contact initialisé');
    }
    
    // Radio icon already has onclick="openRadio()" in HTML
    const trayRadio = document.getElementById('trayRadio');
    if (trayRadio) {
        console.log('✅ Tray Radio initialisé');
    }
}

// ===== ABOUT POPUP ("Qui suis-je ?") =====
function initializeAboutPopup() {
    const aboutMenuItem = document.getElementById('aboutMenuItem');
    const aboutPopup = document.getElementById('aboutPopup');
    const aboutOverlay = document.getElementById('aboutOverlay');
    const aboutCloseBtn = document.getElementById('aboutCloseBtn');
    
    if (!aboutMenuItem || !aboutPopup || !aboutOverlay) {
        console.warn('⚠️ Éléments About popup introuvables');
        return;
    }
    
    // Ouvrir la popup au clic sur le menu
    aboutMenuItem.addEventListener('click', function(e) {
        e.stopPropagation();
        openAboutPopup();
        
        // Fermer le menu démarrer
        const startMenu = document.getElementById('startMenu');
        const startButton = document.getElementById('startButton');
        startMenu.classList.remove('show');
        startButton.classList.remove('active');
    });
    
    // Fermer via le bouton ×
    aboutCloseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeAboutPopup();
    });
    
    // Fermer au clic sur l'overlay (hors popup)
    aboutOverlay.addEventListener('click', function(e) {
        closeAboutPopup();
    });
    
    // Empêcher la propagation du clic sur la popup
    aboutPopup.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Fermer avec la touche Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && aboutPopup.classList.contains('show')) {
            closeAboutPopup();
        }
    });
    
    console.log('✅ About popup initialisée');
}

function openAboutPopup() {
    const aboutPopup = document.getElementById('aboutPopup');
    const aboutOverlay = document.getElementById('aboutOverlay');
    
    if (aboutPopup && aboutOverlay) {
        aboutOverlay.classList.add('show');
        aboutPopup.classList.add('show');
        
        // Play sound if available
        if (typeof playClickSound === 'function') {
            playClickSound();
        }
        
        console.log('🔓 About popup ouverte');
    }
}

function closeAboutPopup() {
    const aboutPopup = document.getElementById('aboutPopup');
    const aboutOverlay = document.getElementById('aboutOverlay');
    
    if (aboutPopup && aboutOverlay) {
        aboutPopup.classList.remove('show');
        aboutOverlay.classList.remove('show');
        
        console.log('🔒 About popup fermée');
    }
}

// Initialize click event on datetime to open calendar
function initializeDateTimeClick() {
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
        datetimeElement.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Play sound if function is available
            if (typeof playClickSound === 'function') {
                playClickSound();
            }
            
            console.log('🖱️ Ouverture calendrier depuis taskbar');
            createDynamicModal('calendar-modal', 'components/calendar/calendar-content.html', '📅 Calendrier', 420, 480);
        });
        
        console.log('✅ Event listener ajouté sur datetime pour calendrier');
    } else {
        console.warn('⚠️ Élément datetime introuvable');
    }
}

// Expose functions globally for cross-module access
window.openAboutPopup = openAboutPopup;
window.closeAboutPopup = closeAboutPopup;