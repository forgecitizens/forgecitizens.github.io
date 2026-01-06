/**
 * ========================================================================
 * MACHINE À ÉCRIRE - Windows 98 Style Typewriter
 * ========================================================================
 * A retro text editor with typing sounds, backspace limitation,
 * and PDF export functionality.
 */

// Typewriter sounds
const typewriterSounds = {
    type: null,
    enter: null,
    space: null
};

// Sound preferences - stores selected sound files
let typewriterSoundPreferences = {
    type: 'sounds/typekey_1B.mp3',
    enter: 'sounds/enterkey.wav',
    space: 'sounds/spacebarkey5.mp3',
    backspace: 'sounds/typekey_1C.mp3'
};

// Available sounds for each category
const typewriterAvailableSounds = {
    type: [
        { file: 'sounds/typekey.wav', label: 'typekey.wav' },
        { file: 'sounds/typekey_1.wav', label: 'typekey_1.wav' },
        { file: 'sounds/typekey_1A.wav', label: 'typekey_1A.wav' },
        { file: 'sounds/typekey_1B.mp3', label: 'typekey_1B.mp3' }
    ],
    enter: [
        { file: 'sounds/enterkey.wav', label: 'enterkey.wav' },
        { file: 'sounds/enterkey_1.wav', label: 'enterkey_1.wav' }
    ],
    space: [
        { file: 'sounds/spacebarkey5.mp3', label: 'spacebarkey5.mp3' },
        { file: 'sounds/spacebarkey4.mp3', label: 'spacebarkey4.mp3' },
        { file: 'sounds/spacebarkey.mp3', label: 'spacebarkey.mp3' }
    ],
    backspace: [
        { file: 'sounds/typekey_1C.mp3', label: 'typekey_1C.mp3' },
        { file: 'sounds/typekey.wav', label: 'typekey.wav' }
    ]
};

// Backspace cooldown state
let lastBackspaceTime = 0;
const BACKSPACE_COOLDOWN = 3000; // 3 seconds

// Sound loading state
let typewriterSoundsLoaded = false;

// Current document name
let typewriterDocumentName = 'Sans titre';

/**
 * Load typewriter-specific sounds
 */
async function loadTypewriterSounds() {
    if (typewriterSoundsLoaded) return;
    
    try {
        const soundFiles = {
            type: typewriterSoundPreferences.type,
            enter: typewriterSoundPreferences.enter,
            space: typewriterSoundPreferences.space,
            backspace: typewriterSoundPreferences.backspace
        };

        for (const [key, file] of Object.entries(soundFiles)) {
            const audio = new Audio(file);
            audio.preload = 'auto';
            audio.volume = 0.5;
            typewriterSounds[key] = audio;
        }
        
        typewriterSoundsLoaded = true;
        console.log('⌨️ Typewriter sounds loaded');
    } catch (error) {
        console.warn('Could not load typewriter sounds:', error);
    }
}

/**
 * Reload typewriter sounds with new preferences
 */
function reloadTypewriterSounds() {
    try {
        const soundFiles = {
            type: typewriterSoundPreferences.type,
            enter: typewriterSoundPreferences.enter,
            space: typewriterSoundPreferences.space,
            backspace: typewriterSoundPreferences.backspace
        };

        for (const [key, file] of Object.entries(soundFiles)) {
            const audio = new Audio(file);
            audio.preload = 'auto';
            audio.volume = 0.5;
            typewriterSounds[key] = audio;
        }
        
        console.log('⌨️ Typewriter sounds reloaded with new preferences');
    } catch (error) {
        console.warn('Could not reload typewriter sounds:', error);
    }
}

/**
 * Play a typewriter sound
 */
function playTypewriterSound(type) {
    const sound = typewriterSounds[type];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {}); // Silently fail
    }
}

/**
 * Show the intro popup before opening typewriter
 */
