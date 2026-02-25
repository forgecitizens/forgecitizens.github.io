/**
 * ========================================================================
 * CONNECT.H - MISSION CORE ENGINE
 * ========================================================================
 * Game engine for the Connect.H scientific narrative game.
 * Handles event scheduling, state management, and UI rendering.
 */

(function() {
    'use strict';

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    const CONFIG = {
        LATENCY_MS: 30000,           // 30 seconds simulated latency
        TICK_INTERVAL_MS: 100,        // Process events every 100ms
        SIGNAL_BASE: 0.78,           // Base signal quality (78%)
        SOUNDS_PATH: '/assets/connect.H/sounds/',
        IMAGES_PATH: '/assets/connect.H/img/signal_img/',
        
        // Audio settings
        CONTROL_ROOM_VOLUME: 0.4,    // 40% volume for ambient
        TRANSMISSION_VOLUME: 0.7     // 70% volume for transmission alert
    };

    // ========================================================================
    // AUDIO SYSTEM
    // ========================================================================
    
    const audio = {
        controlRoom: null,
        transmission: null,
        transmissionPlaying: false  // Flag to prevent overlapping
    };

    /**
     * Initialize audio objects
     */
    function initAudio() {
        // Control room ambient (looped)
        audio.controlRoom = new Audio(CONFIG.SOUNDS_PATH + 'connecth_control_room.mp3');
        audio.controlRoom.loop = true;
        audio.controlRoom.volume = CONFIG.CONTROL_ROOM_VOLUME;

        // Transmission incoming sound (single play)
        audio.transmission = new Audio(CONFIG.SOUNDS_PATH + 'connecth_incoming_transmission.mp3');
        audio.transmission.volume = CONFIG.TRANSMISSION_VOLUME;
        
        // Reset flag when transmission sound ends
        audio.transmission.addEventListener('ended', () => {
            audio.transmissionPlaying = false;
        });

        console.log('🔊 Mission audio initialized');
    }

    /**
     * Start control room ambient music
     */
    function startControlRoomAudio() {
        if (!audio.controlRoom) return;

        const playPromise = audio.controlRoom.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('🎵 Control room ambient started');
            }).catch(error => {
                console.log('🔇 Autoplay blocked, waiting for user interaction...');
                // Start on first click
                document.addEventListener('click', function startOnClick() {
                    audio.controlRoom.play().catch(e => console.log('Audio failed:', e));
                    document.removeEventListener('click', startOnClick);
                }, { once: true });
            });
        }
    }

    /**
     * Play transmission incoming sound (prevents overlapping)
     */
    function playTransmissionSound() {
        if (!audio.transmission) return;
        
        // Prevent overlapping - only play if not already playing
        if (audio.transmissionPlaying) {
            console.log('🔔 Transmission sound already playing, skipping');
            return;
        }

        audio.transmissionPlaying = true;
        audio.transmission.currentTime = 0;
        audio.transmission.play().catch(e => {
            console.log('Transmission sound failed:', e);
            audio.transmissionPlaying = false;
        });
    }

    /**
     * Stop all mission audio
     */
    function stopAllAudio() {
        if (audio.controlRoom) {
            audio.controlRoom.pause();
            audio.controlRoom.currentTime = 0;
        }
        if (audio.transmission) {
            audio.transmission.pause();
            audio.transmission.currentTime = 0;
            audio.transmissionPlaying = false;
        }
    }

    /**
     * Safely play a sound without crashing if file is missing
     * @param {string} filename - Name of the audio file in sounds folder
     */
    function safePlaySound(filename) {
        try {
            const soundPath = CONFIG.SOUNDS_PATH + filename;
            const audio = new Audio(soundPath);
            audio.volume = 0.6;
            audio.play().catch(err => {
                // Silently ignore if file doesn't exist or playback fails
                console.log(`⚠️ Sound playback failed: ${filename}`, err.message);
            });
        } catch (err) {
            // Silently ignore errors
            console.log(`⚠️ Could not load sound: ${filename}`, err.message);
        }
    }

    // ========================================================================
    // GLOBAL STATE
    // ========================================================================
    
    const state = {
        // Mission timing
        missionStart: Date.now(),
        missionTime: 0,
        
        // Telemetry
        latencyMs: CONFIG.LATENCY_MS,
        signalQuality: CONFIG.SIGNAL_BASE,
        
        // Game progress
        understanding: 0,
        unlocks: new Set(),
        
        // Progression system
        progress: 0,              // 0..100, arrondi au multiple de 5
        clues: new Set(),         // Ensemble de clues débloquées
        capabilities: new Set(),  // Ensemble d'opérations déverrouillées
        
        // Technical variables (modifiées par opérations)
        cameraIntegrity: 100,     // 0..100%
        mobility: 100,            // 0..100%
        antennaStability: 100,    // 0..100%
        
        // Operation state
        operationInProgress: null, // null ou opType si une opération est en cours
        executedOps: new Set(),    // Opérations déjà exécutées (one-shot)
        appliedRules: new Set(),   // Règles déverrouillage déjà appliquées
        
        // Hints state
        readHints: new Set(),      // Hints déjà consultés
        
        // Data stores
        journal: [],
        inbox: [],
        images: [],
        
        // Event queue
        scheduled: [],
        
        // UI state
        ui: {
            activeTab: 'journal'
        }
    };

    // ========================================================================
    // DOM ELEMENTS CACHE
    // ========================================================================
    
    let els = {};
    
    // Cache for operations panel to avoid unnecessary re-renders
    let operationsPanelCache = {
        capabilities: '',
        operationInProgress: null,
        executedOps: ''
    };

    function cacheElements() {
        els = {
            statusBar: document.getElementById('statusBar'),
            console: document.getElementById('console'),
            tabBody: document.getElementById('tabBody'),
            operationsPanel: document.getElementById('operationsPanel'),
            btnPing: document.getElementById('btnPing'),
            btnSync: document.getElementById('btnSync'),
            btnOpenLast: document.getElementById('btnOpenLast'),
            btnMenu: document.getElementById('btnMenu'),
            tabs: document.querySelectorAll('.tab'),
            tabImages: document.querySelector('[data-tab="images"]')
        };
    }

    // ========================================================================
    // TIME UTILITIES
    // ========================================================================
    
    /**
     * Get current mission time in milliseconds
     */
    function nowMissionMs() {
        return Date.now() - state.missionStart;
    }

    /**
     * Format milliseconds to HH:MM:SS
     */
    function fmtTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // ========================================================================
    // EVENT QUEUE SYSTEM
    // ========================================================================
    
    /**
     * Schedule an event to occur at a specific mission time
     * @param {number} atMs - Mission time (ms) when event should fire
     * @param {string} type - Event type (SYS_LOG, RECV_TRANSMISSION, etc.)
     * @param {any} payload - Event data
     */
    function schedule(atMs, type, payload) {
        state.scheduled.push({ at: atMs, type, payload });
        // Keep sorted by time (earliest first)
        state.scheduled.sort((a, b) => a.at - b.at);
    }

    /**
     * Main event processing loop - called every tick
     */
    function processEvents() {
        state.missionTime = nowMissionMs();

        // Process all events that should have fired by now
        while (state.scheduled.length && state.scheduled[0].at <= state.missionTime) {
            const event = state.scheduled.shift();
            dispatch(event);
        }

        renderStatus();
        // Only re-render operations panel if state changed
        renderOperationsPanelIfChanged();
    }

    /**
     * Dispatch an event based on its type
     */
    function dispatch(event) {
        switch (event.type) {
            case 'SYS_LOG':
                logLine('SYS', event.payload);
                break;

            case 'SCI_LOG':
                logLine('SCI', event.payload);
                break;

            case 'WARN_LOG':
                logLine('WARN', event.payload);
                break;

            case 'RECV_TRANSMISSION':
                handleTransmission(event.payload);
                break;

            case 'RECV_IMAGE':
                handleImage(event.payload);
                break;

            case 'UNLOCK_ENTRY':
                unlock([event.payload]);
                break;

            case 'UPDATE_TELEMETRY':
                Object.assign(state, event.payload);
                break;

            case 'OP_RESULT':
                resolveOperation(event.payload.opType);
                break;

            default:
                console.warn('Unknown event type:', event.type);
        }
    }

    /**
     * Handle incoming transmission
     */
    function handleTransmission(tx) {
        // Play transmission sound (prevents overlapping)
        playTransmissionSound();
        
        state.inbox.push(tx);
        logLine('TEL', `Transmission reçue: ${tx.id} (${tx.title})`);
        addJournal(`Transmission ${tx.id}`, tx.summary, tx.hintKey);
        
        // Add appropriate clue
        if (tx.id === '#0001') {
            state.clues.add('tx_0001_received');
            updateProgressAndMilestones();
        }
        
        if (tx.id === '#0003') {
            state.clues.add('tx_0003_received');
            updateProgressAndMilestones();
        }
        
        if (tx.unlocks && tx.unlocks.length > 0) {
            unlock(tx.unlocks);
        }
        
        if (state.ui.activeTab === 'journal') {
            renderTab();
        }
    }

    /**
     * Handle incoming image
     */
    function handleImage(img) {
        state.images.push(img);
        logLine('IMG', `Fichier image reçu: ${img.id} (qualité: ${img.qualityLabel})`);
        
        // Add appropriate clue
        if (img.id === 'IMG_0001_LOWQ') {
            state.clues.add('img_0001_received');
            updateProgressAndMilestones();
        }
        
        if (img.id === 'IMG_0002_ENHANCED') {
            state.clues.add('img_0002_received');
            updateProgressAndMilestones();
        }
        
        if (img.id === 'IMG_0004_ANGLE_SHIFT') {
            state.clues.add('angle_shift_observed');
            updateProgressAndMilestones();
        }
        
        if (img.unlocks && img.unlocks.length > 0) {
            unlock(img.unlocks);
        }
        
        // Add notification to images tab (unless already active)
        if (state.ui.activeTab !== 'images' && els.tabImages) {
            els.tabImages.classList.add('has-update');
        }
        
        if (state.ui.activeTab === 'images') {
            renderTab();
        }
    }

    /**
     * Unlock encyclopedia entries
     */
    function unlock(slugs) {
        for (const slug of slugs) {
            if (!state.unlocks.has(slug)) {
                state.unlocks.add(slug);
                logLine('SCI', `Nouvelle entrée encyclopédie débloquée.`);
            }
        }
    }

    // ========================================================================
    // CONSOLE / LOGGING
    // ========================================================================
    
    /**
     * Add a line to the console
     */
    function logLine(tag, text) {
        const line = document.createElement('div');
        line.className = `line tag-${tag}`;
        line.textContent = `[${fmtTime(state.missionTime)}] [${tag}] ${text}`;
        els.console.appendChild(line);
        
        // Auto-scroll to bottom
        els.console.scrollTop = els.console.scrollHeight;
    }

    /**
     * Add entry to journal
     */
    function addJournal(title, body, hintKey) {
        state.journal.push({
            t: state.missionTime,
            title,
            body,
            hintKey: hintKey || null
        });
        
        if (state.ui.activeTab === 'journal') {
            renderTab();
        }
    }

    /**
     * Render operations panel only if state changed
     */
    function renderOperationsPanelIfChanged() {
        const currentCapabilities = Array.from(state.capabilities).sort().join(',');
        const currentInProgress = state.operationInProgress;
        const currentExecuted = Array.from(state.executedOps).sort().join(',');
        
        // Only re-render if something changed
        if (currentCapabilities !== operationsPanelCache.capabilities ||
            currentInProgress !== operationsPanelCache.operationInProgress ||
            currentExecuted !== operationsPanelCache.executedOps) {
            
            operationsPanelCache.capabilities = currentCapabilities;
            operationsPanelCache.operationInProgress = currentInProgress;
            operationsPanelCache.executedOps = currentExecuted;
            
            renderOperationsPanel();
        }
    }
    
    /**
     * Render operations panel
     */
    function renderOperationsPanel() {
        const panel = document.getElementById('operationsPanel');
        if (!panel) return;

        panel.innerHTML = '';

        if (state.capabilities.size === 0) {
            const empty = document.createElement('div');
            empty.className = 'ops-empty';
            empty.textContent = 'Aucune opération disponible.';
            panel.appendChild(empty);
            return;
        }

        // Show all capabilities in order
        for (const opId of OPERATIONS.map(op => op.id)) {
            if (!state.capabilities.has(opId)) continue;

            const opInfo = OPERATIONS.find(op => op.id === opId);
            const isExecuted = state.executedOps.has(opId);
            
            const btn = document.createElement('button');
            btn.className = 'op-btn';
            
            // Modify label if already executed
            if (isExecuted) {
                btn.textContent = `${opInfo.label} (Terminé)`;
                btn.className += ' op-done';
                btn.disabled = true;
            } else {
                btn.textContent = opInfo.label;
                
                // Disable if operation in progress
                if (state.operationInProgress) {
                    btn.disabled = true;
                    if (state.operationInProgress === opId) {
                        btn.className += ' op-btn--active';
                    }
                }
            }
            
            btn.addEventListener('click', () => executeOperation(opId));
            panel.appendChild(btn);
        }

        // Show status if operation in progress
        if (state.operationInProgress) {
            const status = document.createElement('div');
            status.className = 'ops-status';
            status.textContent = 'EN COURS…';
            panel.appendChild(status);
        }
    }

    // ========================================================================
    // UI RENDERING
    // ========================================================================
    
    /**
     * Update status bar
     */
    function renderStatus() {
        // Find next reception event to show countdown
        const nextRecv = state.scheduled.find(e => e.type.startsWith('RECV_'));
        const eta = nextRecv ? Math.max(0, nextRecv.at - state.missionTime) : 0;
        const signalPercent = Math.round(state.signalQuality * 100);

        els.statusBar.textContent = 
            `CONNECT.H // LINK: EARTH→PROBE // LATENCY: ${fmtTime(eta)} // SIGNAL: ${signalPercent}% // T+${fmtTime(state.missionTime)}`;
    }

    /**
     * Render the active tab content
     */
    function renderTab() {
        const tab = state.ui.activeTab;
        els.tabBody.innerHTML = '';

        switch (tab) {
            case 'journal':
                renderJournalTab();
                break;
            case 'encyclo':
                renderEncycloTab();
                break;
            case 'images':
                renderImagesTab();
                break;
        }
    }

    function renderJournalTab() {
        if (state.journal.length === 0) {
            els.tabBody.innerHTML = '<div class="emptyState">Aucune entrée de journal.</div>';
            return;
        }

        // Show newest first
        state.journal.slice().reverse().forEach(entry => {
            const card = document.createElement('div');
            card.className = 'entry';
            
            // Build title with optional hint button
            let titleHTML = `<div class="entryTitle">${escapeHtml(entry.title)}`;
            if (entry.hintKey && HINTS[entry.hintKey]) {
                const isRead = state.readHints.has(entry.hintKey);
                const readClass = isRead ? ' hint-read' : '';
                titleHTML += `<span class="hint-btn${readClass}" data-hint="${escapeHtml(entry.hintKey)}" title="Aide">[?]</span>`;
            }
            titleHTML += `</div>`;
            
            card.innerHTML = titleHTML + `
                <div class="entryBody">${escapeHtml(entry.body)}</div>
                <div class="entryMeta">T+${fmtTime(entry.t)}</div>
            `;
            els.tabBody.appendChild(card);
        });
        
        // Add click handlers for hint buttons
        els.tabBody.querySelectorAll('.hint-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openHintModal(btn.dataset.hint);
            });
        });
    }

    function renderEncycloTab() {
        const unlockedEntries = ENCYC_ENTRIES.filter(e => state.unlocks.has(e.slug));
        
        if (unlockedEntries.length === 0) {
            els.tabBody.innerHTML = '<div class="emptyState">Aucune entrée débloquée.</div>';
            return;
        }

        unlockedEntries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'entry';
            
            // Build title with optional hint button
            let titleHTML = `<div class="entryTitle">${escapeHtml(entry.title)}`;
            if (entry.hintKey && HINTS[entry.hintKey]) {
                const isRead = state.readHints.has(entry.hintKey);
                const readClass = isRead ? ' hint-read' : '';
                titleHTML += `<span class="hint-btn${readClass}" data-hint="${escapeHtml(entry.hintKey)}" title="Aide">[?]</span>`;
            }
            titleHTML += `</div>`;
            
            card.innerHTML = titleHTML + `
                <div class="entryBody">${escapeHtml(entry.text)}</div>
            `;
            els.tabBody.appendChild(card);
        });
        
        // Add click handlers for hint buttons
        els.tabBody.querySelectorAll('.hint-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openHintModal(btn.dataset.hint);
            });
        });
    }

    function renderImagesTab() {
        if (state.images.length === 0) {
            els.tabBody.innerHTML = '<div class="emptyState">Aucune image reçue.</div>';
            return;
        }

        // Newest first
        state.images.slice().reverse().forEach(img => {
            const card = document.createElement('div');
            card.className = 'entry entry--image';
            
            // Build image path
            const imagePath = img.imagePath || (CONFIG.IMAGES_PATH + img.id + '.png');
            
            card.innerHTML = `
                <div class="image-thumbnail" data-fullsrc="${escapeHtml(imagePath)}">
                    <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(img.id)}" loading="lazy" />
                </div>
                <div class="image-info">
                    <div class="entryTitle">${escapeHtml(img.id)}</div>
                    <div class="entryBody">
                        Qualité: ${escapeHtml(img.qualityLabel)}<br/>
                        ${escapeHtml(img.note)}
                    </div>
                    <div class="entryMeta">T+${fmtTime(img.t || state.missionTime)}</div>
                </div>
            `;
            
            // Add click handler to thumbnail
            const thumbnail = card.querySelector('.image-thumbnail');
            thumbnail.addEventListener('click', () => {
                openLightbox(imagePath, img.id);
            });
            
            els.tabBody.appendChild(card);
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================================================
    // LIGHTBOX SYSTEM
    // ========================================================================
    
    let lightboxElement = null;

    /**
     * Create lightbox element (once)
     */
    function createLightbox() {
        if (lightboxElement) return;

        lightboxElement = document.createElement('div');
        lightboxElement.className = 'lightbox';
        lightboxElement.id = 'imageLightbox';
        lightboxElement.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content">
                <img class="lightbox-image" src="" alt="" />
                <div class="lightbox-caption"></div>
            </div>
        `;

        document.body.appendChild(lightboxElement);

        // Close on backdrop click
        const backdrop = lightboxElement.querySelector('.lightbox-backdrop');
        backdrop.addEventListener('click', closeLightbox);

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxElement.classList.contains('show')) {
                closeLightbox();
            }
        });
    }

    /**
     * Open lightbox with image
     */
    function openLightbox(imageSrc, caption) {
        createLightbox();

        const img = lightboxElement.querySelector('.lightbox-image');
        const captionEl = lightboxElement.querySelector('.lightbox-caption');

        img.src = imageSrc;
        img.alt = caption || 'Image';
        captionEl.textContent = caption || '';

        lightboxElement.classList.add('show');
    }

    /**
     * Close lightbox
     */
    function closeLightbox() {
        if (lightboxElement) {
            lightboxElement.classList.remove('show');
        }
    }

    // ========================================================================
    // HINT MODAL SYSTEM
    // ========================================================================
    
    let hintModalElement = null;

    /**
     * Create hint modal element (once)
     */
    function createHintModal() {
        if (hintModalElement) return;

        hintModalElement = document.createElement('div');
        hintModalElement.className = 'hint-modal';
        hintModalElement.id = 'hintModal';
        hintModalElement.innerHTML = `
            <div class="hint-backdrop"></div>
            <div class="hint-content">
                <h3 class="hint-title" id="hintTitle"></h3>
                <p class="hint-body" id="hintBody"></p>
                <button class="hint-close" id="hintClose">FERMER</button>
            </div>
        `;

        document.body.appendChild(hintModalElement);

        // Close on backdrop click
        const backdrop = hintModalElement.querySelector('.hint-backdrop');
        backdrop.addEventListener('click', closeHintModal);

        // Close on button click
        const closeBtn = hintModalElement.querySelector('#hintClose');
        closeBtn.addEventListener('click', closeHintModal);

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && hintModalElement.classList.contains('show')) {
                closeHintModal();
            }
        });
    }

    /**
     * Open hint modal with hint content
     */
    function openHintModal(hintKey) {
        const hint = HINTS[hintKey];
        if (!hint) {
            console.warn('Hint not found:', hintKey);
            return;
        }

        createHintModal();

        const titleEl = hintModalElement.querySelector('#hintTitle');
        const bodyEl = hintModalElement.querySelector('#hintBody');

        titleEl.textContent = hint.title;
        bodyEl.textContent = hint.body;

        hintModalElement.classList.add('show');
        
        // Marquer le hint comme consulté
        if (!state.readHints.has(hintKey)) {
            state.readHints.add(hintKey);
            
            // Re-render l'onglet actif pour mettre à jour l'apparence du bouton
            renderTab();
        }
    }

    /**
     * Close hint modal
     */
    function closeHintModal() {
        if (hintModalElement) {
            hintModalElement.classList.remove('show');
        }
    }

    // ========================================================================
    // OPERATIONS DATA
    // ========================================================================
    
    const OPERATIONS = [
        {
            id: 'OP_CLEAN_LENS',
            label: 'Nettoyage lentille',
            shortName: 'CLEAN_LENS'
        },
        {
            id: 'OP_RECAL_CAMERA',
            label: 'Recalibration caméra',
            shortName: 'RECAL_CAMERA'
        },
        {
            id: 'OP_FREE_MOBILITY',
            label: 'Dégagement mobilité',
            shortName: 'FREE_MOBILITY'
        }
    ];

    // ========================================================================
    // PROGRESSION & CLUES
    // ========================================================================
    
    const CLUE_POINTS = {
        'tx_0001_received': 5,      // Première transmission
        'img_0001_received': 5,     // Première image
        'img_0002_received': 5,     // Image nettoyée
        'lens_clean_done': 5,       // Nettoyage lentille complété
        'tx_0003_received': 5,      // Transmission recalibration
        'camera_recal_done': 5,     // Recalibration complétée
        'angle_shift_observed': 5,  // Décalage angle observé
        'mobility_free_done': 5     // Mobilité dégagée
    };

    /**
     * Compute progress percentage (0..100, multiple of 5)
     */
    function computeProgressFromClues() {
        let total = 0;
        for (const clue of state.clues) {
            total += CLUE_POINTS[clue] || 0;
        }
        // Arrondir au multiple de 5
        return Math.floor(total / 5) * 5;
    }

    // ========================================================================
    // UNLOCK RULES
    // ========================================================================
    
    const UNLOCK_RULES = [
        {
            id: 'unlock_clean_lens',
            description: 'Déverrouille OP_CLEAN_LENS',
            condition: (state) => {
                return state.clues.has('tx_0001_received') && 
                       state.clues.has('img_0001_received') && 
                       state.progress >= 10;
            },
            grants: ['OP_CLEAN_LENS']
        },
        {
            id: 'unlock_recal_camera',
            description: 'Déverrouille OP_RECAL_CAMERA après IMG_0002',
            condition: (state) => {
                return state.clues.has('img_0002_received');
            },
            grants: ['OP_RECAL_CAMERA']
        },
        {
            id: 'unlock_free_mobility',
            description: 'Déverrouille OP_FREE_MOBILITY après recalibration',
            condition: (state) => {
                return state.clues.has('camera_recal_done');
            },
            grants: ['OP_FREE_MOBILITY']
        }
    ];

    /**
     * Apply unlock rules and grant capabilities if conditions are met
     */
    function applyUnlockRules() {
        for (const rule of UNLOCK_RULES) {
            // Éviter doubles déverrouillages
            if (state.appliedRules.has(rule.id)) {
                continue;
            }
            
            if (rule.condition(state)) {
                state.appliedRules.add(rule.id);
                
                for (const capId of rule.grants) {
                    if (!state.capabilities.has(capId)) {
                        state.capabilities.add(capId);
                        logLine('SCI', `Opération déverrouillée: ${OPERATIONS.find(op => op.id === capId)?.label || capId}`);
                    }
                }
            }
        }
    }

    /**
     * Update progress and apply milestone effects
     */
    function updateProgressAndMilestones() {
        const oldProgress = state.progress;
        state.progress = computeProgressFromClues();
        
        // Appliquer les règles de déverrouillage
        applyUnlockRules();
        
        // Si progression a changé et est un multiple de 5, log
        if (state.progress > oldProgress && state.progress % 5 === 0) {
            logLine('SYS', `Progression mission: ${state.progress}%`);
            onReachMilestone(state.progress);
        }
    }

    /**
     * Hook appelé quand une milestone est atteinte
     */
    function onReachMilestone(progressPercent) {
        // Ici on peut injecter des événements ou des changements selon la progression
        // Pour maintenant, juste log. Peut être étendu plus tard.
    }

    // ========================================================================
    // ENCYCLOPEDIA DATA
    // ========================================================================
    
    const ENCYC_ENTRIES = [
        {
            slug: 'decorrelation_prelim',
            title: 'Décorrélation (préliminaire)',
            text: 'Les mesures locales ne suivent pas les relations attendues entre gravité, période orbitale et flux énergétique. Terme provisoire en attente de modèle explicatif. Origine inconnue.',
            hintKey: 'encyc_decorrelation'
        },
        {
            slug: 'exo421c',
            title: 'EXO-421c',
            text: 'Exoplanète rocheuse située dans le système Proxima +4.2. Diamètre estimé: 1.12× Terre. Atmosphère ténue détectée. Cible primaire du programme Connect.H.',
            hintKey: 'encyc_exo421c'
        },
        {
            slug: 'probe_atlas',
            title: 'Sonde ATLAS-7',
            text: 'Véhicule robotique d\'exploration de surface. Autonomie: 15 ans terrestres. Équipements: spectromètre, caméra multibande, foreuse, capteurs sismiques.',
            hintKey: 'encyc_atlas7'
        }
    ];

    // ========================================================================
    // HINTS SYSTEM
    // ========================================================================
    
    const HINTS = {
        "tx_0001": {
            title: "Explication simplifiée",
            body: "Normalement, la gravité d'une étoile et la distance d'une planète permettent de prédire son mouvement. Ici, les calculs ne correspondent pas aux observations, ce qui suggère qu'un facteur inconnu perturbe le système."
        },
        
        "tx_0003": {
            title: "Explication simplifiée",
            body: "Une image est composée de plusieurs canaux de couleur. Si ces canaux ne sont pas parfaitement alignés, l'image peut sembler dédoublée. Ici, ce décalage persiste même après recalibration."
        },
        
        "encyc_decorrelation": {
            title: "Décorrélation expliquée",
            body: "Quand deux phénomènes sont liés par une loi physique, leurs variations suivent un schéma prévisible. Une décorrélation signifie que ce lien attendu ne fonctionne plus comme prévu."
        },
        
        "encyc_exo421c": {
            title: "Contexte scientifique",
            body: "Une exoplanète est une planète située hors de notre système solaire. Proxima 4.2 indique une distance d'environ 4,2 années-lumière."
        },
        
        "encyc_atlas7": {
            title: "Sonde robotique",
            body: "Une sonde d'exploration transporte des instruments scientifiques pour collecter des données à distance, sans présence humaine."
        }
    };

    // ========================================================================
    // OPERATIONS SYSTEM
    // ========================================================================
    
    /**
     * Execute an operation - schedule result after latency
     */
    function executeOperation(opId) {
        // Vérifier que l'opération est déverrouillée
        if (!state.capabilities.has(opId)) {
            logLine('WARN', `Opération ${opId} non déverrouillée.`);
            return;
        }
        
        // Vérifier que l'opération n'a pas déjà été exécutée
        if (state.executedOps.has(opId)) {
            const opName = OPERATIONS.find(op => op.id === opId)?.shortName || opId;
            logLine('WARN', `Opération déjà effectuée: ${opName}.`);
            return;
        }
        
        // Vérifier qu'aucune opération n'est en cours
        if (state.operationInProgress) {
            logLine('WARN', `Une opération est déjà en cours. Impossible d'en lancer une autre.`);
            return;
        }
        
        // Marquer comme en cours
        state.operationInProgress = opId;
        
        const opName = OPERATIONS.find(op => op.id === opId)?.shortName || opId;
        logLine('SCI', `Opération envoyée: ${opName}`);
        
        // Note: renderOperationsPanel() is called automatically by processEvents() every tick
        // No need to call it here
        
        // Schedule result after latency
        schedule(
            state.missionTime + state.latencyMs,
            'OP_RESULT',
            { opType: opId }
        );
    }

    /**
     * Resolve operation result
     */
    function resolveOperation(opId) {
        state.operationInProgress = null;
        
        const op = OPERATIONS.find(o => o.id === opId);
        if (!op) return;
        
        // Marquer l'opération comme exécutée (one-shot)
        state.executedOps.add(opId);
        
        logLine('SYS', `Résultat opération: ${op.shortName} complétée`);
        
        // Add appropriate clue and modify technical variables
        switch (opId) {
            case 'OP_CLEAN_LENS':
                state.clues.add('lens_clean_done');
                state.cameraIntegrity = Math.min(100, state.cameraIntegrity + 15);
                logLine('SCI', 'Lentille nettoyée. Intégrité caméra augmentée.');
                
                // Play optional sound
                safePlaySound('connecth_lens_clean.mp3');
                
                // Trigger new image after a short delay
                schedule(
                    state.missionTime + 2000,
                    'RECV_IMAGE',
                    {
                        id: 'IMG_0002_ENHANCED',
                        qualityLabel: 'MEDIUM',
                        note: 'Qualité améliorée après nettoyage lentille. Détails de surface plus visibles.',
                        t: state.missionTime + 2000,
                        unlocks: []
                    }
                );
                break;

            case 'OP_RECAL_CAMERA':
                state.clues.add('camera_recal_done');
                
                // Augmenter légèrement l'intégrité caméra
                state.cameraIntegrity = Math.min(100, state.cameraIntegrity + 8);
                
                // Store original signal quality for restoration
                const originalSignal = state.signalQuality;
                
                // Diminuer temporairement signalQuality
                state.signalQuality = Math.max(0.65, state.signalQuality - 0.03);
                
                logLine('SYS', 'Recalibration capteur complétée.');
                logLine('WARN', 'Décalage inter-canal détecté.');
                
                // Play optional sound
                safePlaySound('connecth_camera_recalibration.mp3');
                
                // Restaurer signal après 30 secondes
                schedule(
                    state.missionTime + 30000,
                    'UPDATE_TELEMETRY',
                    { signalQuality: Math.min(1.0, originalSignal + 0.01) }
                );
                
                // Schedule image avec overlay recalibration
                schedule(
                    state.missionTime + 3000,
                    'RECV_IMAGE',
                    {
                        id: 'IMG_0003_RECAL_OVERLAY',
                        qualityLabel: 'CALIBRATED',
                        note: 'Image recalibrée avec correction inter-canaux. Contraste spectral amélioré.',
                        t: state.missionTime + 3000,
                        unlocks: []
                    }
                );
                
                // Injecter transmission TX_0003
                schedule(
                    state.missionTime + 5000,
                    'RECV_TRANSMISSION',
                    {
                        id: '#0003',
                        title: 'Anomalie de cohérence — recalibration caméra',
                        summary: 'Persistance d\'un déphasage inter-canal corrélé à la topographie.',
                        body: 'Divergence mesurée entre canaux spectraux. Hypothèse optique locale affaiblie. Recommandation: acquisition angle secondaire.',
                        unlocks: [],
                        hintKey: 'tx_0003'
                    }
                );
                
                break;

            case 'OP_FREE_MOBILITY':
                state.clues.add('mobility_free_done');
                state.mobility = Math.min(100, state.mobility + 20);
                
                logLine('SYS', 'Dégagement mobilité complété.');
                logLine('SCI', 'Micro-déplacement effectué.');
                logLine('WARN', 'Décalage spectral persistant à distance.');
                
                // Play optional sound
                safePlaySound('connecth_mobility_servo_short.mp3');
                
                // Trigger angle shift image
                schedule(
                    state.missionTime + 4000,
                    'RECV_IMAGE',
                    {
                        id: 'IMG_0004_ANGLE_SHIFT',
                        qualityLabel: 'SECONDARY_ANGLE',
                        note: 'Acquisition sous angle secondaire. Décalage spectral confirmé à différentes positions.',
                        t: state.missionTime + 4000,
                        unlocks: []
                    }
                );
                
                break;
        }
        
        // Update progress
        updateProgressAndMilestones();
        
        // Re-enable UI
        renderOperationsPanel();
    }

    // ========================================================================
    // USER ACTIONS
    // ========================================================================
    
    function handlePing() {
        logLine('SCI', 'Ping envoyé à la sonde. Attente accusé de réception…');
        els.btnPing.disabled = true;
        
        // Response arrives after latency
        schedule(
            state.missionTime + state.latencyMs,
            'SYS_LOG',
            'Accusé de réception sonde: OK. Signal nominal.'
        );
        
        // Re-enable button after response
        setTimeout(() => {
            els.btnPing.disabled = false;
        }, state.latencyMs + 1000);
    }

    function handleSync() {
        logLine('SCI', 'Synchronisation dossier demandée. Fenêtre de transmission ouverte.');
        
        // Small signal fluctuation
        schedule(
            state.missionTime + 2000,
            'UPDATE_TELEMETRY',
            { signalQuality: Math.max(0.65, state.signalQuality - 0.02 + Math.random() * 0.04) }
        );
        
        // Confirmation after short delay
        schedule(
            state.missionTime + 3000,
            'SYS_LOG',
            'Dossier synchronisé. Index mis à jour.'
        );
    }

    function handleOpenLast() {
        const last = state.inbox[state.inbox.length - 1];
        
        if (!last) {
            logLine('WARN', 'Aucune transmission disponible dans la boîte de réception.');
            return;
        }
        
        logLine('TEL', `--- TRANSMISSION ${last.id} ---`);
        logLine('TEL', `Titre: ${last.title}`);
        logLine('TEL', `Contenu: ${last.body}`);
        logLine('TEL', `--- FIN TRANSMISSION ---`);
    }

    function handleMenu() {
        if (confirm('Retourner au menu principal ? La progression sera perdue.')) {
            stopAllAudio();
            window.location.href = '/connect-h/';
        }
    }

    // ========================================================================
    // UI EVENT HANDLERS
    // ========================================================================
    
    function wireUI() {
        // Tab switching
        els.tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                els.tabs.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                
                // Remove notification when viewing images tab
                if (btn.dataset.tab === 'images') {
                    btn.classList.remove('has-update');
                }
                
                // Update state and render
                state.ui.activeTab = btn.dataset.tab;
                renderTab();
            });
        });

        // Action buttons
        els.btnPing.addEventListener('click', handlePing);
        els.btnSync.addEventListener('click', handleSync);
        els.btnOpenLast.addEventListener('click', handleOpenLast);
        els.btnMenu.addEventListener('click', handleMenu);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to menu
            if (e.key === 'Escape') {
                handleMenu();
            }
            // 1, 2, 3 for tabs
            if (e.key === '1') {
                document.querySelector('[data-tab="journal"]').click();
            }
            if (e.key === '2') {
                document.querySelector('[data-tab="encyclo"]').click();
            }
            if (e.key === '3') {
                document.querySelector('[data-tab="images"]').click();
            }
        });
    }

    // ========================================================================
    // INTRO SEQUENCE
    // ========================================================================
    
    function startIntroSequence() {
        // Immediate system logs
        logLine('SYS', 'Initialisation session opérateur…');
        
        schedule(500, 'SYS_LOG', 'Chargement profil mission: CONNECT.H / EXO-421c');
        schedule(1000, 'SYS_LOG', 'Liaison longue portée établie.');
        schedule(1500, 'SYS_LOG', 'Calibration antenne: OK');
        
        // Add initial journal entry
        setTimeout(() => {
            addJournal(
                'Ouverture mission',
                'Session opérateur établie. Liaison longue portée active. En attente de données sonde.'
            );
        }, 2000);

        // Cached telemetry (arrives quickly - was stored)
        schedule(3000, 'SYS_LOG', 'Télémétrie sol récupérée du cache local.');
        schedule(3500, 'SYS_LOG', 'Trajectoire nominale. Distance: 4.2 années-lumière. Dérive corrigée.');
        
        // Unlock basic encyclopedia entries
        schedule(4000, 'UNLOCK_ENTRY', 'exo421c');
        schedule(4500, 'UNLOCK_ENTRY', 'probe_atlas');

        // First real transmission arrives after simulated latency (30 sec)
        schedule(CONFIG.LATENCY_MS, 'RECV_TRANSMISSION', {
            id: '#0001',
            title: 'Anomalie orbitale — confirmation instrumentale',
            summary: 'Les mesures confirment une période orbitale instable à faible amplitude. Fluctuation énergétique locale corrélée.',
            body: 'Données brutes: ΔP/P ~ 1.6e-4. Flux local: variations non thermiques détectées. Décorrélation observée entre modèles gravitationnels prédits et mesures in situ. Analyse en cours.',
            unlocks: ['decorrelation_prelim'],
            hintKey: 'tx_0001'
        });

        // Image arrives 12 seconds after the transmission
        schedule(CONFIG.LATENCY_MS + 12000, 'RECV_IMAGE', {
            id: 'IMG_0001_LOWQ',
            qualityLabel: 'LOW',
            note: 'Compression forcée. Artefacts présents. Motif de surface ambigu — structure potentielle ou formation géologique naturelle. Analyse visuelle requise.',
            t: CONFIG.LATENCY_MS + 12000,
            unlocks: []
        });

        // Additional log after image
        schedule(CONFIG.LATENCY_MS + 15000, 'SCI_LOG', 'Image en file d\'attente pour analyse haute résolution.');
    }

    // ========================================================================
    // BOOT
    // ========================================================================
    
    function boot() {
        console.log('🚀 Connect.H Mission Core initializing...');
        
        // Cache DOM elements
        cacheElements();
        
        // Initialize and start audio
        initAudio();
        startControlRoomAudio();
        
        // Wire up UI events
        wireUI();
        
        // Initial render
        renderTab();
        renderStatus();
        renderOperationsPanel();
        
        // Start intro sequence
        startIntroSequence();
        
        // Start main loop
        setInterval(processEvents, CONFIG.TICK_INTERVAL_MS);
        
        console.log('✅ Connect.H Mission Core ready');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Expose for debugging
    window.ConnectHMission = {
        state,
        schedule,
        logLine,
        stopAllAudio,
        playTransmissionSound,
        executeOperation,
        applyUnlockRules,
        updateProgressAndMilestones
    };

})();
