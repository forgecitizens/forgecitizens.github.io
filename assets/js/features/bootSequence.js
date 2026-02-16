/**
 * Boot Sequence Animation
 * Displays a retro OS boot sequence on first external visit
 */
(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    // Boot sound configuration (plays during boot sequence)
    const BOOT_SOUND_PATH = 'sounds/boot/pcstart.mp3';
    const BOOT_SOUND_ENABLED = true;
    const BOOT_SOUND_VOLUME = 0.5; // Volume from 0 to 1

    // Startup sound configuration (plays after boot sequence ends)
    const STARTUP_SOUND_PATH = 'sounds/boot/forgecitizensOS-startup.mp3';
    const STARTUP_SOUND_ENABLED = true;
    const STARTUP_SOUND_VOLUME = 0.5; // Volume from 0 to 1
    const STARTUP_SOUND_DELAY = 1000; // Delay in ms after boot ends

    // =========================================================================
    // NAVIGATION DETECTION
    // =========================================================================
    
    // Check if user is coming from external source (not internal navigation)
    const referrer = document.referrer;
    const currentHost = window.location.host;
    const isInternalNavigation = referrer && referrer.includes(currentHost);
    const hasSeenBoot = sessionStorage.getItem('forgecitizens_booted');

    // Get overlay element early
    const overlay = document.getElementById('boot-overlay');

    // Skip boot sequence if internal navigation or already seen this session
    // Keep overlay hidden (display:none) for crawlers and returning users
    if (isInternalNavigation || hasSeenBoot) {
        if (overlay) {
            overlay.classList.add('removed');
        }
        return;
    }

    // Show overlay for boot sequence (was hidden by default for SEO)
    if (overlay) {
        overlay.style.display = 'flex';
    }

    // =========================================================================
    // BOOT MESSAGES
    // =========================================================================
    
    const bootMessages = [
        { text: 'FORGECITIZENS BIOS v2.4.1', type: 'header', delay: 250 },
        { text: 'Copyright (C) 2024-2026 ForgeCitizens Labs - created by Andrei Eleodor Sirbu', type: 'info', delay: 400 },
        { text: '', delay: 200 },
        { text: 'Initializing system...', type: 'normal', delay: 600 },
        { text: 'Memory check: 640K OK', type: 'success', delay: 400 },
        { text: 'Extended memory: 32768K OK', type: 'success', delay: 350 },
        { text: '', delay: 200 },
        { text: 'Loading ESPRIT-CRITIQUE.SYS...', type: 'normal', delay: 700 },
        { text: '[OK] Critical thinking module loaded', type: 'success', delay: 400 },
        { text: 'Loading CURIOSITE.DRV...', type: 'normal', delay: 600 },
        { text: '[OK] Curiosity driver initialized', type: 'success', delay: 400 },
        { text: 'Loading DOUTE.EXE...', type: 'normal', delay: 500 },
        { text: '[OK] Healthy skepticism enabled', type: 'success', delay: 400 },
        { text: '', delay: 200 },
        { text: 'Mounting virtual desktop...', type: 'normal', delay: 700 },
        { text: 'Indexing knowledge base...', type: 'normal', delay: 600 },
        { text: '[OK] All systems operational', type: 'success', delay: 400 },
        { text: '', delay: 200 },
        { text: 'Starting FORGECITIZENS.EXE...', type: 'info', delay: 800 },
    ];

    // =========================================================================
    // SOUND HANDLING
    // =========================================================================
    
    let bootSound = null;

    function initBootSound() {
        if (!BOOT_SOUND_ENABLED) return;
        
        try {
            bootSound = new Audio(BOOT_SOUND_PATH);
            bootSound.volume = BOOT_SOUND_VOLUME;
            bootSound.preload = 'auto';
            
            // Handle sound end or errors gracefully
            bootSound.addEventListener('error', function() {
                console.warn('Boot sound could not be loaded:', BOOT_SOUND_PATH);
                bootSound = null;
            });
        } catch (e) {
            console.warn('Audio not supported:', e);
            bootSound = null;
        }
    }

    function playBootSound() {
        if (bootSound) {
            bootSound.play().catch(function(e) {
                // Autoplay might be blocked by browser
                console.warn('Boot sound autoplay blocked:', e);
            });
        }
    }

    function stopBootSound() {
        if (bootSound) {
            bootSound.pause();
            bootSound.currentTime = 0;
        }
    }

    // Startup sound (plays after boot)
    let startupSound = null;

    function initStartupSound() {
        if (!STARTUP_SOUND_ENABLED) return;
        
        try {
            startupSound = new Audio(STARTUP_SOUND_PATH);
            startupSound.volume = STARTUP_SOUND_VOLUME;
            startupSound.preload = 'auto';
            
            startupSound.addEventListener('error', function() {
                console.warn('Startup sound could not be loaded:', STARTUP_SOUND_PATH);
                startupSound = null;
            });
        } catch (e) {
            console.warn('Audio not supported:', e);
            startupSound = null;
        }
    }

    function playStartupSound() {
        if (startupSound) {
            startupSound.play().catch(function(e) {
                console.warn('Startup sound playback failed:', e);
            });
        }
    }

    // =========================================================================
    // BOOT SEQUENCE ANIMATION
    // =========================================================================
    
    const terminal = document.getElementById('boot-terminal');

    if (!terminal || !overlay) {
        // If elements don't exist, mark as booted and exit
        sessionStorage.setItem('forgecitizens_booted', 'true');
        return;
    }

    // Create "Press to start" prompt
    function createStartPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'boot-start-prompt';
        prompt.innerHTML = `
            <div class="start-prompt-text">Cliquez ou appuyez sur une touche pour démarrer</div>
            <div class="start-prompt-text start-prompt-text-en">Click or press a key to start</div>
            <div class="start-prompt-blink">_</div>
        `;
        prompt.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-family: 'Courier New', 'Consolas', monospace;
            color: #c0c0c0;
            cursor: pointer;
        `;
        
        const textStyle = document.createElement('style');
        textStyle.textContent = `
            .start-prompt-text {
                font-size: 16px;
                letter-spacing: 2px;
                margin-bottom: 8px;
            }
            .start-prompt-text-en {
                font-size: 14px;
                opacity: 0.7;
                margin-bottom: 15px;
            }
            .start-prompt-blink {
                font-size: 20px;
                animation: promptBlink 1s infinite;
            }
            @keyframes promptBlink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            @media (max-width: 480px) {
                .start-prompt-text {
                    font-size: 12px;
                    letter-spacing: 1px;
                }
                .start-prompt-text-en {
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(textStyle);
        
        return prompt;
    }

    function displayLine(index) {
        if (index >= bootMessages.length) {
            // Boot sequence complete
            setTimeout(function() {
                sessionStorage.setItem('forgecitizens_booted', 'true');
                stopBootSound();
                overlay.classList.add('hidden');
                
                // Play startup sound after delay
                setTimeout(function() {
                    playStartupSound();
                }, STARTUP_SOUND_DELAY);
                
                setTimeout(function() {
                    overlay.classList.add('removed');
                }, 500);
            }, 400);
            return;
        }

        const msg = bootMessages[index];
        const line = document.createElement('div');
        line.className = 'boot-line';
        if (msg.type && msg.type !== 'normal') {
            line.classList.add(msg.type);
        }
        line.textContent = msg.text;
        terminal.appendChild(line);

        // Auto-scroll to keep latest line visible
        terminal.scrollTop = terminal.scrollHeight;

        setTimeout(function() {
            displayLine(index + 1);
        }, msg.delay);
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    // Initialize sounds
    initBootSound();
    initStartupSound();

    function startBootSequence() {
        // Remove start prompt if it exists
        const prompt = document.getElementById('boot-start-prompt');
        if (prompt) {
            prompt.remove();
        }
        
        // Play sound (now allowed after user interaction)
        playBootSound();
        
        // Start displaying boot lines
        setTimeout(function() {
            displayLine(0);
        }, 200);
    }

    function showStartPrompt() {
        const prompt = createStartPrompt();
        overlay.appendChild(prompt);
        
        // Listen for click or keypress
        function handleStart(e) {
            // Prevent double triggers
            overlay.removeEventListener('click', handleStart);
            document.removeEventListener('keydown', handleStart);
            startBootSequence();
        }
        
        overlay.addEventListener('click', handleStart);
        document.addEventListener('keydown', handleStart);
    }

    // Show start prompt after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            showStartPrompt();
        });
    } else {
        showStartPrompt();
    }

})();