function openTypewriter() {
    console.log('⌨️ Opening typewriter intro...');
    
    // Check if intro popup already exists
    let intro = document.getElementById('typewriter-intro');
    
    if (intro) {
        intro.classList.add('show');
        intro.style.display = 'flex';
        if (typeof bringToFront === 'function') {
            bringToFront(intro);
        }
        return;
    }
    
    // Create intro popup
    intro = document.createElement('div');
    intro.id = 'typewriter-intro';
    intro.className = 'window typewriter-intro-window';
    intro.setAttribute('role', 'dialog');
    intro.setAttribute('aria-modal', 'true');
    
    intro.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title">⌨️ Drafter</div>
            <div class="window-controls">
                <div class="window-button" onclick="closeModal('typewriter-intro')" aria-label="Fermer">×</div>
            </div>
        </div>
        <div class="window-content typewriter-intro-content">
            <div class="typewriter-intro-text">
                <p><strong>Drafter est inspiré de la Hemingwrite</strong>, une machine à écrire numérique pensée pour une seule chose : <em>écrire</em>.</p>
                
                <p>Son principe est volontairement radical : éliminer toute tentation de correction permanente afin de forcer l'écrivain à se concentrer sur le flux des idées plutôt que sur la forme immédiate. Ici, on avance. On ne revient pas sans raison.</p>
                
                <p>La limitation volontaire de l'effacement, l'espace d'écriture restreint et l'absence de distractions visuelles encouragent un état de <em>flow</em> continu, proche de celui d'une machine à écrire mécanique : chaque frappe compte, chaque phrase pousse la suivante.</p>
                
                <p>Cet outil n'est pas fait pour produire un texte parfait, mais pour faire émerger un <strong>texte vivant</strong>.</p>
                
                <p>La correction viendra plus tard. L'essentiel, ici, est d'écrire.</p>
            </div>
            <div class="typewriter-intro-name">
                <label for="typewriter-doc-name">Nom du document :</label>
                <input type="text" id="typewriter-doc-name" placeholder="Sans titre" maxlength="50" />
            </div>
            <div class="typewriter-intro-footer">
                <button class="typewriter-intro-btn typewriter-intro-btn-secondary" onclick="typewriterImportMAEFromIntro()">📂 Importer un fichier</button>
                <button class="typewriter-intro-btn" onclick="openTypewriterEditor()">Continuer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(intro);
    
    // Show popup
    intro.classList.add('show');
    intro.style.display = 'flex';
    
    // Apply sizing and position
    intro.style.width = '500px';
    intro.style.maxWidth = '90vw';
    intro.style.left = '50%';
    intro.style.top = '50%';
    intro.style.transform = 'translate(-50%, -50%)';
    
    // Initialize dragging
    if (typeof initializeSingleModalDragging === 'function') {
        initializeSingleModalDragging(intro);
    }
    
    // Bring to front
    if (typeof bringToFront === 'function') {
        bringToFront(intro);
    }
}

/**
 * Open the actual typewriter editor (called from intro popup)
 * Opens the fullscreen typewriter in a new tab
 */
function openTypewriterEditor() {
    console.log('⌨️ Opening typewriter fullscreen in new tab...');
    
    // Get document name from input
    const nameInput = document.getElementById('typewriter-doc-name');
    typewriterDocumentName = (nameInput && nameInput.value.trim()) || 'Sans titre';
    
    // Store data in sessionStorage to pass to the new tab
    const typewriterData = {
        title: typewriterDocumentName,
        content: ''
    };
    sessionStorage.setItem('typewriter-data', JSON.stringify(typewriterData));
    
    // Open fullscreen typewriter in new tab
    window.open('drafter.html', '_blank');
    
    // Close intro popup
    closeModal('typewriter-intro');
    
    console.log('✅ Typewriter fullscreen opened in new tab');
    return; // Don't execute the rest of the function
    
    // Load sounds on first open
    loadTypewriterSounds();
    
    // Create blur backdrop if it doesn't exist
    let backdrop = document.getElementById('typewriter-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'typewriter-backdrop';
        backdrop.className = 'typewriter-backdrop';
        document.body.appendChild(backdrop);
    }
    backdrop.classList.add('show');
    
    // Check if modal already exists
    let modal = document.getElementById('typewriter-modal');
    
    if (modal) {
        // Update title with new document name
        const titleEl = document.getElementById('typewriter-title');
        if (titleEl) {
            titleEl.textContent = `⌨️ ${typewriterDocumentName}`;
        }
        // Just show existing modal
        modal.classList.add('show');
        modal.style.display = 'flex';
        if (typeof bringToFront === 'function') {
            bringToFront(modal);
        }
        return;
    }
    
    // Create new modal
    modal = document.createElement('div');
    modal.id = 'typewriter-modal';
    modal.className = 'window typewriter-window typewriter-no-resize';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'typewriter-title');
    
    modal.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title" id="typewriter-title">⌨️ ${typewriterDocumentName}</div>
            <div class="window-controls">
                <div class="window-button" onclick="minimizeModal('typewriter-modal')" aria-label="Réduire">_</div>
                <div class="window-button" onclick="closeModal('typewriter-modal')" aria-label="Fermer">×</div>
            </div>
        </div>
        <div class="typewriter-toolbar">
            <button class="typewriter-btn" id="tw-bold" onclick="typewriterFormat('bold')" title="Gras (Ctrl+B)">
                <strong>G</strong>
            </button>
            <button class="typewriter-btn" id="tw-italic" onclick="typewriterFormat('italic')" title="Italique (Ctrl+I)">
                <em>I</em>
            </button>
            <button class="typewriter-btn" id="tw-underline" onclick="typewriterFormat('underline')" title="Souligné (Ctrl+U)">
                <u>S</u>
            </button>
            <div class="typewriter-separator"></div>
            <button class="typewriter-btn typewriter-btn-file" onclick="typewriterImportMAE()" title="Ouvrir un fichier (.mae)">
                📂 Ouvrir
            </button>
            <button class="typewriter-btn typewriter-btn-file" onclick="typewriterExportMAE()" title="Enregistrer (.mae)">
                💾 Sauver
            </button>
            <div class="typewriter-separator"></div>
            <button class="typewriter-btn typewriter-btn-action" onclick="typewriterExportPDF()" title="Exporter en PDF">
                📄 PDF
            </button>
            <div class="typewriter-separator"></div>
            <button class="typewriter-btn typewriter-btn-action" onclick="openTypewriterSoundOptions()" title="Options sonores">
                🔊 Sons
            </button>
        </div>
        <div class="window-content typewriter-content">
            <div class="typewriter-viewport" id="typewriter-viewport">
                <div class="typewriter-editor" 
                     id="typewriter-editor" 
                     contenteditable="true" 
                     role="textbox" 
                     aria-multiline="true"
                     aria-label="Zone d'édition"
                     spellcheck="true"></div>
                <div class="typewriter-blur-overlay" id="typewriter-blur-overlay">
                    <div class="typewriter-blur-top"></div>
                    <div class="typewriter-clear-zone"></div>
                    <div class="typewriter-blur-bottom"></div>
                </div>
            </div>
        </div>
        <div class="typewriter-status">
            <span id="typewriter-backspace-status"></span>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize the editor
    initializeTypewriterEditor();
    
    // Show modal
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Apply FIXED sizing - no resize allowed
    modal.style.width = '600px';
    modal.style.height = '450px';
    modal.style.minWidth = '600px';
    modal.style.maxWidth = '600px';
    modal.style.minHeight = '450px';
    modal.style.maxHeight = '450px';
    modal.style.left = '100px';
    modal.style.top = '50px';
    
    // Initialize dragging
    if (typeof initializeSingleModalDragging === 'function') {
        initializeSingleModalDragging(modal);
    }
    
    // Bring to front
    if (typeof bringToFront === 'function') {
        bringToFront(modal);
    }
    
    // Focus editor
    setTimeout(() => {
        const editor = document.getElementById('typewriter-editor');
        if (editor) editor.focus();
    }, 100);
    
    console.log('✅ Typewriter opened');
}

