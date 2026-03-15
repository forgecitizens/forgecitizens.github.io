/**
 * ========================================================================
 * FOLDER NAVIGATION SYSTEM - Windows 98 Style File Explorer
 * ========================================================================
 * Provides folder navigation with breadcrumb trail, back/up buttons,
 * and a virtual file system structure.
 */

// Virtual file system structure
const fileSystem = {
    'Programmes': {
        type: 'folder',
        icon: '📁',
        children: {
            'Jeux': {
                type: 'folder',
                icon: 'img/jeux.png',
                children: {
                    'Mapper': {
                        type: 'file',
                        icon: '/assets/mapper-game/mapper_icon.png',
                        action: 'openMapper'
                    },
                    "Qualif'R": {
                        type: 'file',
                        icon: "/assets/qualif'R/letter-q.png",
                        action: 'openQualifR'
                    },
                    'Sophiscope': {
                        type: 'file',
                        icon: 'img/sophiscope.png',
                        action: 'openSophiscope'
                    }
                }
            },
            'Outils': {
                type: 'folder',
                icon: 'img/outils.png',
                children: {
                    'Drafter': {
                        type: 'file',
                        icon: 'img/typewriter.png',
                        action: 'openTypewriter'
                    },
                    'Indice Global d\'Instabilité': {
                        type: 'file',
                        icon: 'img/igi.png',
                        action: 'openIGI'
                    }
                }
            },
            'Galeries': {
                type: 'folder',
                icon: 'img/gallery.png',
                children: {
                    'Gallerie IA': {
                        type: 'file',
                        icon: 'img/gallery.png',
                        action: 'openIAGallery'
                    }
                }
            },
            'Essais': {
                type: 'folder',
                icon: 'img/document.png',
                children: {
                    'Comment une société devient cyberpunk (mars 2026)': {
                        type: 'file',
                        icon: 'img/pdf.png',
                        action: 'openPdfDocument',
                        url: '/articles/Comment une société devient cyberpunk_mars_2026.pdf',
                        title: 'Comment une société devient cyberpunk (mars 2026)'
                    }
                }
            }
        }
    }
};

// Navigation state
let currentPath = [];
let navigationHistory = [];
let historyIndex = -1;

/**
 * Initialize folder navigation system
 */
function initializeFolderNavigation() {
    console.log('📁 Initialisation du système de navigation...');
    
    // Note: Desktop icon click handlers are managed in modals.js initializeDesktopIcons()
    // to avoid duplicate event listeners
    
    console.log('✅ Système de navigation initialisé');
}

/**
 * Open the file explorer at a specific path
 */
function openFolderExplorer(path) {
    console.log('📂 Opening folder explorer at:', path);
    
    // Parse path to array
    currentPath = path ? path.split('/').filter(p => p) : [];
    
    // Reset navigation history
    navigationHistory = [currentPath.slice()];
    historyIndex = 0;
    
    // Open the modal
    openModal('file-explorer-modal');
    
    // Render the folder contents after modal is visible
    setTimeout(() => {
        renderFolderContents();
        updateBreadcrumb();
        updateNavigationButtons();
    }, 100);
}

/**
 * Navigate to a specific folder
 */
function navigateToFolder(folderName) {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    currentPath.push(folderName);
    
    // Add to history
    historyIndex++;
    navigationHistory = navigationHistory.slice(0, historyIndex);
    navigationHistory.push(currentPath.slice());
    
    renderFolderContents();
    updateBreadcrumb();
    updateNavigationButtons();
}

/**
 * Navigate to a specific path (from breadcrumb click)
 */
function navigateToPath(pathString) {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    currentPath = pathString ? pathString.split('/').filter(p => p) : [];
    
    // Add to history
    historyIndex++;
    navigationHistory = navigationHistory.slice(0, historyIndex);
    navigationHistory.push(currentPath.slice());
    
    renderFolderContents();
    updateBreadcrumb();
    updateNavigationButtons();
}

/**
 * Navigate back in history
 */
function navigateBack() {
    if (historyIndex <= 0) return;
    
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    historyIndex--;
    currentPath = navigationHistory[historyIndex].slice();
    
    renderFolderContents();
    updateBreadcrumb();
    updateNavigationButtons();
}

/**
 * Navigate to parent folder
 */
function navigateUp() {
    if (currentPath.length === 0) return;
    
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    currentPath.pop();
    
    // Add to history
    historyIndex++;
    navigationHistory = navigationHistory.slice(0, historyIndex);
    navigationHistory.push(currentPath.slice());
    
    renderFolderContents();
    updateBreadcrumb();
    updateNavigationButtons();
}

