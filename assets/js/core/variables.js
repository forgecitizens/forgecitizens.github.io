// Global state variables
let draggedModal = null;
let dragOffset = { x: 0, y: 0 };
let resizingModal = null;
let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
let minimizedWindows = [];
let currentContextIcon = null;
let currentDate = new Date();
let calendarDate = new Date();

// Game state
let gameState = {
    isPlaying: false,
    score: 0,
    lives: 3,
    level: 1,
    papers: [],
    spawnRate: 2000,
    gameInterval: null,
    updateInterval: null
};