/**
 * Initialize the typewriter editor with event handlers
 */
function initializeTypewriterEditor() {
    const editor = document.getElementById('typewriter-editor');
    if (!editor) return;
    
    // Keyboard handler for sounds and backspace limitation
    editor.addEventListener('keydown', handleTypewriterKeydown);
    
    // Update toolbar button states on selection change
    document.addEventListener('selectionchange', updateTypewriterToolbarState);
    
    // Track cursor position for blur viewport
    editor.addEventListener('keyup', updateBlurViewport);
    editor.addEventListener('click', updateBlurViewport);
    editor.addEventListener('focus', updateBlurViewport);
    editor.addEventListener('scroll', updateBlurViewport);
    
    // Initial blur viewport update
    setTimeout(updateBlurViewport, 100);
    
    // Handle paste - strip formatting for plain text experience
    editor.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });
}

/**
 * Handle keydown in the typewriter editor
 */
function handleTypewriterKeydown(e) {
    const editor = document.getElementById('typewriter-editor');
    if (!editor || document.activeElement !== editor) return;
    
    // Handle Backspace limitation
    if (e.key === 'Backspace' || e.key === 'Delete') {
        const now = Date.now();
        const timeSinceLastBackspace = now - lastBackspaceTime;
        
        if (timeSinceLastBackspace < BACKSPACE_COOLDOWN) {
            e.preventDefault();
            
            // Show cooldown feedback
            const remaining = Math.ceil((BACKSPACE_COOLDOWN - timeSinceLastBackspace) / 1000);
            showBackspaceBlocked(remaining);
            
            // Subtle shake effect
            editor.classList.add('typewriter-shake');
            setTimeout(() => editor.classList.remove('typewriter-shake'), 200);
            
            return;
        }
        
        lastBackspaceTime = now;
        updateBackspaceStatus();
        playTypewriterSound('backspace');
        return; // Allow the backspace
    }
    
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                typewriterFormat('bold');
                return;
            case 'i':
                e.preventDefault();
                typewriterFormat('italic');
                return;
            case 'u':
                e.preventDefault();
                typewriterFormat('underline');
                return;
        }
    }
    
    // Play sounds for typing
    if (e.key === 'Enter') {
        playTypewriterSound('enter');
        // Update blur viewport after Enter (new line)
        setTimeout(updateBlurViewport, 10);
    } else if (e.key === ' ') {
        playTypewriterSound('space');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Regular character key
        playTypewriterSound('type');
    }
    
    // Ensure cursor visibility and blur viewport update after navigation keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
        setTimeout(() => {
            scrollToCaret(editor);
            updateBlurViewport();
        }, 10);
    }
}

