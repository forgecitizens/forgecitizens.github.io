/**
 * ========================================================================
 * RADIO - Windows 98 Style Radio Player
 * ========================================================================
 * A simple retro radio player with play/pause and track navigation.
 */

// Radio state
let radioAudio = null;
let radioTracks = [];
let currentTrackIndex = 0;
let isRadioPlaying = false;

/**
 * Scan the radio folder for audio files
 * Since we can't dynamically scan folders in browser, we'll maintain a list
 */
const radioTrackList = [
    'radio/01 - Neostalgia.mp3',
    'radio/02 - Folders.mp3',
    'radio/03 - Unité d\'habitation (instrumental).mp3',
    'radio/04 - Broadcasting House.mp3',
    'radio/05 - Apollo Pavilion.mp3',
    'radio/06 - Auditorium (instrumental).mp3',
    'radio/07 - Erkannt.mp3',
];

/**
 * Initialize radio with available tracks
 */
function initializeRadio() {
    radioTracks = radioTrackList;
    if (radioTracks.length > 0) {
        loadTrack(0);
    }
}

/**
 * Load a track by index
 */
function loadTrack(index) {
    if (radioTracks.length === 0) return;
    
    currentTrackIndex = index;
    if (currentTrackIndex < 0) currentTrackIndex = radioTracks.length - 1;
    if (currentTrackIndex >= radioTracks.length) currentTrackIndex = 0;
    
    const wasPlaying = isRadioPlaying;
    
    if (radioAudio) {
        radioAudio.pause();
    }
    
    radioAudio = new Audio(radioTracks[currentTrackIndex]);
    radioAudio.volume = 0.5;
    
    // Auto-play next track when current ends
    radioAudio.addEventListener('ended', () => {
        radioNextTrack();
    });
    
    // Update display
    updateRadioDisplay();
    
    if (wasPlaying) {
        radioPlay();
    }
}

/**
 * Update the radio display
 */
function updateRadioDisplay() {
    const display = document.getElementById('radio-track-name');
    if (display) {
        if (radioTracks.length === 0) {
            display.textContent = 'Aucune piste';
        } else {
            const trackName = radioTracks[currentTrackIndex].split('/').pop();
            display.textContent = trackName;
        }
    }
    
    renderRadioPlaylist();

    // Update play/pause button icon
    const playBtn = document.getElementById('radio-play-btn');
    if (playBtn) {
        playBtn.textContent = isRadioPlaying ? '⏸' : '▶';
    }
}

/**
 * Render the playlist and highlight the current track
 */
function renderRadioPlaylist() {
    const list = document.getElementById('radio-playlist');
    if (!list) return;

    if (list.childElementCount !== radioTracks.length) {
        list.textContent = '';
        radioTracks.forEach((track, index) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'radio-playlist-item';
            item.setAttribute('role', 'option');
            item.textContent = `${index + 1}. ${track.split('/').pop().replace(/\.mp3$/i, '')}`;
            item.addEventListener('click', () => radioSelectTrack(index));
            list.appendChild(item);
        });
    }

    Array.from(list.children).forEach((item, index) => {
        const isCurrent = index === currentTrackIndex;
        item.classList.toggle('active', isCurrent);
        item.setAttribute('aria-selected', String(isCurrent));
        if (isCurrent) item.scrollIntoView({ block: 'nearest' });
    });
}

/**
 * Play a track chosen from the playlist
 */
function radioSelectTrack(index) {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }

    loadTrack(index);
    radioPlay();
}

/**
 * Play the radio
 */
function radioPlay() {
    if (!radioAudio || radioTracks.length === 0) return;
    
    radioAudio.play().catch(() => {});
    isRadioPlaying = true;
    updateRadioDisplay();
}

/**
 * Pause the radio
 */
function radioPause() {
    if (!radioAudio) return;
    
    radioAudio.pause();
    isRadioPlaying = false;
    updateRadioDisplay();
}

/**
 * Toggle play/pause
 */
function radioTogglePlay() {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    if (isRadioPlaying) {
        radioPause();
    } else {
        radioPlay();
    }
}

/**
 * Go to next track
 */
function radioNextTrack() {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    loadTrack(currentTrackIndex + 1);
    if (isRadioPlaying) {
        radioPlay();
    }
}

/**
 * Go to previous track
 */
