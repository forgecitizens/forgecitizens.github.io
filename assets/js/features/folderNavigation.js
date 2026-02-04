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
                icon: '🎮',
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
                    }
                }
            },
            'Outils': {
                type: 'folder',
                icon: '🛠️',
                children: {
                    'Drafter': {
                        type: 'file',
                        icon: 'img/typewriter.png',
                        action: 'openTypewriter'
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
            actionFn();
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
console.log('✅ FolderNavigation: window.openFolderExplorer =', typeof window.openFolderExplorer);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeFolderNavigation);