/**
 * Show backspace blocked message
 */
function showBackspaceBlocked(secondsRemaining) {
    const status = document.getElementById('typewriter-backspace-status');
    if (status) {
        status.textContent = `⏳ Retour arrière bloqué (${secondsRemaining}s)`;
        status.classList.add('typewriter-status-warning');
        
        setTimeout(() => {
            status.classList.remove('typewriter-status-warning');
            updateBackspaceStatus();
        }, 1000);
    }
}

/**
 * Update backspace status indicator
 */
function updateBackspaceStatus() {
    const status = document.getElementById('typewriter-backspace-status');
    if (!status) return;
    
    const now = Date.now();
    const timeSinceLastBackspace = now - lastBackspaceTime;
    
    if (timeSinceLastBackspace < BACKSPACE_COOLDOWN) {
        const remaining = Math.ceil((BACKSPACE_COOLDOWN - timeSinceLastBackspace) / 1000);
        status.textContent = `⏳ Prochain retour: ${remaining}s`;
    } else {
        status.textContent = '✓ Retour arrière disponible';
    }
}

/**
 * Scroll the editor to keep the caret visible
 */
function scrollToCaret(editor) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Create a temporary span at caret position
    const marker = document.createElement('span');
    marker.style.display = 'inline';
    range.insertNode(marker);
    
    // Scroll marker into view
    marker.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    
    // Remove marker and restore selection
    const parent = marker.parentNode;
    parent.removeChild(marker);
    parent.normalize();
    
    // Restore selection
    selection.removeAllRanges();
    selection.addRange(range);
}

// Line height constant for blur viewport calculations
const TYPEWRITER_LINE_HEIGHT = 22.4; // 14px font * 1.6 line-height
const VISIBLE_LINES_EACH_SIDE = 4; // 4 lines above, 4 lines below cursor

/**
 * Update the blur viewport position based on cursor location
 * Creates a "focus zone" of 8 lines around the cursor, blurs everything else
 */
function updateBlurViewport() {
    const editor = document.getElementById('typewriter-editor');
    const viewport = document.getElementById('typewriter-viewport');
    const blurTop = document.querySelector('.typewriter-blur-top');
    const blurBottom = document.querySelector('.typewriter-blur-bottom');
    const clearZone = document.querySelector('.typewriter-clear-zone');
    
    if (!editor || !viewport || !blurTop || !blurBottom || !clearZone) return;
    
    // Get caret position relative to editor
    const caretY = getCaretYPosition(editor);
    const editorRect = editor.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    
    // Calculate the visible zone height (8 lines total)
    const visibleZoneHeight = VISIBLE_LINES_EACH_SIDE * 2 * TYPEWRITER_LINE_HEIGHT;
    
    // Calculate cursor position relative to viewport (accounting for scroll)
    const scrollTop = editor.scrollTop;
    const caretRelativeToViewport = caretY - scrollTop;
    
    // Calculate blur zone positions
    // The clear zone should be centered on the cursor
    const clearZoneTop = caretRelativeToViewport - (VISIBLE_LINES_EACH_SIDE * TYPEWRITER_LINE_HEIGHT);
    const clearZoneBottom = caretRelativeToViewport + (VISIBLE_LINES_EACH_SIDE * TYPEWRITER_LINE_HEIGHT);
    
    // Clamp values to viewport bounds
    const viewportHeight = viewport.clientHeight;
    
    // Top blur: from 0 to where clear zone starts
    const topBlurHeight = Math.max(0, clearZoneTop);
    
    // Bottom blur: from where clear zone ends to viewport bottom
    const bottomBlurTop = Math.min(viewportHeight, clearZoneBottom);
    const bottomBlurHeight = Math.max(0, viewportHeight - bottomBlurTop);
    
    // Apply blur zone sizes
    blurTop.style.height = `${topBlurHeight}px`;
    clearZone.style.height = `${visibleZoneHeight}px`;
    blurBottom.style.height = `${bottomBlurHeight}px`;
    
    // Position the clear zone
    clearZone.style.top = `${topBlurHeight}px`;
    blurBottom.style.top = `${bottomBlurTop}px`;
}

/**
 * Get the Y position of the caret within the editor
 */
