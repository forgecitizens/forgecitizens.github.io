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
    // Add your radio tracks here
    // Example: 'radio/song1.mp3', 'radio/song2.mp3'
    'radio/Disco Elysium - The Final Cut OST - Advesperascit (British Sea Power) (1).mp3',
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
    
    // Update play/pause button icon
    const playBtn = document.getElementById('radio-play-btn');
    if (playBtn) {
        playBtn.textContent = isRadioPlaying ? '⏸' : '▶';
    }
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
    
    // Check if popup already exists
    let popup = document.getElementById('radio-popup');
    
    if (popup) {
        popup.classList.add('show');
        popup.style.display = 'flex';
        if (typeof bringToFront === 'function') {
            bringToFront(popup);
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
    
    // Position near the cassette icon (bottom left)
    popup.style.left = '20px';
    popup.style.bottom = '120px';
    popup.style.top = 'auto';
    
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
