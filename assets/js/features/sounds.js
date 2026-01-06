// Sound functionality
let sounds = {
    click: null,
    startup: null,
    error: null,
    success: null
};

async function loadSounds() {
    try {
        const soundFiles = {
            click: 'sounds/mouseclick.wav',
            startup: 'sounds/startup.wav',
            error: 'sounds/error.wav', 
            success: 'sounds/success.wav'
        };

        for (const [key, file] of Object.entries(soundFiles)) {
            const audio = new Audio(file);
            audio.preload = 'auto';
            sounds[key] = audio;
        }
    } catch (error) {
        console.warn('Could not load sounds:', error);
    }
}

function playClickSound() {
    if (sounds.click) {
        sounds.click.currentTime = 0;
        sounds.click.play().catch(e => console.warn('Could not play click sound:', e));
    }
}

function playStartupSound() {
    if (sounds.startup) {
        sounds.startup.play().catch(e => console.warn('Could not play startup sound:', e));
    }
}

function playErrorSound() {
    if (sounds.error) {
        sounds.error.currentTime = 0;
        sounds.error.play().catch(e => console.warn('Could not play error sound:', e));
    }
}

function playSuccessSound() {
    if (sounds.success) {
        sounds.success.currentTime = 0;
        sounds.success.play().catch(e => console.warn('Could not play success sound:', e));
    }
}