function getCaretYPosition(editor) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        // Default to top if no selection
        return TYPEWRITER_LINE_HEIGHT;
    }
    
    const range = selection.getRangeAt(0);
    
    // Clone range and collapse to cursor position
    const clonedRange = range.cloneRange();
    clonedRange.collapse(true);
    
    // Create temporary marker to get position
    const marker = document.createElement('span');
    marker.style.display = 'inline';
    marker.textContent = '\u200B'; // Zero-width space
    
    try {
        clonedRange.insertNode(marker);
        
        const markerRect = marker.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        
        // Calculate position relative to editor content (including scroll)
        const caretY = (markerRect.top - editorRect.top) + editor.scrollTop + (TYPEWRITER_LINE_HEIGHT / 2);
        
        // Clean up marker
        marker.parentNode.removeChild(marker);
        
        return caretY;
    } catch (e) {
        // Fallback if insertion fails
        if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
        }
        return TYPEWRITER_LINE_HEIGHT;
    }
}

/**
 * Apply formatting to selected text
 */
function typewriterFormat(command) {
    const editor = document.getElementById('typewriter-editor');
    if (!editor) return;
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // Focus editor if not focused
    editor.focus();
    
    // Apply formatting
    document.execCommand(command, false, null);
    
    // Update toolbar state
    updateTypewriterToolbarState();
}

/**
 * Update toolbar button active states
 */
function updateTypewriterToolbarState() {
    const editor = document.getElementById('typewriter-editor');
    if (!editor || !document.activeElement || !editor.contains(document.activeElement)) {
        // Only update if editor has focus
        if (document.activeElement !== editor) return;
    }
    
    // Check current formatting state
    const boldBtn = document.getElementById('tw-bold');
    const italicBtn = document.getElementById('tw-italic');
    const underlineBtn = document.getElementById('tw-underline');
    
    if (boldBtn) {
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
    }
    if (italicBtn) {
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
    }
    if (underlineBtn) {
        underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
    }
}

/**
 * Export editor content to PDF with proper formatting
 */
async function typewriterExportPDF() {
    const editor = document.getElementById('typewriter-editor');
    if (!editor) return;
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    const content = editor.innerHTML;
    
    if (!content.trim()) {
        alert('Le document est vide.');
        return;
    }
    
    // Check if jsPDF is available, if not load it
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        await loadJsPDF();
    }
    
    try {
        const { jsPDF } = window.jspdf || { jsPDF: window.jsPDF };
        
        if (!jsPDF) {
            console.error('jsPDF not available');
            alert('Erreur: Impossible de charger la bibliothèque PDF.');
            return;
        }
        
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // A4 dimensions: 210mm x 297mm
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const usableWidth = pageWidth - (margin * 2); // 170mm
        const lineHeight = 5.5; // mm per line
        const paragraphSpacing = 3; // extra space between paragraphs
        let currentY = margin;
        
        // Set default font
        doc.setFontSize(11);
        
        // Parse HTML and extract formatted segments
        const segments = parseHTMLForPDF(editor);
        
        for (const segment of segments) {
            // Handle paragraph breaks
            if (segment.type === 'paragraph-break') {
                currentY += paragraphSpacing;
                continue;
            }
            
            // Handle line breaks
            if (segment.type === 'line-break') {
                currentY += lineHeight;
                continue;
            }
            
            // Check if we need a new page
            if (currentY + lineHeight > pageHeight - margin) {
                doc.addPage();
                currentY = margin;
            }
            
            // Apply font style
            let fontStyle = 'normal';
            if (segment.bold && segment.italic) {
                fontStyle = 'bolditalic';
            } else if (segment.bold) {
                fontStyle = 'bold';
            } else if (segment.italic) {
                fontStyle = 'italic';
            }
            doc.setFont('courier', fontStyle);
            
            // Handle indentation
            const indentMm = (segment.indent || 0) * 5; // 5mm per indent level
            const effectiveMargin = margin + indentMm;
            const effectiveWidth = usableWidth - indentMm;
            
            // Word wrap the text
            const wrappedLines = wrapTextForPDF(segment.text, effectiveWidth, doc);
            
            for (const line of wrappedLines) {
                // Check for new page
                if (currentY + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    currentY = margin;
                }
                
                // Draw text
                doc.text(line, effectiveMargin, currentY);
                
                // Draw underline if needed
                if (segment.underline && line.trim()) {
                    const textWidth = doc.getTextWidth(line);
                    doc.setLineWidth(0.3);
                    doc.line(effectiveMargin, currentY + 1, effectiveMargin + textWidth, currentY + 1);
                }
                
                currentY += lineHeight;
            }
        }
        
        doc.save('machine-a-ecrire.pdf');
        console.log('✅ PDF exported');
        
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Erreur lors de l\'export. Veuillez réessayer.');
    }
}

/**
 * Parse HTML content and extract formatted text segments
 */