/**
 * Get folder contents at current path
 */
function getFolderContents() {
    let current = fileSystem;
    
    for (const folder of currentPath) {
        if (current[folder] && current[folder].children) {
            current = current[folder].children;
        } else {
            return {};
        }
    }
    
    return current;
}

/**
 * Get folder info at current path
 */
function getCurrentFolderInfo() {
    if (currentPath.length === 0) {
        return { name: 'Bureau', icon: '🖥️' };
    }
    
    let current = fileSystem;
    let info = { name: currentPath[currentPath.length - 1], icon: '📁' };
    
    for (const folder of currentPath) {
        if (current[folder]) {
            info = { name: folder, icon: current[folder].icon || '📁' };
            current = current[folder].children || {};
        }
    }
    
    return info;
}

/**
 * Render folder contents in the explorer
 */
function renderFolderContents() {
    const container = document.getElementById('file-explorer-content');
    const statusBar = document.getElementById('folder-item-count');
    const titleEl = document.getElementById('file-explorer-title');
    
    if (!container) return;
    
    const contents = getFolderContents();
    const folderInfo = getCurrentFolderInfo();
    const items = Object.keys(contents);
    
    // Update title
    if (titleEl) {
        titleEl.textContent = folderInfo.name;
    }
    
    // Update status bar
    if (statusBar) {
        const count = items.length;
        statusBar.textContent = count === 0 ? 'Dossier vide' : 
            count === 1 ? '1 élément' : `${count} éléments`;
    }
    
    // Render items
    if (items.length === 0) {
        container.innerHTML = `
            <div class="folder-empty-message">
                <div class="empty-icon">📂</div>
                <p>Ce dossier est vide</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="folder-grid">';
    
    for (const [name, item] of Object.entries(contents)) {
        const iconValue = item.icon || (item.type === 'folder' ? '📁' : '📄');
        const itemClass = item.type === 'folder' ? 'folder-item' : 'file-item';
        
        // Check if icon is an image path or an emoji
        const isImageIcon = iconValue.includes('/') || iconValue.endsWith('.png') || iconValue.endsWith('.jpg');
        const iconHtml = isImageIcon 
            ? `<img src="${iconValue}" alt="${name}" style="width: 32px; height: 32px; object-fit: contain;">`
            : iconValue;
        
        // For files, encode the item data as JSON attribute
        const itemDataAttr = item.type === 'file' 
            ? `data-file-info='${JSON.stringify(item).replace(/'/g, "&apos;")}'` 
            : '';
        
        // Escape single quotes in names to prevent breaking the JavaScript string
        const escapedName = name.replace(/'/g, "\\'");
        const escapedPath = `${currentPath.join('/')}/${name}`.replace(/'/g, "\\'");
        
        const onClick = item.type === 'folder' 
            ? `onclick="navigateToFolder('${escapedName}')"` 
            : `onclick="handleFileOpen(this, '${escapedPath}')"`;
        
        html += `
            <div class="${itemClass}" ${onClick} ${itemDataAttr} tabindex="0" role="button" aria-label="${name}">
                <div class="item-icon">${iconHtml}</div>
                <div class="item-label">${name}</div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add keyboard navigation
    container.querySelectorAll('.folder-item, .file-item').forEach(item => {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

/**
 * Update breadcrumb navigation
 */
function updateBreadcrumb() {
    const container = document.getElementById('breadcrumb-container');
    if (!container) return;
    
    let html = `<span class="breadcrumb-item breadcrumb-root" onclick="navigateToPath('')" role="button" tabindex="0">🖥️ Bureau</span>`;
    
    let pathSoFar = '';
    for (let i = 0; i < currentPath.length; i++) {
        const folder = currentPath[i];
        pathSoFar += (pathSoFar ? '/' : '') + folder;
        const isLast = i === currentPath.length - 1;
        
        html += `<span class="breadcrumb-separator">›</span>`;
        html += `<span class="breadcrumb-item ${isLast ? 'breadcrumb-current' : ''}" 
                       onclick="navigateToPath('${pathSoFar}')" 
                       role="button" 
                       tabindex="0">${folder}</span>`;
    }
    
    container.innerHTML = html;
    
    // Add keyboard navigation
    container.querySelectorAll('.breadcrumb-item').forEach(item => {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

/**
 * Update navigation buttons state
 */
function updateNavigationButtons() {
    const backBtn = document.getElementById('nav-back-btn');
    const upBtn = document.getElementById('nav-up-btn');
    
    if (backBtn) {
        backBtn.disabled = historyIndex <= 0;
    }
    
    if (upBtn) {
        upBtn.disabled = currentPath.length === 0;
    }
}

/**
 * Handle file open from click event - extracts file data and calls openFile
 */
function handleFileOpen(element, filePath) {
    let fileData = null;
    
    // Try to parse file data from data attribute
    const fileInfoAttr = element.getAttribute('data-file-info');
    if (fileInfoAttr) {
        try {
            fileData = JSON.parse(fileInfoAttr.replace(/&apos;/g, "'"));
        } catch (e) {
            console.warn('Could not parse file info:', e);
        }
    }
    
    openFile(filePath, fileData);
}

/**
 * Open a file - handles file actions based on file type
 */
function openFile(filePath, fileData) {
    console.log('📄 Opening file:', filePath, fileData);
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // Check if file has an action defined
    if (fileData && fileData.action) {
        const actionFn = window[fileData.action];
        if (typeof actionFn === 'function') {
            actionFn(fileData, filePath);
            return;
        } else {
            console.warn('Action function not found:', fileData.action);
        }
    }
    
    // Default behavior - show alert
    alert(`📄 Fichier: ${filePath}\n\nAucune action définie.`);
}

/**
 * Add a folder to the file system
 */
function addFolder(path, name, icon = '📁') {
    const pathParts = path.split('/').filter(p => p);
    let current = fileSystem;
    
    for (const folder of pathParts) {
        if (!current[folder]) {
            current[folder] = { type: 'folder', icon: '📁', children: {} };
        }
        current = current[folder].children;
    }
    
    current[name] = { type: 'folder', icon, children: {} };
}

/**
 * Add a file to the file system
 */
function addFile(path, name, icon = '📄', data = {}) {
    const pathParts = path.split('/').filter(p => p);
    let current = fileSystem;
    
    for (const folder of pathParts) {
        if (!current[folder]) {
            current[folder] = { type: 'folder', icon: '📁', children: {} };
        }
        current = current[folder].children;
    }
    
    current[name] = { type: 'file', icon, ...data };
}

/**
 * Open the Mapper game in a new page
 */
function openMapper() {
    console.log('🗺️ Opening Mapper game...');
    window.location.href = '/mapper/';
}

/**
 * Open the Qualif'R game in a new tab
 */
function openQualifR() {
    console.log("🎯 Opening Qualif'R game...");
    window.open("/qualif'R/", '_blank');
}

/**
 * Open the Sophiscope game in a new tab
 */
function openSophiscope() {
    console.log('🔬 Opening Sophiscope...');
    window.open('/sophiscope/', '_blank');
}

/**
 * Open the IGI modal
 */
function openIGI() {
    console.log('📊 Opening IGI...');
    if (typeof openModal === 'function') {
        openModal('igi-popup-modal');
    }
}

/**
 * Open the IA Gallery modal
 */
function openIAGallery() {
    console.log('🎨 Opening IA Gallery...');
    if (typeof openModal === 'function') {
        openModal('ia-gallery-modal');
    }
}

/**
 * Open a PDF document from file metadata
 */
function openPdfDocument(fileData) {
    if (!fileData || !fileData.url) {
        console.warn('PDF metadata missing:', fileData);
        return;
    }

    openPdfReader(fileData.url, fileData.title || 'Document PDF');
}

/**
 * Open the embedded PDF reader modal and load the selected document
 */
function openPdfReader(pdfPath, documentTitle = 'Document PDF') {
    const titleEl = document.getElementById('pdf-reader-title');
    const frameEl = document.getElementById('pdf-reader-frame');

    if (!titleEl || !frameEl) {
        // Fallback: open in a new tab if reader modal is unavailable
        window.open(encodeURI(pdfPath), '_blank');
        return;
    }

    titleEl.textContent = documentTitle;
    frameEl.src = encodeURI(pdfPath);

    if (typeof openModal === 'function') {
        openModal('pdf-reader-modal');
    }
}

/**
 * Close the PDF reader modal and unload the document
 */
function closePdfReader() {
    const frameEl = document.getElementById('pdf-reader-frame');
    if (frameEl) {
        frameEl.removeAttribute('src');
    }

    if (typeof closeModal === 'function') {
        closeModal('pdf-reader-modal');
    }
}

// ===== CONNECT.H AUTHENTICATION =====
const CONNECTH_AUTH_KEY = 'CONNECTH_AUTH';
const CONNECTH_AUTH_TS_KEY = 'CONNECTH_AUTH_TS';
const CONNECTH_PASSWORD = 'MICRO1990macro';
const CONNECTH_TTL_HOURS = 24 * 7; // 7 days

/**
 * Check if Connect.H is authenticated
 */
function isConnectHAuthenticated() {
    const auth = localStorage.getItem(CONNECTH_AUTH_KEY);
    const timestamp = localStorage.getItem(CONNECTH_AUTH_TS_KEY);
    
    if (auth !== '1') return false;
    
    if (timestamp) {
        const authTime = parseInt(timestamp, 10);
        const now = Date.now();
        const ttlMs = CONNECTH_TTL_HOURS * 60 * 60 * 1000;
        
        if (now - authTime > ttlMs) {
            localStorage.removeItem(CONNECTH_AUTH_KEY);
            localStorage.removeItem(CONNECTH_AUTH_TS_KEY);
            return false;
        }
    }
    
    return true;
}

/**
 * Open Connect.H authentication modal or redirect if already authenticated
 */
function openConnectHAuth() {
    console.log('🔐 Connect.H auth check...');
    
    // Play click sound if available
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    if (isConnectHAuthenticated()) {
        // Already authenticated, redirect directly
        console.log('✅ Connect.H already authenticated, redirecting...');
        window.location.href = '/connect-h/';
        return;
    }
    
    // Show password modal
    showConnectHModal();
}

/**
 * Show the Connect.H password modal
 */
function showConnectHModal() {
    const overlay = document.getElementById('connecthOverlay');
    const modal = document.getElementById('connecthPasswordModal');
    const input = document.getElementById('connecthPasswordInput');
    const errorEl = document.getElementById('connecthPasswordError');
    const form = document.getElementById('connecthPasswordForm');
    
    if (!overlay || !modal) {
        console.error('Connect.H modal elements not found');
        return;
    }
    
    // Clear previous state
    if (input) input.value = '';
    if (errorEl) errorEl.textContent = '';
    
    // Show modal
    overlay.classList.add('show');
    modal.classList.add('show');
    
    // Focus input
    setTimeout(() => {
        if (input) input.focus();
    }, 100);
    
    // Setup form handler (only once)
    if (!form.dataset.initialized) {
        form.dataset.initialized = 'true';
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleConnectHPasswordSubmit();
        });
        
        // ESC key to close
        document.addEventListener('keydown', function handleConnectHEsc(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeConnectHModal();
            }
        });
        
        // Click overlay to close
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeConnectHModal();
            }
        });
    }
}

/**
 * Handle password form submission
 */
function handleConnectHPasswordSubmit() {
    const input = document.getElementById('connecthPasswordInput');
    const errorEl = document.getElementById('connecthPasswordError');
    const modal = document.getElementById('connecthPasswordModal');
    
    const inputValue = input ? input.value : '';
    
    if (inputValue === CONNECTH_PASSWORD) {
        // Success - set auth and redirect
        localStorage.setItem(CONNECTH_AUTH_KEY, '1');
        localStorage.setItem(CONNECTH_AUTH_TS_KEY, Date.now().toString());
        
        console.log('✅ Connect.H password correct, redirecting...');
        closeConnectHModal();
        window.location.href = '/connect-h/';
    } else {
        // Error - show message and shake
        if (errorEl) {
            errorEl.textContent = 'Mot de passe incorrect.';
        }
        if (input) {
            input.value = '';
            input.focus();
        }
        
        // Shake animation
        if (modal) {
            modal.classList.add('shake');
            setTimeout(() => modal.classList.remove('shake'), 300);
        }
    }
}

/**
 * Close the Connect.H password modal
 */
function closeConnectHModal() {
    const overlay = document.getElementById('connecthOverlay');
    const modal = document.getElementById('connecthPasswordModal');
    
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
}

// Expose functions globally for cross-module access IMMEDIATELY
// This runs at script load time, before DOMContentLoaded
console.log('📁 FolderNavigation: Exposing functions to window...');
window.openFolderExplorer = openFolderExplorer;
window.navigateToFolder = navigateToFolder;
window.navigateToPath = navigateToPath;
window.navigateBack = navigateBack;
window.navigateUp = navigateUp;
window.addFolder = addFolder;
window.addFile = addFile;
window.handleFileOpen = handleFileOpen;
window.openFile = openFile;
window.openMapper = openMapper;
window.openQualifR = openQualifR;
window.openSophiscope = openSophiscope;
window.openIGI = openIGI;
window.openIAGallery = openIAGallery;
window.openPdfDocument = openPdfDocument;
window.openPdfReader = openPdfReader;
window.closePdfReader = closePdfReader;
window.openConnectHAuth = openConnectHAuth;
window.closeConnectHModal = closeConnectHModal;
console.log('✅ FolderNavigation: window.openFolderExplorer =', typeof window.openFolderExplorer);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeFolderNavigation);
