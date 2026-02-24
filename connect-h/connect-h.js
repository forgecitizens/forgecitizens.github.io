/**
 * Connect.H - JavaScript module
 * Handles authentication, navigation, UI interactions, and audio
 */

(function() {
    'use strict';

    // ===== CONSTANTS =====
    const AUTH_KEY = 'CONNECTH_AUTH';
    const AUTH_TIMESTAMP_KEY = 'CONNECTH_AUTH_TS';
    const PASSWORD = 'MICRO1990macro';
    const TTL_HOURS = 24 * 7; // 7 days TTL
    const MAIN_SITE_URL = '/';

    // ===== SOUND CONSTANTS =====
    const SOUNDS_PATH = '/assets/connect.H/sounds/';
    const MAIN_THEME_FILE = 'connecth_main_theme.mp3';
    const BUTTON_HIT_FILE = 'new_mission_hit_button.mp3';
    const MAX_THEME_VOLUME = 0.5; // 50% max volume
    const FADE_STEP = 0.1; // 10% per step
    const FADE_INTERVAL_MS = 1000; // 1 second per step

    // ===== AUDIO OBJECTS =====
    let mainThemeAudio = null;
    let buttonHitAudio = null;
    let fadeInterval = null;

    // ===== AUDIO FUNCTIONS =====

    /**
     * Initialize audio objects
     */
    function initializeAudio() {
        // Main theme (looped background music)
        mainThemeAudio = new Audio(SOUNDS_PATH + MAIN_THEME_FILE);
        mainThemeAudio.loop = true;
        mainThemeAudio.volume = 0;

        // Button hit sound
        buttonHitAudio = new Audio(SOUNDS_PATH + BUTTON_HIT_FILE);
        buttonHitAudio.volume = 0.7;

        console.log('🔊 Connect.H audio initialized');
    }

    /**
     * Start main theme with fade in
     */
    function startMainThemeWithFadeIn() {
        if (!mainThemeAudio) return;

        // Reset volume and start playing
        mainThemeAudio.volume = 0;
        mainThemeAudio.currentTime = 0;

        // Try to play (may be blocked by browser autoplay policy)
        const playPromise = mainThemeAudio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('🎵 Main theme started, beginning fade in...');
                fadeInMainTheme();
            }).catch(error => {
                console.log('🔇 Autoplay blocked, waiting for user interaction...');
                // Add one-time click listener to start audio
                document.addEventListener('click', function startAudioOnClick() {
                    mainThemeAudio.play().then(() => {
                        fadeInMainTheme();
                    }).catch(e => console.log('Audio play failed:', e));
                    document.removeEventListener('click', startAudioOnClick);
                }, { once: true });
            });
        }
    }

    /**
     * Fade in main theme progressively
     * 10% -> 20% -> 30% -> 40% -> 50% (max), each step = 1 second
     */
    function fadeInMainTheme() {
        if (fadeInterval) {
            clearInterval(fadeInterval);
        }

        let currentVolume = 0;
        mainThemeAudio.volume = currentVolume;

        fadeInterval = setInterval(() => {
            currentVolume += FADE_STEP;

            if (currentVolume >= MAX_THEME_VOLUME) {
                currentVolume = MAX_THEME_VOLUME;
                mainThemeAudio.volume = currentVolume;
                clearInterval(fadeInterval);
                fadeInterval = null;
                console.log('🎵 Fade in complete, volume:', currentVolume);
            } else {
                mainThemeAudio.volume = currentVolume;
                console.log('🎵 Fade in step, volume:', Math.round(currentVolume * 100) + '%');
            }
        }, FADE_INTERVAL_MS);
    }

    /**
     * Fade out main theme progressively
     * @param {Function} callback - Called when fade out is complete
     */
    function fadeOutMainTheme(callback) {
        if (!mainThemeAudio) {
            if (callback) callback();
            return;
        }

        if (fadeInterval) {
            clearInterval(fadeInterval);
        }

        let currentVolume = mainThemeAudio.volume;

        fadeInterval = setInterval(() => {
            currentVolume -= FADE_STEP;

            if (currentVolume <= 0) {
                currentVolume = 0;
                mainThemeAudio.volume = currentVolume;
                mainThemeAudio.pause();
                clearInterval(fadeInterval);
                fadeInterval = null;
                console.log('🎵 Fade out complete');
                if (callback) callback();
            } else {
                mainThemeAudio.volume = currentVolume;
                console.log('🎵 Fade out step, volume:', Math.round(currentVolume * 100) + '%');
            }
        }, FADE_INTERVAL_MS);
    }

    /**
     * Play button hit sound
     */
    function playButtonHitSound() {
        if (!buttonHitAudio) return;

        // Reset and play
        buttonHitAudio.currentTime = 0;
        buttonHitAudio.play().catch(e => console.log('Button sound failed:', e));
    }

    /**
     * Stop all audio
     */
    function stopAllAudio() {
        if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
        }
        if (mainThemeAudio) {
            mainThemeAudio.pause();
            mainThemeAudio.currentTime = 0;
        }
    }

    // ===== AUTH FUNCTIONS =====
    
    /**
     * Check if user is authenticated with valid TTL
     * @returns {boolean}
     */
    function isAuthenticated() {
        const auth = localStorage.getItem(AUTH_KEY);
        const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
        
        if (auth !== '1') return false;
        
        // Check TTL if timestamp exists
        if (timestamp) {
            const authTime = parseInt(timestamp, 10);
            const now = Date.now();
            const ttlMs = TTL_HOURS * 60 * 60 * 1000;
            
            if (now - authTime > ttlMs) {
                // Auth expired, clear it
                clearAuth();
                return false;
            }
        }
        
        return true;
    }

    /**
     * Set authentication in localStorage
     */
    function setAuth() {
        localStorage.setItem(AUTH_KEY, '1');
        localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    }

    /**
     * Clear authentication from localStorage
     */
    function clearAuth() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    }

    /**
     * Verify password
     * @param {string} input
     * @returns {boolean}
     */
    function verifyPassword(input) {
        return input === PASSWORD;
    }

    // ===== PASSWORD MODAL =====

    /**
     * Create and show the password modal
     */
    function showPasswordModal() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'password-overlay';
        overlay.id = 'connecth-password-overlay';
        
        overlay.innerHTML = `
            <div class="password-modal" role="dialog" aria-modal="true" aria-labelledby="password-title">
                <h2 id="password-title">Accès restreint</h2>
                <p>Entrez le mot de passe pour accéder à Connect.H</p>
                <form id="password-form">
                    <input 
                        type="password" 
                        class="password-input" 
                        id="password-input" 
                        placeholder="Mot de passe..."
                        autocomplete="off"
                        aria-describedby="password-error"
                    >
                    <div class="password-error" id="password-error" role="alert" aria-live="polite"></div>
                    <button type="submit" class="password-submit">Accéder</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Focus input
        const input = document.getElementById('password-input');
        const form = document.getElementById('password-form');
        const errorEl = document.getElementById('password-error');
        
        setTimeout(() => input.focus(), 100);
        
        // Handle form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputValue = input.value;
            
            if (verifyPassword(inputValue)) {
                setAuth();
                overlay.remove();
                initializeConnectH();
            } else {
                errorEl.textContent = 'Mot de passe incorrect.';
                input.value = '';
                input.focus();
                
                // Shake animation
                const modal = overlay.querySelector('.password-modal');
                modal.style.animation = 'shake 0.3s ease';
                setTimeout(() => modal.style.animation = '', 300);
            }
        });
        
        // Add shake animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== INITIALIZATION =====

    /**
     * Initialize Connect.H page after authentication
     */
    function initializeConnectH() {
        console.log('🚀 Connect.H initialized');
        
        // Initialize and start audio
        initializeAudio();
        startMainThemeWithFadeIn();
        
        // Setup menu interactions
        setupMenuNavigation();
        
        // Setup keyboard navigation
        setupKeyboardNav();
    }

    /**
     * Setup menu item click handlers
     */
    function setupMenuNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.dataset.action;
                
                switch(action) {
                    case 'resume':
                        handleResumeMission();
                        break;
                    case 'new':
                        handleNewMission();
                        break;
                    case 'settings':
                        handleSettings();
                        break;
                    default:
                        console.log('Unknown action:', action);
                }
            });
        });
    }

    /**
     * Setup keyboard navigation (Tab, Enter, Space)
     */
    function setupKeyboardNav() {
        document.addEventListener('keydown', function(e) {
            // ESC key to go back to main site
            if (e.key === 'Escape') {
                if (confirm('Retourner au site principal ?')) {
                    window.location.href = MAIN_SITE_URL;
                }
            }
        });
    }

    /**
     * Handle "Reprendre mission" click
     */
    function handleResumeMission() {
        console.log('📂 Resume mission clicked');
        
        // Play button hit sound
        playButtonHitSound();
        
        // Fade out main theme then redirect
        fadeOutMainTheme(() => {
            // TODO: Load saved mission state
            // For now, start new mission
            window.location.href = '/connect-h/mission.html';
        });
    }

    /**
     * Handle "Nouvelle mission" click
     */
    function handleNewMission() {
        console.log('🆕 New mission clicked');
        
        // Play button hit sound
        playButtonHitSound();
        
        // Fade out main theme then redirect
        fadeOutMainTheme(() => {
            window.location.href = '/connect-h/mission.html';
        });
    }

    /**
     * Handle "Paramètres" click
     */
    function handleSettings() {
        // TODO: Implement settings logic
        console.log('⚙️ Settings clicked');
        alert('Fonctionnalité "Paramètres" à venir...');
    }

    // ===== MAIN ENTRY POINT =====

    document.addEventListener('DOMContentLoaded', function() {
        // Check if user is authenticated
        if (isAuthenticated()) {
            initializeConnectH();
        } else {
            // Show password modal
            showPasswordModal();
        }
    });

    // Expose some functions globally for debugging/testing
    window.ConnectH = {
        clearAuth: clearAuth,
        isAuthenticated: isAuthenticated,
        stopAudio: stopAllAudio,
        fadeOut: fadeOutMainTheme,
        fadeIn: startMainThemeWithFadeIn
    };

})();