function parseHTMLForPDF(editor) {
    const segments = [];
    
    // Get the HTML content and normalize it
    const html = editor.innerHTML;
    
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Walk through all nodes
    function walkNodes(node, formatting = { bold: false, italic: false, underline: false, indent: 0 }) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text) {
                segments.push({
                    type: 'text',
                    text: text,
                    bold: formatting.bold,
                    italic: formatting.italic,
                    underline: formatting.underline,
                    indent: formatting.indent
                });
            }
            return;
        }
        
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        
        const tagName = node.tagName.toLowerCase();
        
        // Handle block elements that create line breaks
        if (['div', 'p', 'br'].includes(tagName)) {
            if (tagName === 'br') {
                segments.push({ type: 'line-break' });
            } else if (tagName === 'p') {
                segments.push({ type: 'paragraph-break' });
            } else if (tagName === 'div' && segments.length > 0) {
                // Divs in contenteditable create new lines
                const lastSegment = segments[segments.length - 1];
                if (lastSegment.type !== 'line-break' && lastSegment.type !== 'paragraph-break') {
                    segments.push({ type: 'line-break' });
                }
            }
        }
        
        // Update formatting based on tag
        const newFormatting = { ...formatting };
        
        if (['b', 'strong'].includes(tagName)) {
            newFormatting.bold = true;
        }
        if (['i', 'em'].includes(tagName)) {
            newFormatting.italic = true;
        }
        if (['u'].includes(tagName)) {
            newFormatting.underline = true;
        }
        if (['blockquote'].includes(tagName)) {
            newFormatting.indent = formatting.indent + 1;
        }
        
        // Check for inline styles
        if (node.style) {
            if (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight) >= 700) {
                newFormatting.bold = true;
            }
            if (node.style.fontStyle === 'italic') {
                newFormatting.italic = true;
            }
            if (node.style.textDecoration && node.style.textDecoration.includes('underline')) {
                newFormatting.underline = true;
            }
        }
        
        // Process children
        for (const child of node.childNodes) {
            walkNodes(child, newFormatting);
        }
        
        // Add line break after block elements
        if (['div', 'p'].includes(tagName) && node.childNodes.length > 0) {
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && lastSegment.type !== 'line-break' && lastSegment.type !== 'paragraph-break') {
                segments.push({ type: 'line-break' });
            }
        }
    }
    
    walkNodes(tempDiv);
    
    // Consolidate consecutive text segments with same formatting
    const consolidated = [];
    for (const segment of segments) {
        if (segment.type !== 'text') {
            consolidated.push(segment);
            continue;
        }
        
        const last = consolidated[consolidated.length - 1];
        if (last && last.type === 'text' && 
            last.bold === segment.bold && 
            last.italic === segment.italic && 
            last.underline === segment.underline &&
            last.indent === segment.indent) {
            last.text += segment.text;
        } else {
            consolidated.push(segment);
        }
    }
    
    return consolidated;
}

/**
 * Word wrap text to fit within a given width
 */
function wrapTextForPDF(text, maxWidthMm, doc) {
    if (!text || !text.trim()) {
        return [''];
    }
    
    const lines = [];
    
    // Handle text that may contain leading spaces (indentation)
    const leadingSpaces = text.match(/^(\s*)/)[1];
    const trimmedText = text.trimStart();
    
    // Split into words
    const words = trimmedText.split(/\s+/);
    let currentLine = leadingSpaces;
    
    for (const word of words) {
        const testLine = currentLine + (currentLine.trim() ? ' ' : '') + word;
        const testWidth = doc.getTextWidth(testLine);
        
        if (testWidth > maxWidthMm && currentLine.trim()) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
}

/**
 * Export editor content to a .mae file (Machine À Écrire format)
 * This is a JSON file containing the HTML content and metadata
 */
function typewriterExportMAE() {
    const editor = document.getElementById('typewriter-editor');
    if (!editor) return;
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    const content = editor.innerHTML;
    
    if (!content.trim() || content === '<br>') {
        alert('Le document est vide.');
        return;
    }
    
    // Create export object with metadata
    const exportData = {
        version: '1.0',
        type: 'machine-a-ecrire',
        title: typewriterDocumentName,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        content: content,
        plainText: editor.innerText || editor.textContent
    };
    
    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create safe filename from document name
    const safeFileName = typewriterDocumentName
        .toLowerCase()
        .replace(/[^a-z0-9àâäéèêëïîôùûüç\s-]/gi, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) || 'document';
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}-${formatDateForFilename()}.mae`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ MAE file exported:', link.download);
}

/**
 * Import a .mae file into the editor
 */
function typewriterImportMAE() {
    const editor = document.getElementById('typewriter-editor');
    if (!editor) return;
    
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // Check if editor has content
    const currentContent = editor.innerHTML.trim();
    if (currentContent && currentContent !== '<br>' && currentContent !== '') {
        if (!confirm('Le document actuel sera remplacé. Continuer ?')) {
            return;
        }
    }
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mae,.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate file format
            if (!data.type || data.type !== 'machine-a-ecrire') {
                alert('Format de fichier invalide. Veuillez sélectionner un fichier .mae valide.');
                return;
            }
            
            if (!data.content) {
                alert('Le fichier ne contient pas de contenu.');
                return;
            }
            
            // Import content
            editor.innerHTML = data.content;
            
            // Update document name
            if (data.title) {
                typewriterDocumentName = data.title;
                const titleEl = document.getElementById('typewriter-title');
                if (titleEl) {
                    titleEl.textContent = `⌨️ ${typewriterDocumentName}`;
                }
            }
            
            // Reset backspace cooldown
            lastBackspaceTime = 0;
            updateBackspaceStatus();
            
            // Update blur viewport
            setTimeout(updateBlurViewport, 100);
            
            // Focus editor
            editor.focus();
            
            console.log('✅ MAE file imported:', file.name);
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Erreur lors de l\'import. Vérifiez que le fichier est valide.');
        }
    };
    
    input.click();
}

/**
 * Format current date for filename
 */
function formatDateForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}`;
}