function radioPrevTrack() {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    loadTrack(currentTrackIndex - 1);
    if (isRadioPlaying) {
        radioPlay();
    }
}

/**
 * Open the radio popup
 */
function openRadio() {
    console.log('📻 Opening radio...');
    
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    // ===== AUTO-MINIMIZE: Si une autre modale est ouverte, la minimiser =====
    if (typeof autoMinimizeOpenModals === 'function') {
        autoMinimizeOpenModals('radio-popup');
    }
    
    // Check if popup already exists
    let popup = document.getElementById('radio-popup');
    
    if (popup) {
        popup.classList.add('show');
        popup.style.display = 'flex';
        if (typeof bringToFront === 'function') {
            bringToFront(popup);
        }
        // Mettre à jour la taskbar pour montrer la radio active
        if (typeof updateTaskbar === 'function') {
            updateTaskbar();
        }
        return;
    }
    
    // Create popup
    popup = document.createElement('div');
    popup.id = 'radio-popup';
    popup.className = 'window radio-window';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    
    popup.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title">📻 Radio</div>
            <div class="window-controls">
                <div class="window-button" onclick="minimizeRadio()" aria-label="Réduire">_</div>
                <div class="window-button" onclick="closeRadio()" aria-label="Fermer">×</div>
            </div>
        </div>
        <div class="radio-content">
            <div class="radio-display" id="radio-track-name">Aucune piste</div>
            <div class="radio-controls">
                <button class="radio-btn" onclick="radioPrevTrack()" title="Piste précédente">⏮</button>
                <button class="radio-btn radio-btn-play" id="radio-play-btn" onclick="radioTogglePlay()" title="Lecture/Pause">▶</button>
                <button class="radio-btn" onclick="radioNextTrack()" title="Piste suivante">⏭</button>
            </div>
            <div class="radio-playlist" id="radio-playlist" role="listbox" aria-label="Playlist"></div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Initialize radio if not already done
    if (radioTracks.length === 0) {
        initializeRadio();
    }
    updateRadioDisplay();
    
    // Show popup
    popup.classList.add('show');
    popup.style.display = 'flex';
    
    // Position : centré en bas sur mobile, coin gauche sur desktop
    const isMobile = window.innerWidth < 480;
    if (isMobile) {
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.bottom = '80px';
        popup.style.top = 'auto';
    } else {
        popup.style.left = '20px';
        popup.style.bottom = '120px';
        popup.style.top = 'auto';
        popup.style.transform = '';
    }
    
    // Initialize dragging
    if (typeof initializeSingleModalDragging === 'function') {
        initializeSingleModalDragging(popup);
    }
    
    // Bring to front
    if (typeof bringToFront === 'function') {
        bringToFront(popup);
    }
    
    // Mettre à jour la taskbar pour montrer la radio active
    if (typeof updateTaskbar === 'function') {
        updateTaskbar();
    }
}

/**
 * Close the radio popup
 */
function closeRadio() {
    const popup = document.getElementById('radio-popup');
    if (popup) {
        popup.classList.remove('show');
        popup.style.display = 'none';
    }
    // Stop playback when closing
    radioPause();
}

/**
 * Minimize the radio popup
 */
function minimizeRadio() {
    const popup = document.getElementById('radio-popup');
    if (popup) {
        popup.classList.remove('show');
        popup.style.display = 'none';
        // Keep playing in background
        
        // Add to taskbar with truncated title
        if (typeof minimizedWindows !== 'undefined' && typeof updateTaskbar === 'function') {
            const title = typeof getModalTitle === 'function' ? getModalTitle(popup) : '📻 Radio';
            if (!minimizedWindows.find(w => w.id === 'radio-popup')) {
                minimizedWindows.push({ id: 'radio-popup', title: title });
                updateTaskbar();
            }
        }
    }
}

/**
 * Add a track to the radio playlist dynamically
 */
function addRadioTrack(trackPath) {
    radioTracks.push(trackPath);
    if (radioTracks.length === 1) {
        loadTrack(0);
    }
    updateRadioDisplay();
}

// Expose functions globally
window.openRadio = openRadio;
window.closeRadio = closeRadio;
window.minimizeRadio = minimizeRadio;
window.radioTogglePlay = radioTogglePlay;
window.radioNextTrack = radioNextTrack;
window.radioPrevTrack = radioPrevTrack;
window.addRadioTrack = addRadioTrack;

console.log('📻 Radio module loaded');
