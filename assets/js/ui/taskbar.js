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
        
        // Close start menu
        if (!startButton.contains(e.target)) {
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        }
        
        // Close context menu
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.remove('show');
        }
    });
}

function updateTaskbar() {
    const taskbarWindows = document.getElementById('taskbarWindows');
    taskbarWindows.innerHTML = '';
    
    minimizedWindows.forEach(window => {
        const button = document.createElement('div');
        button.className = 'taskbar-window';
        button.textContent = window.title;
        button.onclick = () => restoreWindow(window.id);
        taskbarWindows.appendChild(button);
    });
}

function restoreWindow(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        bringToFront(modal);
        
        // Remove from minimized windows
        minimizedWindows = minimizedWindows.filter(w => w.id !== modalId);
        updateTaskbar();
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