/**
 * Load jsPDF library dynamically
 */
function loadJsPDF() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.jspdf || window.jsPDF) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            console.log('📄 jsPDF loaded');
            
            // Also load html2canvas for HTML rendering
            const html2canvasScript = document.createElement('script');
            html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            html2canvasScript.onload = resolve;
            html2canvasScript.onerror = resolve; // Continue even if html2canvas fails
            document.head.appendChild(html2canvasScript);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Fallback PDF export using basic jsPDF text
 */
function fallbackPDFExport(text) {
    try {
        const { jsPDF } = window.jspdf || { jsPDF: window.jsPDF };
        const doc = new jsPDF();
        
        // Split text into lines that fit the page
        const lines = doc.splitTextToSize(text, 180);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(lines, 15, 20);
        
        doc.save('machine-a-ecrire.pdf');
    } catch (error) {
        console.error('Fallback PDF export failed:', error);
        alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
}

/**
 * Open the sound options popup
 */
function openTypewriterSoundOptions() {
    console.log('🔊 Opening sound options...');
    
    // Check if popup already exists
    let popup = document.getElementById('typewriter-sound-options');
    
    if (popup) {
        popup.classList.add('show');
        popup.style.display = 'flex';
        if (typeof bringToFront === 'function') {
            bringToFront(popup);
        }
        return;
    }
    
    // Build the sound options HTML
    const buildSoundCategory = (categoryKey, categoryLabel, sounds) => {
        const soundItems = sounds.map(sound => {
            const isChecked = typewriterSoundPreferences[categoryKey] === sound.file ? 'checked' : '';
            return `
                <label class="typewriter-sound-option">
                    <input type="radio" name="sound-${categoryKey}" value="${sound.file}" ${isChecked} />
                    <span class="typewriter-sound-label">${sound.label}</span>
                    <button class="typewriter-sound-preview" onclick="previewTypewriterSound('${sound.file}')" title="Écouter">▶</button>
                </label>
            `;
        }).join('');
        
        return `
            <div class="typewriter-sound-category">
                <div class="typewriter-sound-category-title">${categoryLabel}</div>
                ${soundItems}
            </div>
        `;
    };
    
    // Create popup
    popup = document.createElement('div');
    popup.id = 'typewriter-sound-options';
    popup.className = 'window typewriter-sound-options-window';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    
    popup.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title">🔊 Options sonores</div>
            <div class="window-controls">
                <div class="window-button" onclick="closeTypewriterSoundOptions()" aria-label="Fermer">×</div>
            </div>
        </div>
        <div class="window-content typewriter-sound-options-content">
            <div class="typewriter-sound-options-intro">
                <p>Sélectionnez les effets sonores pour chaque type de touche :</p>
            </div>
            ${buildSoundCategory('type', 'Boutons principaux', typewriterAvailableSounds.type)}
            ${buildSoundCategory('enter', 'Bouton "Entrée"', typewriterAvailableSounds.enter)}
            ${buildSoundCategory('space', 'Bouton "Espace"', typewriterAvailableSounds.space)}
            <div class="typewriter-sound-options-footer">
                <button class="typewriter-sound-accept-btn" onclick="acceptTypewriterSoundOptions()">Accepter</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Show popup
    popup.classList.add('show');
    popup.style.display = 'flex';
    
    // Apply sizing and position
    popup.style.width = '320px';
    popup.style.maxWidth = '90vw';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    
    // Initialize dragging
    if (typeof initializeSingleModalDragging === 'function') {
        initializeSingleModalDragging(popup);
    }
    
    // Bring to front
    if (typeof bringToFront === 'function') {
        bringToFront(popup);
    }
}

/**
 * Preview a sound
 */
function previewTypewriterSound(soundFile) {
    const audio = new Audio(soundFile);
    audio.volume = 0.5;
    audio.play().catch(() => {});
}

/**
 * Accept sound options and apply changes
 */
function acceptTypewriterSoundOptions() {
    // Get selected values from radio buttons
    const typeSound = document.querySelector('input[name="sound-type"]:checked');
    const enterSound = document.querySelector('input[name="sound-enter"]:checked');
    const spaceSound = document.querySelector('input[name="sound-space"]:checked');
    
    if (typeSound) {
        typewriterSoundPreferences.type = typeSound.value;
    }
    if (enterSound) {
        typewriterSoundPreferences.enter = enterSound.value;
    }
    if (spaceSound) {
        typewriterSoundPreferences.space = spaceSound.value;
    }
    
    // Reload sounds with new preferences
    reloadTypewriterSounds();
    
    // Close the popup
    closeTypewriterSoundOptions();
    
    console.log('🔊 Sound preferences updated:', typewriterSoundPreferences);
}

/**
 * Close the sound options popup
 */
function closeTypewriterSoundOptions() {
    const popup = document.getElementById('typewriter-sound-options');
    if (popup) {
        popup.classList.remove('show');
        popup.style.display = 'none';
    }
}

/**
 * Import a .mae file from the intro popup
 * Opens the editor first, then triggers the import
 */
function typewriterImportMAEFromIntro() {
    // Play click sound
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mae,.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate file format
            if (!data.type || data.type !== 'machine-a-ecrire') {
                alert('Format de fichier invalide. Veuillez sélectionner un fichier .mae valide.');
                return;
            }
            
            if (!data.content) {
                alert('Le fichier ne contient pas de contenu.');
                return;
            }
            
            // Set the document name from the file
            if (data.title) {
                typewriterDocumentName = data.title;
                const nameInput = document.getElementById('typewriter-doc-name');
                if (nameInput) {
                    nameInput.value = data.title;
                }
            }
            
            // Store data in sessionStorage to pass to the new tab
            const typewriterData = {
                title: data.title || 'Sans titre',
                content: data.content,
                previousSession: data.previousSession || null
            };
            sessionStorage.setItem('typewriter-data', JSON.stringify(typewriterData));
            
            // Open fullscreen typewriter in new tab
            window.open('drafter.html', '_blank');
            
            // Close intro popup
            closeModal('typewriter-intro');
            
            console.log('✅ MAE file imported and opened in fullscreen:', file.name);
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Erreur lors de l\'import. Vérifiez que le fichier est valide.');
        }
    };
    
    input.click();
}

/**
 * Open the typewriter editor with pre-loaded content
 */
function openTypewriterEditorWithContent(content, title) {
    console.log('⌨️ Opening typewriter editor with imported content...');
    
    // Set document name
    typewriterDocumentName = title || 'Sans titre';
    
    // Close intro popup
    closeModal('typewriter-intro');
    
    // Load sounds on first open
    loadTypewriterSounds();
    
    // Create blur backdrop if it doesn't exist
    let backdrop = document.getElementById('typewriter-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'typewriter-backdrop';
        backdrop.className = 'typewriter-backdrop';
        document.body.appendChild(backdrop);
    }
    backdrop.classList.add('show');
    
    // Check if modal already exists
    let modal = document.getElementById('typewriter-modal');
    
    if (modal) {
        // Update title with new document name
        const titleEl = document.getElementById('typewriter-title');
        if (titleEl) {
            titleEl.textContent = `⌨️ ${typewriterDocumentName}`;
        }
        // Set the content
        const editor = document.getElementById('typewriter-editor');
        if (editor) {
            editor.innerHTML = content;
        }
        // Just show existing modal
        modal.classList.add('show');
        modal.style.display = 'flex';
        if (typeof bringToFront === 'function') {
            bringToFront(modal);
        }
        // Update blur viewport
        setTimeout(updateBlurViewport, 100);
        return;
    }
    
    // Use the normal editor open function first
    openTypewriterEditor();
    
    // Then set the content after a short delay
    setTimeout(() => {
        const editor = document.getElementById('typewriter-editor');
        if (editor) {
            editor.innerHTML = content;
            // Reset backspace cooldown
            lastBackspaceTime = 0;
            updateBackspaceStatus();
            // Update blur viewport
            updateBlurViewport();
        }
    }, 150);
}

// Expose functions globally
window.openTypewriter = openTypewriter;
window.openTypewriterEditor = openTypewriterEditor;
window.typewriterFormat = typewriterFormat;
window.typewriterExportPDF = typewriterExportPDF;
window.typewriterExportMAE = typewriterExportMAE;
window.typewriterImportMAE = typewriterImportMAE;
window.openTypewriterSoundOptions = openTypewriterSoundOptions;
window.previewTypewriterSound = previewTypewriterSound;
window.acceptTypewriterSoundOptions = acceptTypewriterSoundOptions;
window.closeTypewriterSoundOptions = closeTypewriterSoundOptions;
window.typewriterImportMAEFromIntro = typewriterImportMAEFromIntro;

console.log('⌨️ Typewriter module loaded');
