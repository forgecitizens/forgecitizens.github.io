// --- Système de pause ---
// Empêche le pinch-zoom natif sur mobile (seule la carte doit zoomer)
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Variables globales pour la pause (seront utilisées par l'IIFE)
let isPaused = false;
let pauseStartTimer = null;
let pauseStopTimer = null;

function setPause(state) {
    isPaused = state;
    const rulesOverlay = document.getElementById('rules-modal-overlay');
    if (rulesOverlay) {
        if (state) {
            // Mettre à jour le contenu selon la langue avant d'afficher
            if (typeof updateRulesContent === 'function') {
                updateRulesContent();
            }
            rulesOverlay.classList.add('visible');
        } else {
            rulesOverlay.classList.remove('visible');
        }
    }
    // Remplace le bouton Pause/Play
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = state ? 'Play' : 'Pause';
    // Pause le chrono (utilise les fonctions exposées par l'IIFE)
    if (state && pauseStopTimer) {
        pauseStopTimer();
    } else if (!state && pauseStartTimer) {
        pauseStartTimer();
    }
}

// Ouvre la modale pause/règles avec le bouton Pause
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'pause-btn') {
        setPause(!isPaused);
    }
    if (e.target && e.target.id === 'rules-btn') {
        setPause(true);
    }
    if (e.target && e.target.id === 'rules-close-btn') {
        setPause(false);
    }
});

// Gestion touche espace
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        // Empêcher le scroll par défaut de la touche espace
        e.preventDefault();
        setPause(!isPaused);
    }
});

/**
 * ========================================================================
 * MAPPER GAME - Main JavaScript
 * ========================================================================
 * Jeu de géographie où le joueur doit replacer les noms des pays
 * sur une carte du monde.
 * 
 * @author Andrei Eleodor Sirbu
 * @version 1.0.0
 * 
 * Structure:
 * 1. Configuration
 * 2. État du jeu
 * 3. Initialisation
 * 4. Chargement des ressources
 * 5. Logique du jeu
 * 6. Drag & Drop
 * 7. Interface utilisateur
 * 8. Utilitaires
 */

(function() {
    'use strict';

    /* ========================================================================
       1. CONFIGURATION
       ======================================================================== */
    
    const CONFIG = {
        // Chemins des ressources
        paths: {
            countriesFR: '/assets/mapper-game/countries_FR.json',
            countriesEN: '/assets/mapper-game/countries_EN.json',
            countriesEasyFR: '/assets/mapper-game/countries_easy_mode_FR.json',
            countriesEasyEN: '/assets/mapper-game/countries_easy_mode_EN.json',
            worldSVG: '/assets/mapper-game/world.svg'
        },
        
        // Paramètres du jeu
        game: {
            defaultLanguage: 'FR',
            defaultDifficulty: 'easy', // 'easy' ou 'hard'
            defaultRegion: 'world', // 'world', 'europe', 'africa', etc.
            timerEnabled: true
        },
        
        // Paramètres d'affichage
        display: {
            animationDuration: 300,
            feedbackDuration: 1500, // Durée du feedback rouge/orange
            correctFeedbackDuration: 500 // Durée du flash vert
        },
        
        // Paramètres du zoom
        zoom: {
            min: 0.8,
            max: 5,
            step: 0.2,
            default: 1
        }
    };
    
    /**
     * Carte des frontières terrestres entre pays (codes ISO)
     * Chaque pays liste ses voisins directs avec une frontière terrestre
     */
    const BORDERS = {
        'AF': ['CN', 'IR', 'PK', 'TJ', 'TM', 'UZ'],
        'AL': ['GR', 'ME', 'MK', 'XK'],
        'DZ': ['LY', 'MA', 'MR', 'ML', 'NE', 'TN', 'EH'],
        'AD': ['ES', 'FR'],
        'AO': ['CD', 'CG', 'NA', 'ZM'],
        'AR': ['BO', 'BR', 'CL', 'PY', 'UY'],
        'AM': ['AZ', 'GE', 'IR', 'TR'],
        'AT': ['CH', 'CZ', 'DE', 'HU', 'IT', 'LI', 'SK', 'SI'],
        'AZ': ['AM', 'GE', 'IR', 'RU', 'TR'],
        'BD': ['IN', 'MM'],
        'BY': ['LT', 'LV', 'PL', 'RU', 'UA'],
        'BE': ['DE', 'FR', 'LU', 'NL'],
        'BZ': ['GT', 'MX'],
        'BJ': ['BF', 'NE', 'NG', 'TG'],
        'BT': ['CN', 'IN'],
        'BO': ['AR', 'BR', 'CL', 'PY', 'PE'],
        'BA': ['HR', 'ME', 'RS'],
        'BW': ['NA', 'ZA', 'ZW', 'ZM'],
        'BR': ['AR', 'BO', 'CO', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
        'BN': ['MY'],
        'BG': ['GR', 'MK', 'RO', 'RS', 'TR'],
        'BF': ['BJ', 'CI', 'GH', 'ML', 'NE', 'TG'],
        'BI': ['CD', 'RW', 'TZ'],
        'KH': ['LA', 'TH', 'VN'],
        'CM': ['CF', 'TD', 'CG', 'GQ', 'GA', 'NG'],
        'CA': ['US'],
        'CF': ['CM', 'TD', 'CD', 'CG', 'SS', 'SD'],
        'TD': ['CM', 'CF', 'LY', 'NE', 'NG', 'SD'],
        'CL': ['AR', 'BO', 'PE'],
        'CN': ['AF', 'BT', 'IN', 'KZ', 'KP', 'KG', 'LA', 'MN', 'MM', 'NP', 'PK', 'RU', 'TJ', 'VN'],
        'CO': ['BR', 'EC', 'PA', 'PE', 'VE'],
        'CG': ['AO', 'CM', 'CF', 'CD', 'GA'],
        'CD': ['AO', 'BI', 'CF', 'CG', 'RW', 'SS', 'TZ', 'UG', 'ZM'],
        'CR': ['NI', 'PA'],
        'CI': ['BF', 'GH', 'GN', 'LR', 'ML'],
        'HR': ['BA', 'HU', 'ME', 'RS', 'SI'],
        'CZ': ['AT', 'DE', 'PL', 'SK'],
        'DK': ['DE'],
        'DJ': ['ER', 'ET', 'SO'],
        'DO': ['HT'],
        'EC': ['CO', 'PE'],
        'EG': ['IL', 'LY', 'PS', 'SD'],
        'SV': ['GT', 'HN'],
        'GQ': ['CM', 'GA'],
        'ER': ['DJ', 'ET', 'SD'],
        'EE': ['LV', 'RU'],
        'SZ': ['MZ', 'ZA'],
        'ET': ['DJ', 'ER', 'KE', 'SO', 'SS', 'SD'],
        'FI': ['NO', 'RU', 'SE'],
        'FR': ['AD', 'BE', 'DE', 'IT', 'LU', 'MC', 'ES', 'CH'],
        'GA': ['CM', 'CG', 'GQ'],
        'GM': ['SN'],
        'GE': ['AM', 'AZ', 'RU', 'TR'],
        'DE': ['AT', 'BE', 'CZ', 'DK', 'FR', 'LU', 'NL', 'PL', 'CH'],
        'GH': ['BF', 'CI', 'TG'],
        'GR': ['AL', 'BG', 'MK', 'TR'],
        'GT': ['BZ', 'SV', 'HN', 'MX'],
        'GN': ['CI', 'GW', 'LR', 'ML', 'SN', 'SL'],
        'GW': ['GN', 'SN'],
        'GY': ['BR', 'SR', 'VE'],
        'HT': ['DO'],
        'HN': ['GT', 'NI', 'SV'],
        'HU': ['AT', 'HR', 'RO', 'RS', 'SK', 'SI', 'UA'],
        'IN': ['BD', 'BT', 'CN', 'MM', 'NP', 'PK'],
        'ID': ['MY', 'PG', 'TL'],
        'IR': ['AF', 'AM', 'AZ', 'IQ', 'PK', 'TR', 'TM'],
        'IQ': ['IR', 'JO', 'KW', 'SA', 'SY', 'TR'],
        'IE': ['GB'],
        'IL': ['EG', 'JO', 'LB', 'PS', 'SY'],
        'IT': ['AT', 'FR', 'SM', 'SI', 'CH', 'VA'],
        'JO': ['IQ', 'IL', 'PS', 'SA', 'SY'],
        'KZ': ['CN', 'KG', 'RU', 'TM', 'UZ'],
        'KE': ['ET', 'SO', 'SS', 'TZ', 'UG'],
        'XK': ['AL', 'MK', 'ME', 'RS'],
        'KW': ['IQ', 'SA'],
        'KG': ['CN', 'KZ', 'TJ', 'UZ'],
        'LA': ['KH', 'CN', 'MM', 'TH', 'VN'],
        'LV': ['BY', 'EE', 'LT', 'RU'],
        'LB': ['IL', 'SY'],
        'LS': ['ZA'],
        'LR': ['GN', 'CI', 'SL'],
        'LY': ['DZ', 'TD', 'EG', 'NE', 'SD', 'TN'],
        'LI': ['AT', 'CH'],
        'LT': ['BY', 'LV', 'PL', 'RU'],
        'LU': ['BE', 'DE', 'FR'],
        'MK': ['AL', 'BG', 'GR', 'XK', 'RS'],
        'MW': ['MZ', 'TZ', 'ZM'],
        'MY': ['BN', 'ID', 'TH'],
        'ML': ['DZ', 'BF', 'CI', 'GN', 'MR', 'NE', 'SN'],
        'MR': ['DZ', 'ML', 'SN', 'EH'],
        'MX': ['BZ', 'GT', 'US'],
        'MD': ['RO', 'UA'],
        'MC': ['FR'],
        'MN': ['CN', 'RU'],
        'ME': ['AL', 'BA', 'HR', 'XK', 'RS'],
        'MA': ['DZ', 'EH', 'ES'],
        'MZ': ['SZ', 'MW', 'ZA', 'TZ', 'ZM', 'ZW'],
        'MM': ['BD', 'CN', 'IN', 'LA', 'TH'],
        'NA': ['AO', 'BW', 'ZA', 'ZM'],
        'NP': ['CN', 'IN'],
        'NL': ['BE', 'DE'],
        'NI': ['CR', 'HN'],
        'NE': ['DZ', 'BJ', 'BF', 'TD', 'LY', 'ML', 'NG'],
        'NG': ['BJ', 'CM', 'TD', 'NE'],
        'KP': ['CN', 'KR', 'RU'],
        'NO': ['FI', 'RU', 'SE'],
        'OM': ['SA', 'AE', 'YE'],
        'PK': ['AF', 'CN', 'IN', 'IR'],
        'PS': ['EG', 'IL', 'JO'],
        'PA': ['CO', 'CR'],
        'PG': ['ID'],
        'PY': ['AR', 'BO', 'BR'],
        'PE': ['BO', 'BR', 'CL', 'CO', 'EC'],
        'PL': ['BY', 'CZ', 'DE', 'LT', 'RU', 'SK', 'UA'],
        'PT': ['ES'],
        'QA': ['SA'],
        'RO': ['BG', 'HU', 'MD', 'RS', 'UA'],
        'RU': ['AZ', 'BY', 'CN', 'EE', 'FI', 'GE', 'KZ', 'KP', 'LV', 'LT', 'MN', 'NO', 'PL', 'UA'],
        'RW': ['BI', 'CD', 'TZ', 'UG'],
        'SA': ['IQ', 'JO', 'KW', 'OM', 'QA', 'AE', 'YE'],
        'SN': ['GM', 'GN', 'GW', 'ML', 'MR'],
        'RS': ['BA', 'BG', 'HR', 'HU', 'XK', 'MK', 'ME', 'RO'],
        'SL': ['GN', 'LR'],
        'SK': ['AT', 'CZ', 'HU', 'PL', 'UA'],
        'SI': ['AT', 'HR', 'HU', 'IT'],
        'SO': ['DJ', 'ET', 'KE'],
        'ZA': ['BW', 'LS', 'MZ', 'NA', 'SZ', 'ZW'],
        'KR': ['KP'],
        'SS': ['CF', 'CD', 'ET', 'KE', 'SD', 'UG'],
        'ES': ['AD', 'FR', 'MA', 'PT'],
        'SD': ['CF', 'TD', 'EG', 'ER', 'ET', 'LY', 'SS'],
        'SR': ['BR', 'GF', 'GY'],
        'SE': ['FI', 'NO'],
        'CH': ['AT', 'FR', 'DE', 'IT', 'LI'],
        'SY': ['IQ', 'IL', 'JO', 'LB', 'TR'],
        'TJ': ['AF', 'CN', 'KG', 'UZ'],
        'TZ': ['BI', 'CD', 'KE', 'MW', 'MZ', 'RW', 'UG', 'ZM'],
        'TH': ['KH', 'LA', 'MY', 'MM'],
        'TL': ['ID'],
        'TG': ['BJ', 'BF', 'GH'],
        'TN': ['DZ', 'LY'],
        'TR': ['AM', 'AZ', 'BG', 'GE', 'GR', 'IR', 'IQ', 'SY'],
        'TM': ['AF', 'IR', 'KZ', 'UZ'],
        'UG': ['CD', 'KE', 'RW', 'SS', 'TZ'],
        'UA': ['BY', 'HU', 'MD', 'PL', 'RO', 'RU', 'SK'],
        'AE': ['OM', 'SA'],
        'GB': ['IE'],
        'US': ['CA', 'MX'],
        'UY': ['AR', 'BR'],
        'UZ': ['AF', 'KZ', 'KG', 'TJ', 'TM'],
        'VA': ['IT'],
        'VE': ['BR', 'CO', 'GY'],
        'VN': ['KH', 'CN', 'LA'],
        'EH': ['DZ', 'MR', 'MA'],
        'YE': ['OM', 'SA'],
        'ZM': ['AO', 'BW', 'CD', 'MW', 'MZ', 'NA', 'TZ', 'ZW'],
        'ZW': ['BW', 'MZ', 'ZA', 'ZM'],
        'GF': ['BR', 'SR']
    };

    /* ========================================================================
       2. ÉTAT DU JEU
       ======================================================================== */
    
    const GameState = {
        // Données chargées
        countries: null,
        svgDocument: null,
        
        // État actuel
        currentLanguage: CONFIG.game.defaultLanguage,
        currentDifficulty: CONFIG.game.defaultDifficulty,
        currentRegion: CONFIG.game.defaultRegion,
        isPlaying: false,
        isPaused: false,
        
        // Statistiques de la partie
        stats: {
            startTime: null,
            elapsedTime: 0,
            correctCount: 0,
            wrongCount: 0,
            totalCountries: 0
        },
        
        // Labels en jeu
        remainingLabels: [],
        placedLabels: [],
        
        // Timer
        timerInterval: null,
        
        // Zoom & Pan
        zoom: {
            scale: 1,
            isPanning: false,
            startX: 0,
            startY: 0,
            scrollLeft: 0,
            scrollTop: 0
        },
        
        // Sélection de labels (nouveau système clic)
        selectedLabels: [], // Labels actuellement sélectionnés (max 3)
        
        // GEO-COMBO tracking
        geoCombo: {
            active: false,          // True si tous les 3 labels sont sélectionnés
            consecutiveCorrect: 0,  // Nombre de placements corrects consécutifs
            comboLabels: []         // Les codes des labels du combo en cours
        },
        
        // Compteur d'erreurs consécutives (pour auto-shuffle)
        consecutiveErrors: 0,
        
        // Timer d'inactivité (pour effet shake du bouton shuffle)
        inactivityTimer: null
    };

    /* ========================================================================
       3. INITIALISATION
       ======================================================================== */
    
    /**
     * Point d'entrée principal - Initialise le jeu
     */
    function init() {
        console.log('🗺️ Mapper: Initialisation...');
        
        // Vérifier que le DOM est prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDOMReady);
        } else {
            onDOMReady();
        }
    }

    /**
     * Appelé quand le DOM est prêt
     */
    function onDOMReady() {
        console.log('🗺️ Mapper: DOM prêt');
        
        // Initialiser les éléments de l'interface
        initUI();
        
        // Afficher la modale de sélection de langue
        showLanguageModal();
    }

    /**
     * Initialise les éléments de l'interface utilisateur
     */
    function initUI() {
        console.log('🗺️ Mapper: Initialisation UI...');
        
        // Récupérer les éléments du DOM
        const elements = {
            gameContainer: document.getElementById('game-container'),
            mapContainer: document.getElementById('map-container'),
            labelsContainer: document.getElementById('labels-container'),
            labelsPool: document.getElementById('labels-pool'),
            placeholder: document.getElementById('placeholder'),
            statusTime: document.getElementById('status-time'),
            statusScore: document.getElementById('status-score'),
            statusMessage: document.getElementById('status-message'),
            btnNewGame: document.getElementById('btn-new-game'),
            btnRegionWorld: document.getElementById('btn-region-world'),
            btnRegionEurope: document.getElementById('btn-region-europe'),
            btnLangFR: document.getElementById('btn-lang-fr'),
            btnLangEN: document.getElementById('btn-lang-en'),
            // Modale de langue
            languageModalOverlay: document.getElementById('language-modal-overlay'),
            flagFR: document.getElementById('flag-fr'),
            flagEN: document.getElementById('flag-en'),
            // Modale de difficulté
            difficultyModalOverlay: document.getElementById('difficulty-modal-overlay'),
            difficultyExplorer: document.getElementById('difficulty-explorer'),
            difficultyEasy: document.getElementById('difficulty-easy'),
            difficultyHard: document.getElementById('difficulty-hard'),
            // Modale de fin de partie
            endgameModalOverlay: document.getElementById('endgame-modal-overlay'),
            endgameScore: document.getElementById('endgame-score'),
            endgameTime: document.getElementById('endgame-time'),
            endgameErrors: document.getElementById('endgame-errors'),
            endgameRestart: document.getElementById('endgame-restart'),
            endgameChangeDifficulty: document.getElementById('endgame-change-difficulty')
        };
        
        // Stocker les références
        GameState.elements = elements;
        
        // Attacher les événements aux boutons de la toolbar
        if (elements.btnNewGame) {
            elements.btnNewGame.addEventListener('click', startNewGame);
        }
        
        if (elements.btnRegionWorld) {
            elements.btnRegionWorld.addEventListener('click', () => setRegion('world'));
        }
        
        if (elements.btnRegionEurope) {
            elements.btnRegionEurope.addEventListener('click', () => setRegion('europe'));
        }
        
        if (elements.btnLangFR) {
            elements.btnLangFR.addEventListener('click', () => setLanguage('FR'));
        }
        
        if (elements.btnLangEN) {
            elements.btnLangEN.addEventListener('click', () => setLanguage('EN'));
        }
        
        // Attacher les événements aux drapeaux de la modale
        if (elements.flagFR) {
            elements.flagFR.addEventListener('click', () => selectLanguage('FR'));
        }
        
        if (elements.flagEN) {
            elements.flagEN.addEventListener('click', () => selectLanguage('EN'));
        }
        
        // Attacher les événements aux boutons de difficulté
        if (elements.difficultyExplorer) {
            elements.difficultyExplorer.addEventListener('click', () => selectDifficulty('explorer'));
        }
        
        if (elements.difficultyEasy) {
            elements.difficultyEasy.addEventListener('click', () => selectDifficulty('easy'));
        }
        
        if (elements.difficultyHard) {
            elements.difficultyHard.addEventListener('click', () => selectDifficulty('hard'));
        }
        
        // Attacher les événements à la modale de fin de partie
        if (elements.endgameRestart) {
            elements.endgameRestart.addEventListener('click', handleEndgameRestart);
        }
        
        if (elements.endgameChangeDifficulty) {
            elements.endgameChangeDifficulty.addEventListener('click', handleEndgameChangeDifficulty);
        }
        
        // Initialiser la modale des crédits
        initCreditsModal();
        
        // Initialiser la modale des règles (pause)
        initRulesModal();
        
        // Initialiser la modale des mises à jour
        initUpdatesModal();
        
        // Initialiser le menu Options
        initOptionsMenu();
        
        console.log('✅ Mapper: UI initialisée');
    }
    
    /**
     * Initialise le menu Options avec le dark mode
     */
    function initOptionsMenu() {
        const toggleDarkMode = document.getElementById('toggle-dark-mode');
        const darkModeCheck = document.getElementById('dark-mode-check');
        const gameContainer = document.getElementById('game-container');
        const mapContainer = document.getElementById('map-container');
        
        // Charger l'état du dark mode depuis le localStorage
        const isDarkMode = localStorage.getItem('mapper-dark-mode') === 'true';
        if (isDarkMode) {
            enableDarkMode();
        }
        
        if (toggleDarkMode) {
            toggleDarkMode.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCurrentlyDark = document.body.classList.contains('dark-mode');
                
                if (isCurrentlyDark) {
                    disableDarkMode();
                } else {
                    enableDarkMode();
                }
            });
        }
        
        function enableDarkMode() {
            document.body.classList.add('dark-mode');
            if (gameContainer) gameContainer.classList.add('dark-mode');
            if (mapContainer) mapContainer.classList.add('dark-mode');
            if (darkModeCheck) darkModeCheck.textContent = '☑';
            localStorage.setItem('mapper-dark-mode', 'true');
            console.log('🌙 Mode sombre activé');
        }
        
        function disableDarkMode() {
            document.body.classList.remove('dark-mode');
            if (gameContainer) gameContainer.classList.remove('dark-mode');
            if (mapContainer) mapContainer.classList.remove('dark-mode');
            if (darkModeCheck) darkModeCheck.textContent = '☐';
            localStorage.setItem('mapper-dark-mode', 'false');
            console.log('☀️ Mode clair activé');
        }
        
        // Fermer le menu dropdown quand on clique ailleurs
        document.addEventListener('click', (e) => {
            const optionsBtn = document.getElementById('btn-options');
            if (optionsBtn && !optionsBtn.contains(e.target)) {
                optionsBtn.classList.remove('menu-open');
            }
        });
    }
    
    /**
     * Initialise la modale des règles (pause)
     */
    function initRulesModal() {
        const rulesOverlay = document.getElementById('rules-modal-overlay');
        
        // Peupler le contenu des règles (sera mis à jour selon la langue)
        updateRulesContent();
        
        // Fermer avec Escape
        if (rulesOverlay) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && rulesOverlay.classList.contains('visible')) {
                    setPause(false);
                }
            });
            
            // Fermer en cliquant sur l'overlay
            rulesOverlay.addEventListener('click', (e) => {
                if (e.target === rulesOverlay) {
                    setPause(false);
                }
            });
        }
    }
    
    /**
     * Met à jour le contenu de la modale des règles selon la langue
     */
    function updateRulesContent() {
        const rulesContent = document.getElementById('rules-content');
        const rulesTitle = document.getElementById('rules-modal-title');
        const lang = GameState.currentLanguage || 'FR';
        
        if (rulesTitle) {
            rulesTitle.textContent = lang === 'FR' ? 'Règles du jeu' : 'Game Rules';
        }
        
        if (rulesContent) {
            if (lang === 'FR') {
                rulesContent.innerHTML = `
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/target.png" alt="" class="rules-icon"> Objectif</h3>
                        <p>Le jeu vous propose trois noms de pays et vous devez correctement les placer sur la carte. Plus le pays est difficile à trouver plus vous gagnez de points.</p>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/gamepad.png" alt="" class="rules-icon"> Comment jouer</h3>
                        <ul>
                            <li>Sélectionnez un ou plusieurs pays sur les trois proposés par le jeu</li>
                            <li>Placez-les correctement sur la carte du monde</li>
                            <li>Si la réponse est correcte, le pays se colore en <span style="color:#228B22">vert</span></li>
                            <li>Si la réponse est incorrecte, le pays se colore en <span style="color:#CC0000">rouge</span></li>
                            <li>Un pays s'affiche en <span style="color:#CC7000">orange</span> si le pays que vous devez trouver dispose d'une frontière terrestre avec celui-ci</li>
                        </ul>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/summer.png" alt="" class="rules-icon"> GEO-COMBO !</h3>
                        <ul>
                            <li>Vous passez automatiquement en mode GEO-COMBO si vous sélectionnez les trois étiquettes proposées par le jeu.</li>
                            <li>Placez les trois étiquettes sans faire d'erreur pour obtenir <strong>30 secondes au chrono</strong> et un <strong>bonus de points</strong>.</li>
                        </ul>
                        <p><strong>Attention !</strong> Une seule erreur pendant le mode GEO-COMBO annule le combo.</p>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/person.png" alt="" class="rules-icon"> Système de points</h3>
                        <ul>
                            <li><span style="color:#228B22">+1</span> : si vous trouvez un pays facile à identifier sur la carte</li>
                            <li><span style="color:#CC7000">+3</span> : si vous trouvez un pays plutôt difficile à identifier sur la carte</li>
                            <li><span style="color:#9932CC">+5</span> : si vous trouvez un pays difficile à identifier sur la carte</li>
                            <li><span style="color:#CC0000">+9</span> : si vous trouvez un pays difficile à identifier sur la carte ET que vous êtes en mode GEO-COMBO</li>
                        </ul>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/keyboard.png" alt="" class="rules-icon"> Touches & raccourcis</h3>
                        <p><strong>PC/Ordinateur :</strong></p>
                        <ul>
                            <li><strong>Espace</strong> : Pause / Reprendre / Règles du jeu</li>
                            <li><strong>Clic gauche (maintenir)</strong> : Déplacer la carte</li>
                            <li><strong>Molette Haut/Bas</strong> : Zoom sur la carte</li>
                            <li><strong>Échap</strong> : Fermer la fenêtre affichée</li>
                        </ul>
                    </div>
                `;
            } else {
                rulesContent.innerHTML = `
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/target.png" alt="" class="rules-icon"> Objective</h3>
                        <p>The game offers you three country names and you must correctly place them on the map. The harder the country is to find, the more points you earn.</p>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/gamepad.png" alt="" class="rules-icon"> How to play</h3>
                        <ul>
                            <li>Select one or more countries from the three offered by the game</li>
                            <li>Place them correctly on the world map</li>
                            <li>If the answer is correct, the country turns <span style="color:#228B22">green</span></li>
                            <li>If the answer is incorrect, the country turns <span style="color:#CC0000">red</span></li>
                            <li>A country appears in <span style="color:#CC7000">orange</span> if the country you need to find shares a land border with it</li>
                        </ul>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/summer.png" alt="" class="rules-icon"> GEO-COMBO!</h3>
                        <ul>
                            <li>You automatically enter GEO-COMBO mode if you select all three labels offered by the game.</li>
                            <li>Place all three labels without making an error to get <strong>30 seconds on the timer</strong> and a <strong>point bonus</strong>.</li>
                        </ul>
                        <p><strong>Warning!</strong> A single error during GEO-COMBO mode cancels the combo.</p>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/person.png" alt="" class="rules-icon"> Point system</h3>
                        <ul>
                            <li><span style="color:#228B22">+1</span>: if you find a country that is easy to identify on the map</li>
                            <li><span style="color:#CC7000">+3</span>: if you find a country that is somewhat difficult to identify on the map</li>
                            <li><span style="color:#9932CC">+5</span>: if you find a country that is difficult to identify on the map</li>
                            <li><span style="color:#CC0000">+9</span>: if you find a difficult country AND you are in GEO-COMBO mode</li>
                        </ul>
                    </div>
                    
                    <div class="rules-section">
                        <h3><img src="/assets/mapper-game/keyboard.png" alt="" class="rules-icon"> Keys & shortcuts</h3>
                        <p><strong>PC/Computer:</strong></p>
                        <ul>
                            <li><strong>Space</strong>: Pause / Resume / Game rules</li>
                            <li><strong>Left click (hold)</strong>: Move the map</li>
                            <li><strong>Scroll Up/Down</strong>: Zoom on the map</li>
                            <li><strong>Escape</strong>: Close the displayed window</li>
                        </ul>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Initialise la modale des crédits
     */
    function initCreditsModal() {
        const btnCredits = document.getElementById('btn-credits');
        const creditsToolbarBtn = document.getElementById('credits-toolbar-btn');
        const creditsOverlay = document.getElementById('credits-modal-overlay');
        const creditsCloseBtn = document.getElementById('credits-close-btn');
        
        // Ouvrir la modale depuis le menu "Crédits"
        if (btnCredits && creditsOverlay) {
            btnCredits.addEventListener('click', () => {
                showCreditsModal();
            });
        }
        
        // Ouvrir la modale depuis le bouton toolbar "Crédits"
        if (creditsToolbarBtn && creditsOverlay) {
            creditsToolbarBtn.addEventListener('click', () => {
                showCreditsModal();
            });
        }
        
        if (creditsOverlay) {
            // Fermer via le bouton X
            if (creditsCloseBtn) {
                creditsCloseBtn.addEventListener('click', () => {
                    hideCreditsModal();
                });
            }
            
            // Fermer en cliquant sur l'overlay (en dehors de la modale)
            creditsOverlay.addEventListener('click', (e) => {
                if (e.target === creditsOverlay) {
                    hideCreditsModal();
                }
            });
            
            // Fermer avec la touche Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && creditsOverlay.classList.contains('visible')) {
                    hideCreditsModal();
                }
            });
        }
    }
    
    /**
     * Affiche la modale des crédits
     */
    function showCreditsModal() {
        const creditsOverlay = document.getElementById('credits-modal-overlay');
        const creditsTitle = document.getElementById('credits-modal-title');
        const creditsToolbarBtn = document.getElementById('credits-toolbar-btn');
        
        // Mettre à jour le titre selon la langue
        if (creditsTitle) {
            creditsTitle.textContent = GameState.currentLanguage === 'FR' ? 'Crédits' : 'Credits';
        }
        
        // Mettre à jour le texte du bouton toolbar selon la langue
        if (creditsToolbarBtn) {
            creditsToolbarBtn.textContent = GameState.currentLanguage === 'FR' ? 'Crédits' : 'Credits';
        }
        
        if (creditsOverlay) {
            creditsOverlay.classList.add('visible');
            // Arrêter le son GEO-COMBO si actif
            if (GameState.geoCombo.active) {
                stopComboReadySound();
            }
        }
    }
    
    /**
     * Cache la modale des crédits
     */
    function hideCreditsModal() {
        const creditsOverlay = document.getElementById('credits-modal-overlay');
        if (creditsOverlay) {
            creditsOverlay.classList.remove('visible');
            // Reprendre le son GEO-COMBO si le combo est actif
            if (GameState.geoCombo.active) {
                playComboReadySound();
            }
        }
    }

    /**
     * Initialise la modale des mises à jour
     */
    function initUpdatesModal() {
        const updatesToolbarBtn = document.getElementById('updates-toolbar-btn');
        const updatesOverlay = document.getElementById('updates-modal-overlay');
        const updatesCloseBtn = document.getElementById('updates-close-btn');
        
        // Ouvrir la modale depuis le bouton toolbar "Mises à jour"
        if (updatesToolbarBtn && updatesOverlay) {
            updatesToolbarBtn.addEventListener('click', () => {
                showUpdatesModal();
            });
        }
        
        if (updatesOverlay) {
            // Fermer via le bouton X
            if (updatesCloseBtn) {
                updatesCloseBtn.addEventListener('click', () => {
                    hideUpdatesModal();
                });
            }
            
            // Fermer en cliquant sur l'overlay (en dehors de la modale)
            updatesOverlay.addEventListener('click', (e) => {
                if (e.target === updatesOverlay) {
                    hideUpdatesModal();
                }
            });
            
            // Fermer avec la touche Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && updatesOverlay.classList.contains('visible')) {
                    hideUpdatesModal();
                }
            });
        }
    }
    
    /**
     * Affiche la modale des mises à jour
     */
    function showUpdatesModal() {
        const updatesOverlay = document.getElementById('updates-modal-overlay');
        const updatesTitle = document.getElementById('updates-modal-title');
        const updatesToolbarBtn = document.getElementById('updates-toolbar-btn');
        
        // Mettre à jour le titre selon la langue
        if (updatesTitle) {
            updatesTitle.textContent = GameState.currentLanguage === 'FR' ? 'Mises à jour' : 'Updates';
        }
        
        // Mettre à jour le texte du bouton toolbar selon la langue
        if (updatesToolbarBtn) {
            updatesToolbarBtn.textContent = GameState.currentLanguage === 'FR' ? 'Mises à jour' : 'Updates';
        }
        
        // Mettre à jour le contenu selon la langue
        updateUpdatesContent();
        
        if (updatesOverlay) {
            updatesOverlay.classList.add('visible');
            // Arrêter le son GEO-COMBO si actif
            if (GameState.geoCombo.active) {
                stopComboReadySound();
            }
        }
    }
    
    /**
     * Met à jour le contenu de la modale des mises à jour selon la langue
     */
    function updateUpdatesContent() {
        const lang = GameState.currentLanguage;
        
        const updates = {
            'update-1': {
                FR: "La carte est maintenant centrée sur l'Afrique/Europe au démarrage d'une partie, au lieu de l'Océan Pacifique.",
                EN: "The map is now centered on Africa/Europe when starting a game, instead of the Pacific Ocean."
            },
            'update-2': {
                FR: "Ajout d'un niveau de dézoom supplémentaire (+20%) pour une meilleure vue d'ensemble.",
                EN: "Added an additional zoom-out level (+20%) for a better overview."
            },
            'update-3': {
                FR: "L'animation du score lors d'une réponse correcte est plus lente et plus visible, notamment sur mobile.",
                EN: "The score animation when a correct answer is given is slower and more visible, especially on mobile."
            }
        };
        
        for (const [id, texts] of Object.entries(updates)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = texts[lang] || texts.FR;
            }
        }
    }
    
    /**
     * Cache la modale des mises à jour
     */
    function hideUpdatesModal() {
        const updatesOverlay = document.getElementById('updates-modal-overlay');
        if (updatesOverlay) {
            updatesOverlay.classList.remove('visible');
            // Reprendre le son GEO-COMBO si le combo est actif
            if (GameState.geoCombo.active) {
                playComboReadySound();
            }
        }
    }

    /* ========================================================================
       4. CHARGEMENT DES RESSOURCES
       ======================================================================== */

    /**
     * Charge un fichier JSON
     * @param {string} url - URL du fichier JSON
     * @returns {Promise<Object>}
     */
    async function loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Impossible de charger ${url}`);
        }
        return response.json();
    }

    /**
     * Charge un fichier SVG
     * @param {string} url - URL du fichier SVG
     * @returns {Promise<string>}
     */
    async function loadSVG(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Impossible de charger ${url}`);
        }
        return response.text();
    }

    /* ========================================================================
       5. LOGIQUE DU JEU
       ======================================================================== */
    
    /**
     * Démarre une nouvelle partie
     */
    function startNewGame() {
        console.log('🗺️ Mapper: Nouvelle partie...');
        
        // Réinitialiser l'état
        GameState.isPlaying = true;
        GameState.isPaused = false;
        GameState.stats = {
            startTime: Date.now(),
            elapsedTime: 0,
            correctCount: 0,
            wrongCount: 0,
            totalCountries: 0
        };
        GameState.remainingLabels = [];
        GameState.placedLabels = [];
        
        // Réinitialiser la sélection et le GEO-COMBO
        GameState.selectedLabels = [];
        resetGeoCombo();
        
        // Réinitialiser le zoom
        resetZoom();
        
        // Démarrer les animations d'avion
        startPlaneAnimations();
        
        // Démarrer le timer d'inactivité
        resetInactivityTimer();
        
        // Mettre à jour l'interface
        updateGameState('playing');
        
        console.log('🎮 Mapper: Partie démarrée !');
    }
    
    /**
     * Réinitialise le zoom à 100% et centre la carte sur l'Afrique/Europe
     */
    function resetZoom() {
        const mapContainer = GameState.elements?.mapContainer;
        const svg = mapContainer?.querySelector('svg');
        
        if (svg && GameState.zoom) {
            GameState.zoom.scale = CONFIG.zoom.default;
            svg.style.transform = `scale(${CONFIG.zoom.default})`;
            svg.style.transformOrigin = '0 0';
            
            // Centrer la carte sur l'Afrique/Europe au lieu du Pacifique
            // Le SVG fait 2000x857, l'Afrique est environ à 50% horizontal et 40% vertical
            const svgWidth = svg.getBoundingClientRect().width / GameState.zoom.scale || 2000;
            const svgHeight = svg.getBoundingClientRect().height / GameState.zoom.scale || 857;
            const containerWidth = mapContainer.clientWidth;
            const containerHeight = mapContainer.clientHeight;
            
            // Position de l'Afrique dans le SVG (environ 50% X, 40% Y pour être centré sur l'Afrique/Europe)
            const africaCenterX = svgWidth * 0.50;
            const africaCenterY = svgHeight * 0.40;
            
            // Calculer le scroll pour centrer l'Afrique dans la vue
            const targetScrollLeft = (africaCenterX * GameState.zoom.scale) - (containerWidth / 2);
            const targetScrollTop = (africaCenterY * GameState.zoom.scale) - (containerHeight / 2);
            
            // Appliquer le scroll (avec des valeurs minimales de 0)
            mapContainer.scrollLeft = Math.max(0, targetScrollLeft);
            mapContainer.scrollTop = Math.max(0, targetScrollTop);
        }
    }

    /**
     * Met en pause/reprend la partie
     */
    function togglePause() {
        if (!GameState.isPlaying) return;
        
        GameState.isPaused = !GameState.isPaused;
        
        if (GameState.isPaused) {
            stopTimer();
            stopInactivityTimer();
            updateGameState('paused');
        } else {
            startTimer();
            resetInactivityTimer();
            updateGameState('playing');
        }
    }

    /**
     * Termine la partie
     */
    function endGame() {
        console.log('🗺️ Mapper: Fin de partie');
        
        GameState.isPlaying = false;
        stopTimer();
        stopInactivityTimer();
        stopPlaneAnimations();
        updateGameState('finished');
        
        // Afficher le score final
        const stats = GameState.stats;
        console.log(`📊 Score: ${stats.correctCount}/${stats.totalCountries}`);
        console.log(`⏱️ Temps: ${formatTime(stats.elapsedTime)}`);
        
        // Afficher la modale de fin de partie
        showEndgameModal();
    }
    
    /**
     * Affiche la modale de fin de partie
     */
    function showEndgameModal() {
        const lang = GameState.currentLanguage;
        const stats = GameState.stats;
        
        // Mettre à jour les textes selon la langue
        const titleTextEl = document.getElementById('endgame-title-text');
        const scoreLabelEl = document.getElementById('endgame-score-label');
        const timeLabelEl = document.getElementById('endgame-time-label');
        const errorsLabelEl = document.getElementById('endgame-errors-label');
        const restartTextEl = document.getElementById('endgame-restart-text');
        const difficultyTextEl = document.getElementById('endgame-difficulty-text');
        
        if (titleTextEl) {
            titleTextEl.textContent = lang === 'FR' ? 'Partie terminée !' : 'Game Over!';
        }
        if (scoreLabelEl) {
            scoreLabelEl.textContent = lang === 'FR' ? 'Score' : 'Score';
        }
        if (timeLabelEl) {
            timeLabelEl.textContent = lang === 'FR' ? 'Temps' : 'Time';
        }
        if (errorsLabelEl) {
            errorsLabelEl.textContent = lang === 'FR' ? 'Erreurs' : 'Errors';
        }
        if (restartTextEl) {
            restartTextEl.textContent = lang === 'FR' ? 'Recommencer' : 'Play Again';
        }
        if (difficultyTextEl) {
            difficultyTextEl.textContent = lang === 'FR' ? 'Changer de difficulté' : 'Change Difficulty';
        }
        
        // Mettre à jour les valeurs
        const scoreEl = GameState.elements?.endgameScore;
        const timeEl = GameState.elements?.endgameTime;
        const errorsEl = GameState.elements?.endgameErrors;
        
        if (scoreEl) {
            scoreEl.textContent = `${stats.correctCount}`;
        }
        if (timeEl) {
            timeEl.textContent = formatTime(stats.elapsedTime);
        }
        if (errorsEl) {
            errorsEl.textContent = stats.wrongCount.toString();
        }
        
        // Afficher la modale
        const overlay = GameState.elements?.endgameModalOverlay;
        if (overlay) {
            overlay.classList.add('visible');
            
            // Jouer le son de fin de partie
            playEndgameSound();
            
            // Lancer l'animation de confettis
            startConfettiAnimation(overlay);
        }
    }
    
    /**
     * Joue le son de fin de partie
     */
    function playEndgameSound() {
        try {
            const endgameSound = new Audio('/sounds/mapper%20sounds/end_game.mp3');
            endgameSound.volume = 0.6;
            endgameSound.play().catch(err => {
                console.warn('⚠️ Impossible de jouer le son de fin de partie:', err);
            });
            console.log('🎵 Son de fin de partie joué');
        } catch (err) {
            console.warn('⚠️ Erreur audio fin de partie:', err);
        }
    }
    
    /**
     * Lance l'animation de confettis
     * @param {HTMLElement} container - Le conteneur où afficher les confettis
     */
    function startConfettiAnimation(container) {
        const confettiImages = [
            '/assets/mapper-game/confettis.png',
            '/assets/mapper-game/confettis_A.png'
        ];
        
        const confettiCount = 30; // Nombre de confettis
        const duration = 4000; // Durée de l'animation en ms
        
        // Créer un conteneur pour les confettis
        let confettiContainer = container.querySelector('.confetti-container');
        if (!confettiContainer) {
            confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            confettiContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
                z-index: 1000;
            `;
            container.appendChild(confettiContainer);
        } else {
            // Vider les confettis précédents
            confettiContainer.innerHTML = '';
        }
        
        // Générer les confettis avec un délai aléatoire
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                createConfetti(confettiContainer, confettiImages, duration);
            }, Math.random() * 1500); // Étaler sur 1.5 secondes
        }
        
        // Nettoyer le conteneur après la fin des animations
        setTimeout(() => {
            if (confettiContainer && confettiContainer.parentNode) {
                confettiContainer.innerHTML = '';
            }
        }, duration + 2000);
    }
    
    /**
     * Crée un confetti individuel
     * @param {HTMLElement} container - Le conteneur des confettis
     * @param {string[]} images - Les images de confettis disponibles
     * @param {number} duration - Durée de l'animation
     */
    function createConfetti(container, images, duration) {
        const confetti = document.createElement('img');
        
        // Choisir une image aléatoirement
        confetti.src = images[Math.floor(Math.random() * images.length)];
        confetti.className = 'confetti-piece';
        
        // Position horizontale aléatoire
        const startX = Math.random() * 100;
        
        // Taille aléatoire (entre 20px et 40px)
        const size = 20 + Math.random() * 20;
        
        // Déterminer si ce confetti doit tourner
        const shouldRotate = Math.random() > 0.4; // 60% de chance de rotation
        const rotationSpeed = shouldRotate ? (1 + Math.random() * 3) : 0; // Vitesse de rotation
        const rotationDirection = Math.random() > 0.5 ? 1 : -1; // Sens de rotation
        
        // Décalage horizontal pendant la chute (effet de flottement)
        const horizontalDrift = (Math.random() - 0.5) * 30;
        
        // Durée individuelle (variation autour de la durée de base)
        const individualDuration = duration * (0.7 + Math.random() * 0.6);
        
        confetti.style.cssText = `
            position: absolute;
            top: -50px;
            left: ${startX}%;
            width: ${size}px;
            height: ${size}px;
            object-fit: contain;
            pointer-events: none;
            z-index: 1001;
        `;
        
        container.appendChild(confetti);
        
        // Animation de chute avec keyframes
        const keyframes = shouldRotate ? [
            { 
                transform: `translateY(0) translateX(0) rotate(0deg)`, 
                opacity: 1 
            },
            { 
                transform: `translateY(25vh) translateX(${horizontalDrift * 0.3}px) rotate(${rotationDirection * rotationSpeed * 120}deg)`, 
                opacity: 1,
                offset: 0.25
            },
            { 
                transform: `translateY(50vh) translateX(${horizontalDrift * 0.6}px) rotate(${rotationDirection * rotationSpeed * 240}deg)`, 
                opacity: 1,
                offset: 0.5
            },
            { 
                transform: `translateY(75vh) translateX(${horizontalDrift * 0.9}px) rotate(${rotationDirection * rotationSpeed * 360}deg)`, 
                opacity: 0.8,
                offset: 0.75
            },
            { 
                transform: `translateY(100vh) translateX(${horizontalDrift}px) rotate(${rotationDirection * rotationSpeed * 480}deg)`, 
                opacity: 0 
            }
        ] : [
            { 
                transform: `translateY(0) translateX(0)`, 
                opacity: 1 
            },
            { 
                transform: `translateY(50vh) translateX(${horizontalDrift * 0.5}px)`, 
                opacity: 1,
                offset: 0.5
            },
            { 
                transform: `translateY(100vh) translateX(${horizontalDrift}px)`, 
                opacity: 0 
            }
        ];
        
        const animation = confetti.animate(keyframes, {
            duration: individualDuration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });
        
        animation.onfinish = () => {
            confetti.remove();
        };
    }
    
    /**
     * Cache la modale de fin de partie
     */
    function hideEndgameModal() {
        const overlay = GameState.elements?.endgameModalOverlay;
        if (overlay) {
            // Nettoyer les confettis
            const confettiContainer = overlay.querySelector('.confetti-container');
            if (confettiContainer) {
                confettiContainer.innerHTML = '';
            }
            
            overlay.classList.add('closing');
            setTimeout(() => {
                overlay.classList.remove('visible', 'closing');
            }, 200);
        }
    }
    
    /**
     * Gère le clic sur "Recommencer" dans la modale de fin
     */
    function handleEndgameRestart() {
        hideEndgameModal();
        
        // Recharger les ressources (pour une nouvelle sélection aléatoire en mode Explorer)
        const loadingText = GameState.currentLanguage === 'FR' ? 'Chargement...' : 'Loading...';
        updateStatus(loadingText);
        
        loadResourcesForLanguage(GameState.currentLanguage)
            .then(() => {
                setTimeout(() => {
                    startCountdown();
                }, 300);
            })
            .catch(error => {
                console.error('❌ Mapper: Erreur de chargement', error);
                showError(error.message);
            });
    }
    
    /**
     * Gère le clic sur "Changer de difficulté" dans la modale de fin
     */
    function handleEndgameChangeDifficulty() {
        hideEndgameModal();
        
        // Réinitialiser l'interface pour revenir à l'écran de sélection
        resetGameInterface();
        
        // Afficher la modale de difficulté
        setTimeout(() => {
            showDifficultyModal();
        }, 300);
    }
    
    /**
     * Réinitialise l'interface du jeu
     */
    function resetGameInterface() {
        // Cacher le conteneur de labels
        const labelsContainer = GameState.elements?.labelsContainer;
        if (labelsContainer) {
            labelsContainer.style.display = 'none';
        }
        
        // Réafficher le placeholder
        const placeholder = GameState.elements?.placeholder;
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        // Réinitialiser le statut
        const statusMessage = GameState.elements?.statusMessage;
        if (statusMessage) {
            statusMessage.textContent = GameState.currentLanguage === 'FR' ? 'Chargement...' : 'Loading...';
        }
        
        // Nettoyer la carte SVG
        const mapContainer = GameState.elements?.mapContainer;
        if (mapContainer) {
            const svg = mapContainer.querySelector('svg');
            if (svg) {
                // Réinitialiser les classes des pays
                svg.querySelectorAll('.country-path').forEach(path => {
                    path.classList.remove('country-correct', 'country-wrong', 'country-hover');
                });
                // Supprimer les labels placés
                svg.querySelectorAll('.placed-label').forEach(label => label.remove());
            }
        }
    }

    /**
     * Change la région de jeu
     * @param {string} region - 'world', 'europe', etc.
     */
    function setRegion(region) {
        console.log(`🗺️ Mapper: Région → ${region}`);
        GameState.currentRegion = region;
        
        // Mettre à jour les boutons actifs
        updateRegionButtons();
    }

    /**
     * Change la langue des labels
     * @param {string} lang - 'FR' ou 'EN'
     */
    function setLanguage(lang) {
        console.log(`🗺️ Mapper: Langue → ${lang}`);
        GameState.currentLanguage = lang;
        
        // Mettre à jour les boutons actifs
        updateLanguageButtons();
    }

    /* ========================================================================
       6. SÉLECTION DE LANGUE (MODALE INITIALE)
       ======================================================================== */
    
    /**
     * Affiche la modale de sélection de langue
     */
    function showLanguageModal() {
        console.log('🗺️ Mapper: Affichage modale de langue...');
        
        const overlay = GameState.elements?.languageModalOverlay;
        if (overlay) {
            // Petit délai pour l'animation
            setTimeout(() => {
                overlay.classList.add('visible');
            }, 100);
        }
        
        updateStatus('Choisissez votre langue...');
    }
    
    /**
     * Cache la modale de sélection de langue
     */
    function hideLanguageModal() {
        const overlay = GameState.elements?.languageModalOverlay;
        if (overlay) {
            overlay.classList.add('closing');
            
            // Attendre la fin de l'animation
            setTimeout(() => {
                overlay.classList.remove('visible', 'closing');
            }, 200);
        }
    }
    
    /**
     * Sélection de la langue depuis la modale initiale
     * @param {string} lang - 'FR' ou 'EN'
     */
    function selectLanguage(lang) {
        console.log(`🗺️ Mapper: Langue sélectionnée → ${lang}`);
        
        // Marquer le bouton comme sélectionné visuellement
        const flagFR = GameState.elements?.flagFR;
        const flagEN = GameState.elements?.flagEN;
        
        if (flagFR) flagFR.classList.toggle('selected', lang === 'FR');
        if (flagEN) flagEN.classList.toggle('selected', lang === 'EN');
        
        // Définir la langue active
        GameState.currentLanguage = lang;
        
        // Cacher la modale de langue
        hideLanguageModal();
        
        // Afficher la modale de difficulté après un court délai
        setTimeout(() => {
            showDifficultyModal();
        }, 300);
    }
    
    /* ========================================================================
       6b. SÉLECTION DE DIFFICULTÉ (MODALE)
       ======================================================================== */
    
    /**
     * Affiche la modale de sélection de difficulté
     */
    function showDifficultyModal() {
        console.log('🗺️ Mapper: Affichage modale de difficulté...');
        
        const overlay = GameState.elements?.difficultyModalOverlay;
        if (overlay) {
            // Mettre à jour les textes selon la langue sélectionnée
            updateDifficultyModalTexts();
            
            // Petit délai pour l'animation
            setTimeout(() => {
                overlay.classList.add('visible');
            }, 100);
        }
        
        const statusText = GameState.currentLanguage === 'FR' 
            ? 'Choisissez la difficulté...' 
            : 'Choose difficulty...';
        updateStatus(statusText);
    }
    
    /**
     * Cache la modale de sélection de difficulté
     */
    function hideDifficultyModal() {
        const overlay = GameState.elements?.difficultyModalOverlay;
        if (overlay) {
            overlay.classList.add('closing');
            
            // Attendre la fin de l'animation
            setTimeout(() => {
                overlay.classList.remove('visible', 'closing');
            }, 200);
        }
    }
    
    /**
     * Met à jour les textes de la modale de difficulté selon la langue
     */
    function updateDifficultyModalTexts() {
        const lang = GameState.currentLanguage;
        
        // Titre
        const titleEl = document.getElementById('difficulty-modal-title');
        if (titleEl) {
            titleEl.textContent = lang === 'FR' ? '🎯 Difficulté' : '🎯 Difficulty';
        }
        
        // Sous-titre
        const subtitleEl = document.getElementById('difficulty-modal-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = lang === 'FR' 
                ? 'Choisissez votre niveau de difficulté' 
                : 'Choose your difficulty level';
        }
        
        // Explorer (nouveau niveau facile)
        const explorerLabelEl = document.getElementById('difficulty-explorer-label');
        const explorerDescEl = document.getElementById('difficulty-explorer-desc');
        
        if (explorerLabelEl) {
            explorerLabelEl.textContent = lang === 'FR' ? 'Facile' : 'Easy';
        }
        if (explorerDescEl) {
            explorerDescEl.textContent = lang === 'FR' 
                ? '30 pays choisis aléatoirement (sans îles)' 
                : '30 randomly selected countries (no islands)';
        }
        
        // Labels et descriptions
        const easyLabelEl = document.getElementById('difficulty-easy-label');
        const easyDescEl = document.getElementById('difficulty-easy-desc');
        const hardLabelEl = document.getElementById('difficulty-hard-label');
        const hardDescEl = document.getElementById('difficulty-hard-desc');
        
        if (easyLabelEl) {
            easyLabelEl.textContent = lang === 'FR' ? 'Normal' : 'Regular';
        }
        if (easyDescEl) {
            easyDescEl.textContent = lang === 'FR' 
                ? 'Vous ne devez trouver que les pays, pas les îles' 
                : 'You only need to find countries, not islands';
        }
        if (hardLabelEl) {
            hardLabelEl.textContent = lang === 'FR' ? 'Difficile' : 'Hard';
        }
        if (hardDescEl) {
            hardDescEl.textContent = lang === 'FR' 
                ? 'Vous devez trouver les pays et les îles. (PC recommandé ou tablette)' 
                : 'You have to find countries and islands. (PC or tablet recommended)';
        }
    }
    
    /**
     * Sélection de la difficulté depuis la modale
     * @param {string} difficulty - 'explorer', 'easy' ou 'hard'
     */
    function selectDifficulty(difficulty) {
        console.log(`🗺️ Mapper: Difficulté sélectionnée → ${difficulty}`);
        
        // Marquer le bouton comme sélectionné visuellement
        const explorerBtn = GameState.elements?.difficultyExplorer;
        const easyBtn = GameState.elements?.difficultyEasy;
        const hardBtn = GameState.elements?.difficultyHard;
        
        if (explorerBtn) explorerBtn.classList.toggle('selected', difficulty === 'explorer');
        if (easyBtn) easyBtn.classList.toggle('selected', difficulty === 'easy');
        if (hardBtn) hardBtn.classList.toggle('selected', difficulty === 'hard');
        
        // Définir la difficulté active
        GameState.currentDifficulty = difficulty;
        
        // Mettre à jour le statut
        const loadingText = GameState.currentLanguage === 'FR' ? 'Chargement...' : 'Loading...';
        updateStatus(loadingText);
        
        // Charger les ressources pour cette langue et difficulté
        loadResourcesForLanguage(GameState.currentLanguage)
            .then(() => {
                console.log(`✅ Mapper: Ressources ${GameState.currentLanguage} (${difficulty}) chargées`);
                
                // Cacher la modale
                hideDifficultyModal();
                
                // Mettre à jour l'interface
                updateLanguageButtons();
                
                // Lancer le compte à rebours après un court délai
                setTimeout(() => {
                    startCountdown();
                }, 300);
            })
            .catch(error => {
                console.error('❌ Mapper: Erreur de chargement', error);
                showError(error.message);
            });
    }
    
    /**
     * Charge les ressources pour une langue donnée
     * @param {string} lang - 'FR' ou 'EN'
     * @returns {Promise}
     */
    async function loadResourcesForLanguage(lang) {
        console.log(`🗺️ Mapper: Chargement ressources ${lang} (difficulté: ${GameState.currentDifficulty})...`);
        
        try {
            // Déterminer le chemin du fichier JSON selon langue ET difficulté
            // Explorer et Easy utilisent le même fichier (pays sans îles)
            let jsonPath;
            
            if (GameState.currentDifficulty === 'explorer' || GameState.currentDifficulty === 'easy') {
                jsonPath = lang === 'FR' 
                    ? CONFIG.paths.countriesEasyFR 
                    : CONFIG.paths.countriesEasyEN;
            } else {
                jsonPath = lang === 'FR' 
                    ? CONFIG.paths.countriesFR 
                    : CONFIG.paths.countriesEN;
            }
            
            // Déterminer le chemin du fichier de scoring
            let scoringPath;
            if (GameState.currentDifficulty === 'explorer' || GameState.currentDifficulty === 'easy') {
                scoringPath = '/assets/mapper-game/scoring_easy.json';
            } else {
                scoringPath = '/assets/mapper-game/scoring_hard.json';
            }

            // Charger en parallèle les pays, la carte SVG et le scoring
            const [countries, svgContent, scoring] = await Promise.all([
                loadJSON(jsonPath),
                loadSVG(CONFIG.paths.worldSVG),
                loadJSON(scoringPath)
            ]);
            
            // Pour le mode Explorer, sélectionner 30 pays aléatoirement
            if (GameState.currentDifficulty === 'explorer') {
                const selectedCountries = selectExplorerCountries(countries);
                GameState.countries = selectedCountries;
            } else {
                GameState.countries = countries;
            }
            
            GameState.svgContent = svgContent;
            GameState.scoring = scoring;

            const countryCount = Object.keys(GameState.countries).length;

            console.log(`✅ Mapper: ${countryCount} pays chargés (${lang})`);
            console.log('✅ Mapper: Carte SVG chargée');
            
            return true;
        } catch (error) {
            throw new Error(`Erreur de chargement: ${error.message}`);
        }
    }
    
    /**
     * Sélectionne 30 pays aléatoirement pour le mode Explorer (sans îles)
     * @param {Object} countriesOnly - Les pays sans les îles
     * @returns {Object} - 30 pays sélectionnés aléatoirement
     */
    function selectExplorerCountries(countriesOnly) {
        const countryOnlyCodes = Object.keys(countriesOnly);
        
        console.log(`🗺️ Mode Explorer: ${countryOnlyCodes.length} pays disponibles`);
        
        // Mélanger les pays (Fisher-Yates)
        const shuffledCountries = [...countryOnlyCodes].sort(() => Math.random() - 0.5);
        
        // Sélectionner 30 pays
        const selectedCountryCodes = shuffledCountries.slice(0, 30);
        
        // Créer l'objet résultat
        const result = {};
        
        selectedCountryCodes.forEach(code => {
            result[code] = countriesOnly[code];
        });
        
        console.log(`🗺️ Mode Explorer: ${selectedCountryCodes.length} pays sélectionnés`);
        
        return result;
    }
    
    /* ========================================================================
       7. COMPTE À REBOURS
       ======================================================================== */
    
    /**
     * Lance le compte à rebours avant le début du jeu
     */
    function startCountdown() {
        console.log('🗺️ Mapper: Démarrage compte à rebours...');
        
        // Cacher le placeholder
        const placeholder = GameState.elements?.placeholder;
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Créer l'overlay de compte à rebours
        const gameContainer = GameState.elements?.gameContainer;
        if (!gameContainer) return;
        
        const countdownOverlay = document.createElement('div');
        countdownOverlay.className = 'countdown-overlay';
        countdownOverlay.id = 'countdown-overlay';
        countdownOverlay.innerHTML = `
            <div class="countdown-number" id="countdown-number">3</div>
            <div class="countdown-text" id="countdown-text">${GameState.currentLanguage === 'FR' ? 'Préparez-vous...' : 'Get ready...'}</div>
        `;
        gameContainer.appendChild(countdownOverlay);
        
        // Afficher l'overlay
        setTimeout(() => {
            countdownOverlay.classList.add('visible');
        }, 50);
        
        // Démarrer le compte à rebours
        let count = 3;
        const numberEl = document.getElementById('countdown-number');
        const textEl = document.getElementById('countdown-text');
        
        const countdownInterval = setInterval(() => {
            count--;
            
            if (count > 0) {
                // Afficher le nombre suivant
                if (numberEl) {
                    numberEl.textContent = count.toString();
                    numberEl.style.animation = 'none';
                    numberEl.offsetHeight; // Force reflow
                    numberEl.style.animation = 'countdownPulse 1s ease infinite';
                }
            } else if (count === 0) {
                // Afficher "GO!"
                if (numberEl) {
                    numberEl.textContent = GameState.currentLanguage === 'FR' ? 'C\'est parti !' : 'GO!';
                    numberEl.className = 'countdown-number countdown-go';
                }
                if (textEl) {
                    textEl.style.display = 'none';
                }
            } else {
                // Fin du compte à rebours
                clearInterval(countdownInterval);
                
                // Cacher l'overlay
                countdownOverlay.classList.remove('visible');
                
                // Supprimer après l'animation
                setTimeout(() => {
                    countdownOverlay.remove();
                    
                    // Démarrer la partie (réinitialise les stats et démarre le timer)
                    startNewGame();
                    
                    // Démarrer le timer
                    startTimer();
                    
                    // Afficher la carte
                    renderMap();
                    
                    // Générer et afficher les labels mélangés
                    generateShuffledLabels();
                    
                    // Activer les boutons
                    enableButtons();
                    
                    // Mettre à jour le statut
                    const playingText = GameState.currentLanguage === 'FR' ? 'En jeu' : 'Playing';
                    updateStatus(playingText);
                    
                    console.log('✅ Mapper: Partie démarrée !');
                }, 300);
            }
        }, 1000);
        
        // Stocker la référence
        GameState.countdownInterval = countdownInterval;
    }
    
    /* ========================================================================
       8. AFFICHAGE DE LA CARTE
       ======================================================================== */
    
    /**
     * Affiche la carte du monde avec les labels
     */
    function renderMap() {
        console.log('🗺️ Mapper: Rendu de la carte...');
        
        const mapContainer = GameState.elements?.mapContainer;
        if (!mapContainer || !GameState.svgContent) {
            console.error('❌ Mapper: Impossible de rendre la carte');
            return;
        }
        
        // Cacher le placeholder
        const placeholder = GameState.elements?.placeholder;
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Injecter le SVG
        mapContainer.innerHTML = GameState.svgContent;
        
        // Récupérer l'élément SVG
        const svgElement = mapContainer.querySelector('svg');
        if (!svgElement) {
            console.error('❌ Mapper: SVG non trouvé');
            return;
        }
        
        // Configurer le SVG pour être responsive
        configureSVG(svgElement);
        
        // Ajouter les styles aux pays
        styleCountries(svgElement);
        
        // Créer le tooltip pour les pays placés
        createTooltip();
        
        // Attacher les événements de survol
        attachHoverEvents(svgElement);
        
        // Configurer les zones de drop
        setupDropZones(svgElement);
        
        // Configurer le zoom et le pan
        setupZoomPan(mapContainer, svgElement);
        
        // Stocker la référence au SVG
        GameState.svgElement = svgElement;
        
        console.log('✅ Mapper: Carte rendue avec succès');
    }
    
    /**
     * Configure le SVG pour être responsive
     * @param {SVGElement} svg
     */
    function configureSVG(svg) {
        // S'assurer que le viewBox est défini
        if (!svg.getAttribute('viewBox')) {
            const width = svg.getAttribute('width') || 2000;
            const height = svg.getAttribute('height') || 857;
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        
        // Récupérer les dimensions du viewBox
        const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
        const vbWidth = viewBox[2];
        const vbHeight = viewBox[3];
        
        // Rendre responsive mais avec ratio fixe pour les calculs de zoom
        svg.classList.add('world-map');
        
        // IMPORTANT: Utiliser 'none' pour que le SVG remplisse exactement ses dimensions
        // Cela évite les décalages causés par le centrage automatique
        svg.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        
        // Définir des dimensions fixes basées sur le viewBox
        // Ces dimensions seront multipliées par le scale lors du zoom
        svg.style.width = vbWidth + 'px';
        svg.style.height = vbHeight + 'px';
        svg.style.minWidth = vbWidth + 'px';
        svg.style.minHeight = vbHeight + 'px';
    }
    
    /**
     * Applique les styles aux pays
     * @param {SVGElement} svg
     */
    function styleCountries(svg) {
        // Sélectionner tous les paths (pays)
        const paths = svg.querySelectorAll('path');
        
        paths.forEach(path => {
            // Récupérer l'identifiant du pays (id ou class)
            const countryId = path.getAttribute('id');
            const countryClass = path.getAttribute('class');
            
            // Ajouter la classe de base
            path.classList.add('country-path');
            
            // Stocker l'ID dans un data attribute pour un accès facile
            if (countryId) {
                path.dataset.countryId = countryId;
            } else if (countryClass) {
                // Pour les pays multi-territoires, utiliser la classe comme ID
                path.dataset.countryId = countryClass;
            }
        });
    }
    
    /**
     * Crée le tooltip HTML pour les pays placés
     */
    function createTooltip() {
        // Vérifier si le tooltip existe déjà
        let tooltip = document.getElementById('map-tooltip');
        if (tooltip) return;
        
        // Créer le tooltip
        tooltip = document.createElement('div');
        tooltip.id = 'map-tooltip';
        tooltip.className = 'map-tooltip';
        tooltip.style.display = 'none';
        
        document.body.appendChild(tooltip);
        GameState.tooltip = tooltip;
    }
    
    /**
     * Configure le zoom et le pan sur la carte
     * @param {HTMLElement} container - Le conteneur de la carte
     * @param {SVGElement} svg - L'élément SVG
     */
    function setupZoomPan(container, svg) {
        const zoomState = GameState.zoom;
        
        /**
         * Applique le zoom en conservant un point fixe (sous le curseur/centre du pinch)
         * Utilise translate + scale pour un contrôle précis
         */
        function applyZoom(newScale, focalX, focalY) {
            const oldScale = zoomState.scale;
            if (!oldScale || oldScale <= 0) {
                console.warn('⚠️ oldScale invalide, reset à 1');
                zoomState.scale = 1;
                return applyZoom(newScale, focalX, focalY);
            }
            
            // Clamp newScale
            newScale = Math.max(CONFIG.zoom.min, Math.min(CONFIG.zoom.max, newScale));
            if (newScale === oldScale) return;
            
            // Position du point focal dans le conteneur (relative au scroll)
            const containerRect = container.getBoundingClientRect();
            const pointInContainerX = focalX - containerRect.left + container.scrollLeft;
            const pointInContainerY = focalY - containerRect.top + container.scrollTop;
            
            // Position du point focal dans le SVG (coordonnées non-scalées)
            const pointInSvgX = pointInContainerX / oldScale;
            const pointInSvgY = pointInContainerY / oldScale;
            
            // Nouvelle position du point focal après le nouveau scale
            const newPointInContainerX = pointInSvgX * newScale;
            const newPointInContainerY = pointInSvgY * newScale;
            
            // Différence de scroll nécessaire pour garder le point focal fixe
            const scrollDiffX = newPointInContainerX - pointInContainerX;
            const scrollDiffY = newPointInContainerY - pointInContainerY;
            
            // Appliquer le nouveau scale
            zoomState.scale = newScale;
            svg.style.transform = `scale(${newScale})`;
            svg.style.transformOrigin = '0 0';
            
            // Ajuster le scroll pour compenser
            container.scrollLeft += scrollDiffX;
            container.scrollTop += scrollDiffY;
            
            console.log(`🔍 Zoom: ${Math.round(newScale * 100)}%`);
        }
        
        // Zoom avec la molette (PC)
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const direction = e.deltaY > 0 ? -1 : 1;
            const newScale = zoomState.scale + direction * CONFIG.zoom.step;
            
            applyZoom(newScale, e.clientX, e.clientY);
            
        }, { passive: false });
        
        // Pan avec clic gauche maintenu (PC)
        container.addEventListener('mousedown', (e) => {
            // Ignorer si on clique sur un label sélectionnable
            if (e.target.closest('.country-label.selectable')) return;
            
            // Ignorer si on clique sur un pays (pour le placement)
            if (e.target.closest('path.country-path') && GameState.selectedLabels.length > 0) return;
            
            // Activer le pan avec clic gauche ou avec le bouton molette
            const isMiddleClick = e.button === 1;
            const isLeftClick = e.button === 0;
            
            if (isMiddleClick || isLeftClick) {
                zoomState.isPanning = true;
                zoomState.startX = e.clientX;
                zoomState.startY = e.clientY;
                zoomState.scrollLeft = container.scrollLeft;
                zoomState.scrollTop = container.scrollTop;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        // Écouter mousemove sur window pour continuer le pan même si la souris sort du container
        window.addEventListener('mousemove', (e) => {
            if (!zoomState.isPanning) return;
            
            const dx = e.clientX - zoomState.startX;
            const dy = e.clientY - zoomState.startY;
            
            container.scrollLeft = zoomState.scrollLeft - dx;
            container.scrollTop = zoomState.scrollTop - dy;
        });
        
        // Écouter mouseup sur window pour arrêter le pan même si la souris est hors du container
        window.addEventListener('mouseup', () => {
            if (zoomState.isPanning) {
                zoomState.isPanning = false;
                container.style.cursor = '';
            }
        });
        
        // ===== SUPPORT TACTILE (MOBILE) =====
        let touchStartX, touchStartY;
        let initialPinchDistance = null;
        let initialPinchScale = null;
        let pinchCenterX, pinchCenterY;
        
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // Pan avec 1 doigt
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                zoomState.scrollLeft = container.scrollLeft;
                zoomState.scrollTop = container.scrollTop;
                initialPinchDistance = null;
            } else if (e.touches.length === 2) {
                // Début du pinch-to-zoom
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                // Distance initiale entre les deux doigts
                initialPinchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialPinchScale = zoomState.scale;
                
                // Centre du pinch (point focal)
                pinchCenterX = (touch1.clientX + touch2.clientX) / 2;
                pinchCenterY = (touch1.clientY + touch2.clientY) / 2;
            }
        }, { passive: false });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && initialPinchDistance === null) {
                // Pan avec 1 doigt (pas de pinch en cours)
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                
                container.scrollLeft = zoomState.scrollLeft - dx;
                container.scrollTop = zoomState.scrollTop - dy;
            } else if (e.touches.length === 2 && initialPinchDistance !== null) {
                // Pinch-to-zoom avec 2 doigts
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                // Nouvelle distance entre les doigts
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                // Calculer le nouveau scale basé sur le ratio des distances
                const scaleRatio = currentDistance / initialPinchDistance;
                const newScale = initialPinchScale * scaleRatio;
                
                // Nouveau centre du pinch
                const newCenterX = (touch1.clientX + touch2.clientX) / 2;
                const newCenterY = (touch1.clientY + touch2.clientY) / 2;
                
                // Appliquer le zoom centré sur le point focal
                applyZoom(newScale, newCenterX, newCenterY);
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                // Réinitialiser le pinch
                initialPinchDistance = null;
                initialPinchScale = null;
                
                // Si on revient à 1 doigt, réinitialiser le pan
                if (e.touches.length === 1) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    zoomState.scrollLeft = container.scrollLeft;
                    zoomState.scrollTop = container.scrollTop;
                }
            }
        }, { passive: true });
        
        console.log('✅ Mapper: Zoom/Pan configuré (avec pinch-to-zoom mobile)');
    }
    
    /**
     * Attache les événements de survol aux pays
     * @param {SVGElement} svg
     */
    function attachHoverEvents(svg) {
        const paths = svg.querySelectorAll('path.country-path');
        const tooltip = GameState.tooltip;
        
        paths.forEach(path => {
            const countryId = path.dataset.countryId;
            if (!countryId) return;
            
            // Événement d'entrée
            path.addEventListener('mouseenter', (e) => {
                // Highlight du pays (sauf si déjà correct)
                if (!path.classList.contains('country-correct')) {
                    highlightCountry(countryId, svg, true);
                }
                
                // Afficher le tooltip UNIQUEMENT pour les pays déjà placés (verrouillés)
                const normalizedId = normalizeCountryId(countryId);
                if (tooltip && GameState.placedLabels.includes(normalizedId)) {
                    showTooltip(e, GameState.countries[normalizedId]);
                }
            });
            
            // Événement de mouvement (pour suivre la souris)
            path.addEventListener('mousemove', (e) => {
                const normalizedId = normalizeCountryId(countryId);
                if (tooltip && GameState.placedLabels.includes(normalizedId)) {
                    moveTooltip(e);
                }
            });
            
            // Événement de sortie
            path.addEventListener('mouseleave', () => {
                // Enlever le highlight (sauf si correct)
                if (!path.classList.contains('country-correct')) {
                    highlightCountry(countryId, svg, false);
                }
                
                // Cacher le tooltip
                hideTooltip();
            });
        });
    }
    
    /**
     * Met en surbrillance un pays
     * @param {string} countryId
     * @param {SVGElement} svg
     * @param {boolean} highlight
     */
    function highlightCountry(countryId, svg, highlight) {
        // Trouver tous les paths de ce pays
        const paths = svg.querySelectorAll(
            `path[data-country-id="${countryId}"]`
        );
        
        paths.forEach(path => {
            if (highlight) {
                path.classList.add('country-hover');
            } else {
                path.classList.remove('country-hover');
            }
        });
    }
    
    /**
     * Affiche le tooltip
     * @param {MouseEvent} e
     * @param {string} countryName
     */
    function showTooltip(e, countryName) {
        const tooltip = GameState.tooltip;
        if (!tooltip) return;
        
        tooltip.textContent = countryName;
        tooltip.style.display = 'block';
        moveTooltip(e);
    }
    
    /**
     * Déplace le tooltip
     * @param {MouseEvent} e
     */
    function moveTooltip(e) {
        const tooltip = GameState.tooltip;
        if (!tooltip) return;
        
        const offset = 15;
        tooltip.style.left = `${e.clientX + offset}px`;
        tooltip.style.top = `${e.clientY + offset}px`;
    }
    
    /**
     * Cache le tooltip
     */
    function hideTooltip() {
        const tooltip = GameState.tooltip;
        if (!tooltip) return;
        
        tooltip.style.display = 'none';
    }

    /* ========================================================================
       9. DRAG & DROP
       ======================================================================== */
    
    /**
     * Nombre de labels affichés simultanément
     */
    const LABELS_DISPLAY_COUNT = 3;
    
    /**
     * Génère les labels mélangés à partir des pays chargés
     */
    function generateShuffledLabels() {
        console.log('🗺️ Mapper: Génération des labels mélangés...');
        
        const countries = GameState.countries;
        const labelsContainer = GameState.elements?.labelsContainer;
        const labelsPool = GameState.elements?.labelsPool;
        
        if (!countries || !labelsContainer || !labelsPool) {
            console.error('❌ Mapper: Impossible de générer les labels');
            return;
        }
        
        // Vider le conteneur
        labelsPool.innerHTML = '';
        
        // Créer un tableau de paires [code, nom]
        const countryPairs = Object.entries(countries);
        
        // Mélanger le tableau (Fisher-Yates shuffle)
        const shuffled = shuffleArray([...countryPairs]);
        
        // Stocker TOUS les labels restants (pas encore placés)
        GameState.allLabels = shuffled; // Tous les labels mélangés
        GameState.remainingLabels = shuffled.map(([code]) => code);
        GameState.stats.totalCountries = shuffled.length;
        GameState.currentDisplayedLabels = []; // Labels actuellement affichés
        
        // Afficher le conteneur de labels
        labelsContainer.style.display = 'flex';
        
        // Créer le conteneur avec le bouton refresh
        createLabelsUI(labelsPool);
        
        // Afficher les 3 premiers labels
        displayNextLabels();
        
        // Mettre à jour le score
        updateScoreDisplay();
        
        console.log(`✅ Mapper: ${shuffled.length} labels générés, ${LABELS_DISPLAY_COUNT} affichés`);
    }
    
    /**
     * Crée l'interface des labels avec le bouton refresh
     * @param {HTMLElement} container
     */
    function createLabelsUI(container) {
        container.innerHTML = '';
        
        // Conteneur des labels visibles
        const labelsWrapper = document.createElement('div');
        labelsWrapper.className = 'labels-visible-wrapper';
        labelsWrapper.id = 'labels-visible-wrapper';
        container.appendChild(labelsWrapper);
        
        // Bouton refresh
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'labels-refresh-btn';
        refreshBtn.id = 'labels-refresh-btn';
        refreshBtn.innerHTML = '<img src="/assets/mapper-game/random.png" alt="Shuffle" class="refresh-icon">';
        refreshBtn.title = GameState.currentLanguage === 'FR' 
            ? 'Afficher d\'autres pays' 
            : 'Show other countries';
        refreshBtn.addEventListener('click', handleRefreshLabels);
        container.appendChild(refreshBtn);
        
        // Stocker la référence
        GameState.elements.labelsVisibleWrapper = labelsWrapper;
        GameState.elements.labelsRefreshBtn = refreshBtn;
    }
    
    /**
     * Affiche les prochains labels (3 maximum)
     */
    function displayNextLabels() {
        const wrapper = GameState.elements?.labelsVisibleWrapper;
        if (!wrapper) return;
        
        // Vider les labels actuels et réinitialiser la sélection
        wrapper.innerHTML = '';
        wrapper.classList.remove('geo-combo-active');
        GameState.currentDisplayedLabels = [];
        GameState.selectedLabels = [];
        
        // Récupérer les labels restants (non placés)
        const remainingPairs = GameState.allLabels.filter(
            ([code]) => GameState.remainingLabels.includes(code)
        );
        
        if (remainingPairs.length === 0) {
            // Plus de labels à afficher
            wrapper.innerHTML = `<div class="no-labels-message">${
                GameState.currentLanguage === 'FR' 
                    ? '🎉 Tous les pays ont été placés !' 
                    : '🎉 All countries have been placed!'
            }</div>`;
            
            // Cacher le bouton refresh
            const refreshBtn = GameState.elements?.labelsRefreshBtn;
            if (refreshBtn) refreshBtn.style.display = 'none';
            
            // Terminer la partie après un court délai pour laisser voir le message
            setTimeout(() => {
                endGame();
            }, 1500);
            
            return;
        }
        
        // Mélanger les labels restants pour en piocher 3 aléatoirement
        const shuffledRemaining = shuffleArray([...remainingPairs]);
        
        // Prendre les 3 premiers (ou moins s'il en reste moins)
        const labelsToShow = shuffledRemaining.slice(0, LABELS_DISPLAY_COUNT);
        
        // Créer et afficher les labels
        labelsToShow.forEach(([countryCode, countryName]) => {
            const label = createDraggableLabel(countryCode, countryName);
            wrapper.appendChild(label);
            GameState.currentDisplayedLabels.push(countryCode);
        });
        
        console.log(`📋 Mapper: Affichage de ${labelsToShow.length} labels`);
    }
    
    /**
     * Gère le clic sur le bouton refresh
     */
    function handleRefreshLabels() {
        console.log('🔄 Mapper: Refresh des labels...');
        
        // Réinitialiser le timer d'inactivité
        resetInactivityTimer();
        
        // Animation du bouton
        const refreshBtn = GameState.elements?.labelsRefreshBtn;
        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
            setTimeout(() => refreshBtn.classList.remove('spinning'), 300);
        }
        
        // Réinitialiser le GEO-COMBO car on change les labels
        resetGeoCombo(true); // Jouer too_bad si combo était actif
        
        // Afficher de nouveaux labels
        displayNextLabels();
    }
    
    /**
     * Mélange un tableau (algorithme Fisher-Yates)
     * @param {Array} array
     * @returns {Array}
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Démarre ou redémarre le timer d'inactivité
     * Après 15 secondes sans interaction, le bouton shuffle tremble
     */
    function resetInactivityTimer() {
        // Annuler le timer existant
        if (GameState.inactivityTimer) {
            clearTimeout(GameState.inactivityTimer);
        }
        
        // Ne pas démarrer si le jeu n'est pas en cours
        if (!GameState.isPlaying || GameState.isPaused) return;
        
        // Démarrer un nouveau timer de 15 secondes
        GameState.inactivityTimer = setTimeout(() => {
            triggerShuffleShake();
        }, 15000);
    }
    
    /**
     * Déclenche l'effet de tremblement sur le bouton shuffle
     * Peut se répéter si l'utilisateur reste inactif
     */
    function triggerShuffleShake() {
        const refreshBtn = GameState.elements?.labelsRefreshBtn;
        if (!refreshBtn || !GameState.isPlaying || GameState.isPaused) return;
        
        // Ajouter la classe de tremblement
        refreshBtn.classList.add('shake');
        
        // Retirer la classe après l'animation
        setTimeout(() => {
            refreshBtn.classList.remove('shake');
        }, 500);
        
        // Redémarrer le timer pour permettre un nouveau tremblement
        GameState.inactivityTimer = setTimeout(() => {
            triggerShuffleShake();
        }, 15000);
    }
    
    /**
     * Arrête le timer d'inactivité
     */
    function stopInactivityTimer() {
        if (GameState.inactivityTimer) {
            clearTimeout(GameState.inactivityTimer);
            GameState.inactivityTimer = null;
        }
    }
    
    /**
     * Crée un label cliquable (nouveau système sans drag & drop)
     * @param {string} countryCode - Code ISO du pays
     * @param {string} countryName - Nom du pays
     * @returns {HTMLElement}
     */
    function createDraggableLabel(countryCode, countryName) {
        const label = document.createElement('div');
        label.className = 'country-label selectable';
        label.textContent = countryName;
        label.dataset.countryCode = countryCode;
        label.dataset.countryName = countryName;
        
        // Événement de clic pour sélectionner/désélectionner le label
        label.addEventListener('click', handleLabelClick);
        
        return label;
    }
    
    /**
     * Gère le clic sur un label pour le sélectionner/désélectionner
     * @param {MouseEvent} e
     */
    function handleLabelClick(e) {
        e.stopPropagation();
        const label = e.target.closest('.country-label');
        if (!label) return;
        
        // Réinitialiser le timer d'inactivité à chaque interaction
        resetInactivityTimer();
        
        const countryCode = label.dataset.countryCode;
        const isSelected = GameState.selectedLabels.includes(countryCode);
        
        if (isSelected) {
            // Désélectionner le label
            GameState.selectedLabels = GameState.selectedLabels.filter(code => code !== countryCode);
            label.classList.remove('selected');
            console.log(`🔘 Label désélectionné: ${label.dataset.countryName}`);
        } else {
            // Sélectionner le label
            GameState.selectedLabels.push(countryCode);
            label.classList.add('selected');
            console.log(`✅ Label sélectionné: ${label.dataset.countryName}`);
        }
        
        // Vérifier si les 3 labels sont sélectionnés pour activer le mode GEO-COMBO
        checkGeoComboActivation();
    }
    
    /**
     * Vérifie si le GEO-COMBO doit être activé (3 labels sélectionnés)
     */
    function checkGeoComboActivation() {
        const displayedLabels = GameState.currentDisplayedLabels;
        const selectedLabels = GameState.selectedLabels;
        
        // Vérifier si tous les labels affichés sont sélectionnés
        const allSelected = displayedLabels.length > 0 && 
                           displayedLabels.every(code => selectedLabels.includes(code));
        
        if (allSelected && displayedLabels.length === LABELS_DISPLAY_COUNT) {
            if (!GameState.geoCombo.active) {
                GameState.geoCombo.active = true;
                GameState.geoCombo.consecutiveCorrect = 0;
                GameState.geoCombo.comboLabels = [...displayedLabels];
                console.log('🔥 GEO-COMBO activé! Placez les 3 pays correctement!');
                
                // Jouer le son GEO-COMBO ready en boucle
                playComboReadySound();
                
                // Ajouter une indication visuelle
                const wrapper = GameState.elements?.labelsVisibleWrapper;
                if (wrapper) {
                    wrapper.classList.add('geo-combo-active');
                }
                
                // Ajouter l'effet de flamme sur les barres
                activateFireEffect(true);
            }
        } else {
            // Désactiver le combo si on désélectionne un label
            if (GameState.geoCombo.active) {
                resetGeoCombo(true); // Jouer too_bad car désélection
            }
        }
    }
    
    /**
     * Active ou désactive l'effet de flamme sur titlebar, menubar et toolbar
     * @param {boolean} activate - true pour activer, false pour désactiver
     */
    function activateFireEffect(activate) {
        const titlebar = document.querySelector('.titlebar');
        const menubar = document.querySelector('.menubar');
        const toolbar = document.querySelector('.toolbar');
        
        if (activate) {
            titlebar?.classList.add('geo-combo-fire');
            menubar?.classList.add('geo-combo-fire');
            toolbar?.classList.add('geo-combo-fire');
        } else {
            titlebar?.classList.remove('geo-combo-fire');
            menubar?.classList.remove('geo-combo-fire');
            toolbar?.classList.remove('geo-combo-fire');
        }
    }
    
    /**
     * Réinitialise le GEO-COMBO
     * @param {boolean} playTooBad - Si true, joue le son too_bad (interruption par l'utilisateur)
     */
    function resetGeoCombo(playTooBad = false) {
        // Jouer le son too_bad si le combo était actif et qu'on doit le jouer
        if (playTooBad && GameState.geoCombo.active) {
            playTooBadSound();
        }
        
        GameState.geoCombo.active = false;
        GameState.geoCombo.consecutiveCorrect = 0;
        GameState.geoCombo.comboLabels = [];
        
        // Arrêter le son GEO-COMBO ready
        stopComboReadySound();
        
        // Désactiver l'effet de flamme
        activateFireEffect(false);
        
        const wrapper = GameState.elements?.labelsVisibleWrapper;
        if (wrapper) {
            wrapper.classList.remove('geo-combo-active');
        }
    }
    

    
    /**
     * Configure les événements de clic sur les pays de la carte
     * @param {SVGElement} svg
     */
    function setupDropZones(svg) {
        const mapContainer = GameState.elements?.mapContainer;
        if (!mapContainer) return;
        
        // Gérer les clics sur les pays
        svg.addEventListener('click', handleCountryClick);
        
        console.log('✅ Mapper: Zones de clic configurées');
    }
    
    /**
     * Gère le clic sur un pays de la carte
     * @param {MouseEvent} e
     */
    function handleCountryClick(e) {
        const countryPath = e.target.closest('path.country-path');
        if (!countryPath) return;
        
        // Réinitialiser le timer d'inactivité à chaque interaction
        resetInactivityTimer();
        
        // Vérifier qu'au moins un label est sélectionné
        if (GameState.selectedLabels.length === 0) {
            // Si le pays n'est pas déjà validé (vert), afficher l'animation du curseur
            if (!countryPath.classList.contains('country-correct')) {
                showCursorHintAnimation();
            }
            console.log('ℹ️ Sélectionnez d\'abord un pays dans la liste');
            return;
        }
        
        const targetCountryId = countryPath.dataset.countryId;
        
        // Chercher si le pays cliqué correspond à un des labels sélectionnés
        const matchingLabel = GameState.selectedLabels.find(code => checkCountryMatch(code, targetCountryId));
        if (matchingLabel) {
            // Placement correct
            const labelElement = document.querySelector(`.country-label[data-country-code="${matchingLabel}"]`);
            handleDrop(matchingLabel, targetCountryId, labelElement);
        } else {
            // Aucun label sélectionné ne correspond à ce pays → c'est une erreur
            // On prend le premier label sélectionné pour traiter l'erreur
            const selectedLabel = GameState.selectedLabels[0];
            const labelElement = document.querySelector(`.country-label[data-country-code="${selectedLabel}"]`);
            handleDrop(selectedLabel, targetCountryId, labelElement);
        }
    }
    
    /**
     * Affiche l'animation du curseur qui pointe vers un label aléatoire
     * Animation: apparaît du bas, monte et s'arrête sur un label, scintille, puis disparaît
     */
    function showCursorHintAnimation() {
        const wrapper = GameState.elements?.labelsVisibleWrapper;
        const labelsContainer = document.getElementById('labels-container');
        if (!wrapper || !labelsContainer) return;
        
        // Récupérer les labels actuellement affichés
        const visibleLabels = wrapper.querySelectorAll('.country-label');
        if (visibleLabels.length === 0) return;
        
        // Supprimer toute animation de curseur précédente
        const existingCursor = document.querySelector('.cursor-hint-animation');
        if (existingCursor) existingCursor.remove();
        
        // Choisir un label au hasard
        const randomLabel = visibleLabels[Math.floor(Math.random() * visibleLabels.length)];
        const labelRect = randomLabel.getBoundingClientRect();
        const containerRect = labelsContainer.getBoundingClientRect();
        
        // Position cible (un peu plus bas que le centre du label)
        const targetX = labelRect.left + labelRect.width / 2 - containerRect.left;
        const targetY = labelRect.top + labelRect.height / 2 - containerRect.top + 20; // +20px plus bas
        
        // Créer l'élément curseur
        const cursor = document.createElement('img');
        cursor.src = '/assets/mapper-game/cursor.png';
        cursor.className = 'cursor-hint-animation';
        cursor.style.cssText = `
            position: absolute;
            width: 32px;
            height: 32px;
            pointer-events: none;
            z-index: 3000;
            left: ${targetX}px;
            bottom: -50px;
            transform: translateX(-50%);
            opacity: 0;
        `;
        
        labelsContainer.appendChild(cursor);
        
        // Préparer le son de clic
        const clickSound = new Audio('/sounds/mouseclick.wav');
        clickSound.volume = 0.5;
        
        // Animation: monter du bas vers le label, scintiller, puis disparaître
        const targetBottom = containerRect.height - targetY;
        const animation = cursor.animate([
            { 
                bottom: '-50px', 
                opacity: 0,
                filter: 'brightness(1)'
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 1,
                filter: 'brightness(1)',
                offset: 0.3
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 1,
                filter: 'brightness(1.5)',
                offset: 0.4
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 1,
                filter: 'brightness(1)',
                offset: 0.5
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 1,
                filter: 'brightness(1.8)',
                offset: 0.6
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 1,
                filter: 'brightness(1)',
                offset: 0.7
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 1,
                filter: 'brightness(1.5)',
                offset: 0.8
            },
            { 
                bottom: `${targetBottom}px`, 
                opacity: 0,
                filter: 'brightness(1)',
                offset: 1
            }
        ], {
            duration: 1500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        // Jouer le son de clic quand le scintillement commence (à 30% de l'animation = 450ms)
        setTimeout(() => {
            clickSound.play().catch(() => {}); // Ignorer les erreurs si le son ne peut pas être joué
        }, 450);
        
        animation.onfinish = () => {
            cursor.remove();
        };
        
        console.log('👆 Animation curseur: pointage vers un label');
    }

    /**
     * Gère le placement d'un label sur un pays
     * @param {string} labelCountryCode - Code du pays du label
     * @param {string} targetCountryId - ID du pays ciblé
     * @param {HTMLElement} labelElement - Élément du label
     */
    function handleDrop(labelCountryCode, targetCountryId, labelElement) {
            /**
             * Animation du score gagné
             * @param {number} points
             * @param {string} countryId
             * @param {boolean} geoComboBonus
             */
            function animateScoreGain(points, countryId, geoComboBonus) {
                const mapContainer = GameState.elements?.mapContainer;
                const scoreZone = GameState.elements?.statusScore;
                if (!mapContainer || !scoreZone) return;

                // Trouver le pays sur la carte
                const svg = mapContainer.querySelector('svg');
                if (!svg) return;
                let countryPath = svg.querySelector(`#${countryId}`);
                if (!countryPath) countryPath = svg.querySelector(`.${countryId}`);
                if (!countryPath) return;

                // Obtenir la position du pays (centre du path)
                const bbox = countryPath.getBoundingClientRect();
                const mapRect = mapContainer.getBoundingClientRect();
                const scoreRect = scoreZone.getBoundingClientRect();
                const startX = bbox.left + bbox.width / 2 - mapRect.left;
                const startY = bbox.top + bbox.height / 2 - mapRect.top;
                const endX = scoreRect.left + scoreRect.width / 2 - mapRect.left;
                const endY = scoreRect.top + scoreRect.height / 2 - mapRect.top;

                // Créer l'élément animé
                const anim = document.createElement('div');
                anim.className = 'score-anim';
                anim.textContent = `+${points}`;

                // Couleur selon points
                if (points === 1) anim.classList.add('score-anim-green');
                else if (points === 3) anim.classList.add('score-anim-orange');
                else if (points === 5) anim.classList.add('score-anim-purple');
                else if (points === 9) anim.classList.add('score-anim-red');

                // Position initiale
                anim.style.position = 'absolute';
                anim.style.left = `${startX}px`;
                anim.style.top = `${startY}px`;
                anim.style.zIndex = 3000;
                mapContainer.appendChild(anim);

                // Animation du déplacement (durée augmentée pour meilleure visibilité sur mobile)
                anim.animate([
                    { transform: `translate(0, 0) scale(1.2)`, opacity: 1, offset: 0 },
                    { transform: `translate(0, -20px) scale(1.5)`, opacity: 1, offset: 0.15 },
                    { transform: `translate(${(endX - startX) * 0.5}px, ${(endY - startY) * 0.3}px) scale(1.3)`, opacity: 1, offset: 0.5 },
                    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.4)`, opacity: 1, offset: 0.85 },
                    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)`, opacity: 0 }
                ], {
                    duration: 2500,
                    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                    fill: 'forwards'
                });

                setTimeout(() => {
                    anim.remove();
                }, 2550);

                // Effet shake sur la zone de score si 9 points
                if (points === 9 && geoComboBonus) {
                    scoreZone.classList.add('score-shake');
                    setTimeout(() => {
                        scoreZone.classList.remove('score-shake');
                    }, 700);
                }
            }
        console.log(`📍 Placement: Label "${labelCountryCode}" sur pays "${targetCountryId}"`);
        
        // Normaliser l'ID cible (convertir nom de classe en code ISO si nécessaire)
        const normalizedTargetId = normalizeCountryId(targetCountryId);
        
        // Vérifier si c'est une correspondance
        const isMatch = checkCountryMatch(labelCountryCode, targetCountryId);
        
        if (isMatch) {
            console.log(`✅ CORRECT! "${labelCountryCode}" correspond à "${targetCountryId}"`);
            
            // Feedback visuel : colorer le pays en vert
            colorCountry(targetCountryId, 'correct');
            
            // Placer le label verrouillé sur le pays
            placeLockedLabel(labelCountryCode, targetCountryId);
            
            // Retirer le label du pool
            if (labelElement) {
                labelElement.remove();
            }
            
            // Retirer de la liste des labels sélectionnés
            GameState.selectedLabels = GameState.selectedLabels.filter(
                code => code !== labelCountryCode
            );
            
            // Retirer de la liste des labels affichés
            GameState.currentDisplayedLabels = GameState.currentDisplayedLabels.filter(
                code => code !== labelCountryCode
            );
            
            // Déterminer le score à attribuer
            let points = 1;
            const scoring = GameState.scoring?.[labelCountryCode];
            if (scoring) {
                if (scoring.difficulty === 1) points = 1;
                else if (scoring.difficulty === 2) points = 3;
                else if (scoring.difficulty === 3) points = 5;
            }

            // Si GEO-COMBO actif et pays difficile (5 points), attribuer 9 points
            let isGeoComboBonus = false;
            if (GameState.geoCombo.active && points === 5) {
                points = 9;
                isGeoComboBonus = true;
            }

            // Mettre à jour le score total
            GameState.stats.correctCount += points;
            GameState.remainingLabels = GameState.remainingLabels.filter(
                code => code !== labelCountryCode
            );
            GameState.placedLabels.push(labelCountryCode);

            // Réinitialiser le compteur d'erreurs consécutives
            GameState.consecutiveErrors = 0;

            // Gérer le GEO-COMBO
            if (GameState.geoCombo.active) {
                GameState.geoCombo.consecutiveCorrect++;
                console.log(`🔥 GEO-COMBO: ${GameState.geoCombo.consecutiveCorrect}/${LABELS_DISPLAY_COUNT}`);

                // Jouer le son de succès correspondant
                playComboSuccessSound(GameState.geoCombo.consecutiveCorrect);

                // Vérifier si le GEO-COMBO est complété
                if (GameState.geoCombo.consecutiveCorrect === LABELS_DISPLAY_COUNT) {
                    triggerGeoCombo();
                }
            } else {
                // Jouer le son de succès normal (hors GEO-COMBO)
                playSuccessBellSound();
            }

            // Animation de points gagnés
            animateScoreGain(points, targetCountryId, isGeoComboBonus);

            // Mettre à jour l'affichage du score
            updateScoreDisplay();
            
            // Si tous les labels visibles ont été placés, en afficher de nouveaux
            if (GameState.currentDisplayedLabels.length === 0 && GameState.remainingLabels.length > 0) {
                console.log('📋 Affichage de nouveaux labels...');
                resetGeoCombo(); // Reset pour le prochain groupe
                displayNextLabels();
            }
            
            // Vérifier si le jeu est terminé
            if (GameState.remainingLabels.length === 0) {
                console.log('🎉 Tous les pays ont été placés !');
                displayNextLabels(); // Affiche le message de victoire
            }
        } else {
            console.log(`❌ INCORRECT! "${labelCountryCode}" ne correspond pas à "${targetCountryId}"`);
            
            // Vérifier si le pays cible est voisin du bon pays
            const isNeighbor = areNeighbors(labelCountryCode, normalizedTargetId);
            
            // Feedback visuel : orange si voisin, rouge sinon
            const feedbackType = isNeighbor ? 'neighbor' : 'wrong';
            colorCountry(targetCountryId, feedbackType);
            
            console.log(isNeighbor 
                ? `🟠 Proche! ${normalizedTargetId} est voisin de ${labelCountryCode}` 
                : `🔴 Loin! ${normalizedTargetId} n'est pas voisin de ${labelCountryCode}`);
            
            // Casser le GEO-COMBO en cas d'erreur ET déclencher un reshuffle
            if (GameState.geoCombo.active) {
                console.log('💔 GEO-COMBO cassé! Reshuffle automatique!');
                resetGeoCombo(true); // Jouer too_bad car erreur
                
                // Afficher la notification spécifique au GEO-COMBO
                showGeoComboErrorNotification();
                
                // Déclencher le reshuffle après un court délai
                setTimeout(() => {
                    handleRefreshLabels();
                }, 500);
                
                // Mettre à jour les statistiques et sortir
                GameState.stats.wrongCount++;
                updateScoreDisplay();
                return; // On sort car le reshuffle est déjà déclenché
            }
            
            // Incrémenter le compteur d'erreurs consécutives
            GameState.consecutiveErrors++;
            console.log(`⚠️ Erreurs consécutives: ${GameState.consecutiveErrors}/10`);
            
            // Auto-shuffle après 10 erreurs consécutives
            if (GameState.consecutiveErrors >= 10) {
                console.log('🔄 Auto-shuffle déclenché après 10 erreurs consécutives!');
                GameState.consecutiveErrors = 0;
                showAutoShuffleNotification();
                
                // Attendre un peu avant le shuffle pour que la notification soit visible
                setTimeout(() => {
                    handleRefreshLabels();
                }, 500);
            }
            
            // Mettre à jour les statistiques
            GameState.stats.wrongCount++;
            updateScoreDisplay();
        }
    }
    
    /**
     * Affiche la notification d'erreur lors d'un GEO-COMBO
     */
    function showGeoComboErrorNotification() {
        const container = GameState.elements?.gameContainer;
        if (!container) return;
        
        // Jouer le son d'erreur
        playErrorSound();
        
        const notification = document.createElement('div');
        notification.className = 'auto-shuffle-notification geo-combo-error';
        
        const isFR = GameState.currentLanguage === 'FR';
        notification.innerHTML = `
            <div class="auto-shuffle-icon">💔</div>
            <div class="auto-shuffle-text">${isFR ? 'Pas d\'erreur autorisée pour un GEO-COMBO. On mélange les étiquettes !' : 'No mistakes allowed during a GEO-COMBO attempt. Labels are reshuffled!'}</div>
        `;
        
        container.appendChild(notification);
        
        // Animer l'apparition
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Supprimer après 2 secondes
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 400);
        }, 2000);
    }
    
    /**
     * Affiche la notification d'auto-shuffle
     */
    function showAutoShuffleNotification() {
        const container = GameState.elements?.gameContainer;
        if (!container) return;
        
        // Jouer le son d'erreur
        playErrorSound();
        
        const notification = document.createElement('div');
        notification.className = 'auto-shuffle-notification';
        
        const isFR = GameState.currentLanguage === 'FR';
        notification.innerHTML = `
            <div class="auto-shuffle-icon">🔄</div>
            <div class="auto-shuffle-text">${isFR ? 'Trop d\'erreurs consécutives ! On mélange les étiquettes.' : 'Too many consecutive mistakes! Labels are reshuffled.'}</div>
        `;
        
        container.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
    
    /**
     * Cache pour les sons du jeu
     */
    const SoundCache = {
        error: null,
        comboReady: null,
        comboSuccess1: null,
        comboSuccess2: null,
        comboSuccess3: null,
        comboComplete: null,
        tooBad: null,
        successBell: null
    };
    
    /**
     * Initialise les sons du GEO-COMBO
     */
    function initComboSounds() {
        // Son en boucle quand les 3 labels sont sélectionnés
        SoundCache.comboReady = new Audio('/sounds/mapper%20sounds/mapper_geocombo_ready.mp3');
        SoundCache.comboReady.loop = true;
        SoundCache.comboReady.volume = 0.5;
        
        // Sons de succès progressifs
        SoundCache.comboSuccess1 = new Audio('/sounds/mapper%20sounds/171671__leszek_szary__success-1.wav');
        SoundCache.comboSuccess1.volume = 0.3;
        
        SoundCache.comboSuccess2 = new Audio('/sounds/mapper%20sounds/171670__leszek_szary__success-2.wav');
        SoundCache.comboSuccess2.volume = 0.4;
        
        SoundCache.comboSuccess3 = new Audio('/sounds/mapper%20sounds/109662__grunz__success.wav');
        SoundCache.comboSuccess3.volume = 0.5;
        
        SoundCache.comboComplete = new Audio('/sounds/mapper%20sounds/341985__unadamlar__goodresult.wav');
        SoundCache.comboComplete.volume = 0.6;
        
        // Son quand le GEO-COMBO est interrompu
        SoundCache.tooBad = new Audio('/sounds/mapper%20sounds/too_bad.wav');
        SoundCache.tooBad.volume = 0.5;
        
        // Son de succès normal (hors GEO-COMBO)
        SoundCache.successBell = new Audio('/sounds/mapper%20sounds/success_bell.mp3');
        SoundCache.successBell.volume = 0.4;
    }
    
    /**
     * Joue le son de succès normal (hors GEO-COMBO)
     */
    function playSuccessBellSound() {
        try {
            if (!SoundCache.successBell) {
                initComboSounds();
            }
            SoundCache.successBell.currentTime = 0;
            SoundCache.successBell.play().catch(err => {
                console.warn('⚠️ Impossible de jouer le son success_bell:', err);
            });
        } catch (err) {
            console.warn('⚠️ Erreur audio success_bell:', err);
        }
    }
    
    /**
     * Joue le son "too bad" quand le GEO-COMBO est interrompu
     */
    function playTooBadSound() {
        try {
            if (!SoundCache.tooBad) {
                initComboSounds();
            }
            SoundCache.tooBad.currentTime = 0;
            SoundCache.tooBad.play().catch(err => {
                console.warn('⚠️ Impossible de jouer le son too_bad:', err);
            });
            console.log('🎵 Son too_bad joué');
        } catch (err) {
            console.warn('⚠️ Erreur audio too_bad:', err);
        }
    }
    
    /**
     * Joue le son "GEO-COMBO prêt" en boucle
     */
    function playComboReadySound() {
        try {
            if (!SoundCache.comboReady) {
                initComboSounds();
            }
            SoundCache.comboReady.currentTime = 0;
            SoundCache.comboReady.play().catch(err => {
                console.warn('⚠️ Impossible de jouer le son combo ready:', err);
            });
            console.log('🎵 Son GEO-COMBO ready lancé');
        } catch (err) {
            console.warn('⚠️ Erreur audio combo ready:', err);
        }
    }
    
    /**
     * Arrête le son "GEO-COMBO prêt"
     */
    function stopComboReadySound() {
        try {
            if (SoundCache.comboReady) {
                SoundCache.comboReady.pause();
                SoundCache.comboReady.currentTime = 0;
                console.log('🔇 Son GEO-COMBO ready arrêté');
            }
        } catch (err) {
            console.warn('⚠️ Erreur arrêt audio combo ready:', err);
        }
    }
    
    /**
     * Joue le son de succès selon le numéro du placement dans le combo
     * @param {number} placementNumber - 1, 2 ou 3
     */
    function playComboSuccessSound(placementNumber) {
        try {
            if (!SoundCache.comboSuccess1) {
                initComboSounds();
            }
            
            let sound;
            switch (placementNumber) {
                case 1:
                    sound = SoundCache.comboSuccess1;
                    break;
                case 2:
                    sound = SoundCache.comboSuccess2;
                    break;
                case 3:
                    sound = SoundCache.comboSuccess3;
                    // Jouer aussi le son de complétion après un court délai
                    setTimeout(() => {
                        if (SoundCache.comboComplete) {
                            SoundCache.comboComplete.currentTime = 0;
                            SoundCache.comboComplete.play().catch(err => {
                                console.warn('⚠️ Impossible de jouer le son combo complete:', err);
                            });
                        }
                    }, 300);
                    break;
                default:
                    return;
            }
            
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(err => {
                    console.warn(`⚠️ Impossible de jouer le son success-${placementNumber}:`, err);
                });
                console.log(`🎵 Son succès ${placementNumber}/3 joué`);
            }
        } catch (err) {
            console.warn('⚠️ Erreur audio combo success:', err);
        }
    }
    
    /**
     * Joue le son d'erreur
     */
    function playErrorSound() {
        try {
            // Créer ou réutiliser l'objet Audio
            if (!SoundCache.error) {
                SoundCache.error = new Audio('/sounds/error.mp3');
                SoundCache.error.volume = 0.5;
            }
            
            // Réinitialiser la position et jouer
            SoundCache.error.currentTime = 0;
            SoundCache.error.play().catch(err => {
                console.warn('⚠️ Impossible de jouer le son d\'erreur:', err);
            });
        } catch (err) {
            console.warn('⚠️ Erreur audio:', err);
        }
    }
    
    /**
     * Déclenche le bonus GEO-COMBO
     */
    function triggerGeoCombo() {
        console.log('🎉🔥 GEO-COMBO COMPLÉTÉ! +30 secondes!');
        
        // Soustraire 30 secondes au temps écoulé (bonus)
        const bonusMs = 30 * 1000;
        GameState.stats.startTime += bonusMs;
        GameState.stats.elapsedTime = Math.max(0, GameState.stats.elapsedTime - bonusMs);
        
        // Mettre à jour l'affichage du timer
        updateTimerDisplay();
        
        // Ajouter l'effet de halo sur le chronomètre
        addTimerComboEffect();
        
        // Afficher la notification GEO-COMBO
        showGeoComboNotification();
        
        // Reset le combo
        resetGeoCombo();
    }
    
    /**
     * Ajoute un effet de halo autour du chronomètre pour le GEO-COMBO
     */
    function addTimerComboEffect() {
        const statusTime = GameState.elements?.statusTime;
        if (!statusTime) return;
        
        // Ajouter la classe d'effet
        statusTime.classList.add('combo-effect');
        
        // Retirer l'effet après l'animation
        setTimeout(() => {
            statusTime.classList.remove('combo-effect');
        }, 2500);
    }
    
    /**
     * Affiche la notification flottante du GEO-COMBO
     */
    function showGeoComboNotification() {
        const container = GameState.elements?.gameContainer;
        if (!container) return;
        
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = 'geo-combo-notification';
        
        const isFR = GameState.currentLanguage === 'FR';
        notification.innerHTML = `
            <div class="geo-combo-title">🔥 GEO-COMBO !</div>
            <div class="geo-combo-bonus">${isFR ? 'Vous gagnez 30 secondes !' : "You've gained an extra 30 seconds!"}</div>
        `;
        
        container.appendChild(notification);
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Supprimer après l'animation
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
    
    /**
     * Normalise l'ID d'un pays (convertit les noms de classe en codes ISO)
     * @param {string} countryId - ID ou nom de classe du pays
     * @returns {string} Code ISO du pays
     */
    function normalizeCountryId(countryId) {
        const classToCodeMap = {
            // Pays multi-territoires avec classes dans le SVG
            'Angola': 'AO',
            'Argentina': 'AR',
            'Australia': 'AU',
            'Azerbaijan': 'AZ',
            'Bahamas': 'BS',
            'Canada': 'CA',
            'Cape Verde': 'CV',
            'Chile': 'CL',
            'China': 'CN',
            'Comoros': 'KM',
            'Cyprus': 'CY',
            'Denmark': 'DK',
            'Fiji': 'FJ',
            'France': 'FR',
            'Greece': 'GR',
            'Indonesia': 'ID',
            'Italy': 'IT',
            'Japan': 'JP',
            'Malaysia': 'MY',
            'Malta': 'MT',
            'Mauritius': 'MU',
            'New Zealand': 'NZ',
            'Norway': 'NO',
            'Oman': 'OM',
            'Papua New Guinea': 'PG',
            'Philippines': 'PH',
            'Russian Federation': 'RU',
            'Samoa': 'WS',
            'Seychelles': 'SC',
            'Solomon Islands': 'SB',
            'Tonga': 'TO',
            'Trinidad and Tobago': 'TT',
            'Turkey': 'TR',
            'United Kingdom': 'GB',
            'United States': 'US',
            'Vanuatu': 'VU',
            // Anciens mappings partiels conservés pour compatibilité
            'USA': 'US',
            'Russia': 'RU'
        };
        return classToCodeMap[countryId] || countryId;
    }
    
    /**
     * Vérifie si deux pays partagent une frontière terrestre
     * @param {string} countryA - Code ISO du premier pays
     * @param {string} countryB - Code ISO du deuxième pays
     * @returns {boolean}
     */
    function areNeighbors(countryA, countryB) {
        const neighborsA = BORDERS[countryA] || [];
        const neighborsB = BORDERS[countryB] || [];
        return neighborsA.includes(countryB) || neighborsB.includes(countryA);
    }
    
    /**
     * Colore un pays avec un feedback visuel
     * @param {string} countryId - ID du pays (ou nom de classe)
     * @param {string} type - 'correct', 'wrong', ou 'neighbor'
     */
    function colorCountry(countryId, type) {
        const mapContainer = GameState.elements?.mapContainer;
        if (!mapContainer) return;
        
        const svg = mapContainer.querySelector('svg');
        if (!svg) return;
        
        // Trouver tous les paths correspondant au pays
        // Utiliser data-country-id qui est défini lors de l'initialisation
        const paths = svg.querySelectorAll(`path[data-country-id="${countryId}"]`);
        
        if (paths.length === 0) {
            console.warn(`Pays non trouvé pour coloration: ${countryId}`);
            return;
        }
        
        // Appliquer la classe de feedback
        const feedbackClass = `country-${type}`;
        paths.forEach(path => {
            path.classList.add(feedbackClass);
        });
        
        // Pour les erreurs, retirer la classe après un délai
        if (type !== 'correct') {
            setTimeout(() => {
                paths.forEach(path => {
                    path.classList.remove(feedbackClass);
                });
            }, CONFIG.display.feedbackDuration);
        }
    }
    
    /**
     * Place un label verrouillé sur le pays
     * @param {string} countryCode - Code ISO du pays
     * @param {string} targetId - ID du pays sur le SVG
     */
    function placeLockedLabel(countryCode, targetId) {
        const mapContainer = GameState.elements?.mapContainer;
        if (!mapContainer) return;
        
        const svg = mapContainer.querySelector('svg');
        if (!svg) return;
        
        // Trouver le path du pays pour calculer sa position
        // Utiliser data-country-id qui est défini lors de l'initialisation
        const targetPath = svg.querySelector(`path[data-country-id="${targetId}"]`);
        if (!targetPath) {
            console.warn(`Pays non trouvé pour placement de label: ${targetId}`);
            return;
        }
        
        // Obtenir le centre du pays
        const bbox = targetPath.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Créer le groupe pour le label
        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.classList.add('country-label-svg', 'locked-label');
        labelGroup.setAttribute('data-country', countryCode);
        
        // Créer le rectangle de fond
        const countryName = GameState.countries[countryCode] || countryCode;
        const fontSize = 10; // Taille de police plus grande
        const charWidth = fontSize * 0.6; // Largeur approximative par caractère
        const textWidth = countryName.length * charWidth;
        const paddingX = 6;
        const paddingY = 4;
        const rectHeight = fontSize + paddingY * 2;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', centerX - textWidth / 2 - paddingX);
        rect.setAttribute('y', centerY - rectHeight / 2);
        rect.setAttribute('width', textWidth + paddingX * 2);
        rect.setAttribute('height', rectHeight);
        rect.setAttribute('rx', '3');
        rect.classList.add('country-label-bg', 'locked-bg');
        
        // Créer le texte
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY + fontSize * 0.35); // Centrage vertical
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', fontSize);
        text.classList.add('country-label-text', 'locked-text');
        text.textContent = countryName;
        
        labelGroup.appendChild(rect);
        labelGroup.appendChild(text);
        svg.appendChild(labelGroup);
        
        // Faire disparaître le label après 20 secondes
        setTimeout(() => {
            labelGroup.classList.add('fading-out');
            setTimeout(() => {
                labelGroup.classList.add('hidden');
                labelGroup.classList.remove('fading-out');
            }, 500); // Durée de l'animation de fade out
        }, 20000); // 20 secondes
        
        console.log(`🏷️ Label verrouillé placé: ${countryName} sur ${targetId}`);
    }
    
    /**
     * Affiche brièvement un label caché (0.5s)
     * @param {SVGGElement} labelGroup - Le groupe SVG du label
     */
    function showLabelBriefly(labelGroup) {
        if (!labelGroup) return;
        
        // Afficher le label
        labelGroup.classList.remove('hidden');
        labelGroup.classList.add('showing');
        
        // Le cacher à nouveau après 0.5 seconde
        setTimeout(() => {
            labelGroup.classList.add('fading-out');
            setTimeout(() => {
                labelGroup.classList.add('hidden');
                labelGroup.classList.remove('fading-out', 'showing');
            }, 300);
        }, 500);
    }
    
    /**
     * Vérifie si le label correspond au pays ciblé
     * @param {string} labelCode - Code du label
     * @param {string} targetId - ID du pays ciblé
     * @returns {boolean}
     */
    function checkCountryMatch(labelCode, targetId) {
        // Comparaison directe
        if (labelCode === targetId) {
            return true;
        }
        
        // Pour les pays multi-territoires, le targetId peut être le nom du pays (classe SVG)
        // On doit mapper les noms de classe aux codes ISO
        const classToCodeMap = {
            // Pays multi-territoires avec classes dans le SVG
            'Angola': 'AO',
            'Argentina': 'AR',
            'Australia': 'AU',
            'Azerbaijan': 'AZ',
            'Bahamas': 'BS',
            'Canada': 'CA',
            'Cape Verde': 'CV',
            'Chile': 'CL',
            'China': 'CN',
            'Comoros': 'KM',
            'Cyprus': 'CY',
            'Denmark': 'DK',
            'Fiji': 'FJ',
            'France': 'FR',
            'Greece': 'GR',
            'Indonesia': 'ID',
            'Italy': 'IT',
            'Japan': 'JP',
            'Malaysia': 'MY',
            'Malta': 'MT',
            'Mauritius': 'MU',
            'New Zealand': 'NZ',
            'Norway': 'NO',
            'Oman': 'OM',
            'Papua New Guinea': 'PG',
            'Philippines': 'PH',
            'Russian Federation': 'RU',
            'Samoa': 'WS',
            'Seychelles': 'SC',
            'Solomon Islands': 'SB',
            'Tonga': 'TO',
            'Trinidad and Tobago': 'TT',
            'Turkey': 'TR',
            'United Kingdom': 'GB',
            'United States': 'US',
            'Vanuatu': 'VU',
            // Anciens mappings partiels conservés pour compatibilité
            'USA': 'US',
            'Russia': 'RU'
        };
        
        // Vérifier si le targetId est un nom de classe connu
        if (classToCodeMap[targetId] === labelCode) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Met à jour l'affichage du score
     */
    function updateScoreDisplay() {
        const statusScore = GameState.elements?.statusScore;
        if (statusScore) {
            const { correctCount } = GameState.stats;
            statusScore.textContent = `Score: ${correctCount}`;
        }
    }

    /* ========================================================================
       10. INTERFACE UTILISATEUR
       ======================================================================== */
    
    /**
     * Met à jour l'état visuel du jeu
     * @param {string} state - 'waiting', 'playing', 'paused', 'finished'
     */
    function updateGameState(state) {
        const container = GameState.elements?.gameContainer;
        if (!container) return;
        
        // Supprimer les classes d'état précédentes
        container.classList.remove(
            'game-state-waiting',
            'game-state-playing',
            'game-state-paused',
            'game-state-finished'
        );
        
        // Ajouter la nouvelle classe d'état
        container.classList.add(`game-state-${state}`);
    }

    /**
     * Met à jour les boutons de région
     */
    function updateRegionButtons() {
        const { btnRegionWorld, btnRegionEurope } = GameState.elements || {};
        
        if (btnRegionWorld) {
            btnRegionWorld.classList.toggle('active', GameState.currentRegion === 'world');
        }
        if (btnRegionEurope) {
            btnRegionEurope.classList.toggle('active', GameState.currentRegion === 'europe');
        }
    }

    /**
     * Met à jour les boutons de langue
     */
    function updateLanguageButtons() {
        const { btnLangFR, btnLangEN } = GameState.elements || {};
        
        if (btnLangFR) {
            btnLangFR.classList.toggle('active', GameState.currentLanguage === 'FR');
        }
        if (btnLangEN) {
            btnLangEN.classList.toggle('active', GameState.currentLanguage === 'EN');
        }
    }

    /**
     * Affiche le message "Prêt"
     */
    function showReadyMessage() {
        const placeholder = GameState.elements?.placeholder;
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.style.flexDirection = 'column';
            placeholder.style.alignItems = 'center';
            
            const langFR = GameState.currentLanguage === 'FR';
            const readyText = langFR ? 'Prêt !' : 'Ready!';
            const instructionText = langFR 
                ? 'Cliquez sur "Nouvelle partie" pour commencer'
                : 'Click "New Game" to start';
            
            placeholder.innerHTML = `
                <div class="placeholder-icon">🗺️</div>
                <div class="ready-message">✅ ${readyText}</div>
                <div class="placeholder-text" style="margin-top: 12px;">
                    ${instructionText}
                </div>
            `;
        }
        
        // Mettre à jour le statut
        const statusText = GameState.currentLanguage === 'FR' ? 'Prêt' : 'Ready';
        updateStatus(statusText);
        
        console.log('✅ Mapper ready');
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message
     */
    function showError(message) {
        const placeholder = document.querySelector('.placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="placeholder-icon">❌</div>
                <div class="placeholder-title" style="color: #cc0000;">Erreur</div>
                <div class="placeholder-text">${message}</div>
            `;
        }
        
        updateStatus('Erreur');
    }

    /**
     * Active les boutons de l'interface
     */
    function enableButtons() {
        const buttons = [
            'btn-new-game',
            'btn-region-world',
            'btn-region-europe',
            'btn-lang-fr',
            'btn-lang-en'
        ];
        
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = false;
            }
        });
        
        // Activer les états par défaut
        updateRegionButtons();
        updateLanguageButtons();
    }

    /**
     * Met à jour la barre de statut
     * @param {string} message
     */
    function updateStatus(message) {
        const statusMessage = GameState.elements?.statusMessage;
        if (statusMessage) {
            statusMessage.textContent = message;
        }
    }

    /* ========================================================================
       8. UTILITAIRES
       ======================================================================== */
    
    /**
     * Démarre le timer
     */
    function startTimer() {
        if (GameState.timerInterval) return;
        
        GameState.timerInterval = setInterval(() => {
            GameState.stats.elapsedTime = Date.now() - GameState.stats.startTime;
            updateTimerDisplay();
        }, 1000);
    }

    /**
     * Arrête le timer
     */
    function stopTimer() {
        if (GameState.timerInterval) {
            clearInterval(GameState.timerInterval);
            GameState.timerInterval = null;
        }
    }

    /**
     * Met à jour l'affichage du timer
     */
    function updateTimerDisplay() {
        const statusTime = GameState.elements?.statusTime;
        if (statusTime) {
            statusTime.textContent = `Temps: ${formatTime(GameState.stats.elapsedTime)}`;
        }
    }

    /**
     * Formate un temps en millisecondes en MM:SS
     * @param {number} ms - Temps en millisecondes
     * @returns {string}
     */
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /* ========================================================================
       9. ANIMATION AVION
       ======================================================================== */
    
    let planeAnimationTimeouts = [];
    
    /**
     * Démarre le système d'animation des avions (grand et petit)
     * Timing grand avion: 20s, puis 50s, puis toutes les 30s
     * Timing petit avion: 10s avant chaque grand avion (donc 10s, 40s, puis toutes les 30s)
     */
    function startPlaneAnimations() {
        // Nettoyer les timeouts précédents
        stopPlaneAnimations();
        
        // Petit avion après 10 secondes (10s avant le premier grand avion)
        planeAnimationTimeouts.push(setTimeout(() => {
            triggerSmallPlaneAnimation();
        }, 10000));
        
        // Premier grand avion après 20 secondes
        planeAnimationTimeouts.push(setTimeout(() => {
            triggerPlaneAnimation();
            
            // Petit avion après 40 secondes (10s avant le deuxième grand avion à 50s)
            planeAnimationTimeouts.push(setTimeout(() => {
                triggerSmallPlaneAnimation();
            }, 20000)); // 20s après le premier grand avion = 40s total
            
            // Deuxième grand avion après 50 secondes (30s après le premier)
            planeAnimationTimeouts.push(setTimeout(() => {
                triggerPlaneAnimation();
                
                // Ensuite toutes les 30 secondes pour le grand avion
                const bigPlaneIntervalId = setInterval(() => {
                    if (GameState.isPlaying && !isPaused) {
                        triggerPlaneAnimation();
                    }
                }, 30000);
                planeAnimationTimeouts.push(bigPlaneIntervalId);
                
                // Petit avion 10s avant chaque grand avion (donc 20s après le précédent grand avion)
                // Premier après 20s, puis toutes les 30s
                planeAnimationTimeouts.push(setTimeout(() => {
                    if (GameState.isPlaying && !isPaused) {
                        triggerSmallPlaneAnimation();
                    }
                    const smallPlaneIntervalId = setInterval(() => {
                        if (GameState.isPlaying && !isPaused) {
                            triggerSmallPlaneAnimation();
                        }
                    }, 30000);
                    planeAnimationTimeouts.push(smallPlaneIntervalId);
                }, 20000));
                
            }, 30000));
            
        }, 20000));
        
        console.log('✈️ Animation avions programmée (grand + petit)');
    }
    
    /**
     * Arrête toutes les animations d'avion en cours
     */
    function stopPlaneAnimations() {
        planeAnimationTimeouts.forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        planeAnimationTimeouts = [];
        
        // Supprimer les avions en cours d'animation
        document.querySelectorAll('.flying-plane, .flying-small-plane').forEach(el => el.remove());
    }
    
    /**
     * Déclenche une animation du petit avion volant entre pays voisins
     * Ne traverse jamais les océans - uniquement les frontières terrestres
     * 3x plus lent que le grand avion
     */
    function triggerSmallPlaneAnimation() {
        if (!GameState.isPlaying || isPaused) return;
        
        const mapContainer = GameState.elements?.mapContainer;
        const svg = mapContainer?.querySelector('svg');
        if (!svg) return;
        
        // Récupérer tous les pays de la carte qui ont des voisins terrestres
        const countries = svg.querySelectorAll('path.country-path');
        if (countries.length < 2) return;
        
        // Créer un mapping countryId -> element
        const countryMap = new Map();
        countries.forEach(country => {
            const id = country.dataset?.countryId;
            if (id) countryMap.set(id, country);
        });
        
        // Trouver un pays de départ qui a au moins un voisin terrestre présent sur la carte
        const countriesWithNeighbors = [];
        countryMap.forEach((element, countryId) => {
            const neighbors = BORDERS[countryId];
            if (neighbors && neighbors.length > 0) {
                // Vérifier qu'au moins un voisin est présent sur la carte
                const availableNeighbors = neighbors.filter(n => countryMap.has(n));
                if (availableNeighbors.length > 0) {
                    countriesWithNeighbors.push({ countryId, element, neighbors: availableNeighbors });
                }
            }
        });
        
        if (countriesWithNeighbors.length === 0) {
            console.log('🛩️ Petit avion: Aucun pays avec voisin terrestre trouvé');
            return;
        }
        
        // Choisir un pays de départ au hasard
        const startData = countriesWithNeighbors[Math.floor(Math.random() * countriesWithNeighbors.length)];
        const startCountry = startData.element;
        
        // Choisir un voisin terrestre au hasard
        const endCountryId = startData.neighbors[Math.floor(Math.random() * startData.neighbors.length)];
        const endCountry = countryMap.get(endCountryId);
        
        if (!endCountry) {
            console.log('🛩️ Petit avion: Pays voisin non trouvé sur la carte');
            return;
        }
        
        // Obtenir les positions (centres des pays)
        const startBBox = startCountry.getBBox();
        const endBBox = endCountry.getBBox();
        
        const startX = startBBox.x + startBBox.width / 2;
        const startY = startBBox.y + startBBox.height / 2;
        const endX = endBBox.x + endBBox.width / 2;
        const endY = endBBox.y + endBBox.height / 2;
        
        // Calculer l'angle de rotation pour orienter l'avion
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI) + 90;
        
        // Créer l'élément petit avion
        const plane = document.createElement('img');
        plane.src = '/assets/mapper-game/mapper_small_plane.png';
        plane.className = 'flying-small-plane';
        plane.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            pointer-events: none;
            z-index: 999;
            transform-origin: center center;
            transform: rotate(${angle}deg);
        `;
        
        // Positionner l'avion dans le conteneur SVG
        const svgRect = svg.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const viewBox = svg.viewBox.baseVal;
        
        const scaleX = svgRect.width / viewBox.width;
        const scaleY = svgRect.height / viewBox.height;
        
        const screenStartX = startX * scaleX + (svgRect.left - containerRect.left) + mapContainer.scrollLeft;
        const screenStartY = startY * scaleY + (svgRect.top - containerRect.top) + mapContainer.scrollTop;
        const screenEndX = endX * scaleX + (svgRect.left - containerRect.left) + mapContainer.scrollLeft;
        const screenEndY = endY * scaleY + (svgRect.top - containerRect.top) + mapContainer.scrollTop;
        
        plane.style.left = `${screenStartX}px`;
        plane.style.top = `${screenStartY}px`;
        
        mapContainer.appendChild(plane);
        
        // Durée de l'animation: 3x plus lent que le grand avion
        // Grand avion: 6-10s selon distance, petit avion: 18-30s
        const distance = Math.sqrt(Math.pow(screenEndX - screenStartX, 2) + Math.pow(screenEndY - screenStartY, 2));
        const baseDuration = Math.min(Math.max(distance * 15, 6000), 10000);
        const duration = baseDuration * 3; // 3x plus lent
        
        // Animation plus simple (pas de montée au milieu car voyage court)
        const animation = plane.animate([
            { 
                left: `${screenStartX}px`, 
                top: `${screenStartY}px`, 
                width: '6px', 
                height: '6px',
                opacity: 0.5
            },
            { 
                left: `${(screenStartX + screenEndX) / 2}px`, 
                top: `${(screenStartY + screenEndY) / 2}px`,
                width: '20px', 
                height: '20px',
                opacity: 1,
                offset: 0.5
            },
            { 
                left: `${screenEndX}px`, 
                top: `${screenEndY}px`, 
                width: '6px', 
                height: '6px',
                opacity: 0.5
            }
        ], {
            duration: duration,
            easing: 'ease-in-out',
            fill: 'forwards'
        });
        
        animation.onfinish = () => {
            plane.remove();
        };
        
        console.log(`🛩️ Petit avion en vol: ${startData.countryId} → ${endCountryId} (voisins terrestres)`);
    }

    /**
     * Déclenche une animation d'avion volant d'un pays à un autre
     */
    function triggerPlaneAnimation() {
        if (!GameState.isPlaying || isPaused) return;
        
        const mapContainer = GameState.elements?.mapContainer;
        const svg = mapContainer?.querySelector('svg');
        if (!svg) return;
        
        // Récupérer tous les pays de la carte
        const countries = svg.querySelectorAll('path.country-path');
        if (countries.length < 2) return;
        
        // Choisir deux pays au hasard (départ et arrivée)
        const countryArray = Array.from(countries);
        const startCountry = countryArray[Math.floor(Math.random() * countryArray.length)];
        let endCountry = countryArray[Math.floor(Math.random() * countryArray.length)];
        
        // S'assurer que c'est un pays différent
        while (endCountry === startCountry) {
            endCountry = countryArray[Math.floor(Math.random() * countryArray.length)];
        }
        
        // Obtenir les positions (centres des pays)
        const startBBox = startCountry.getBBox();
        const endBBox = endCountry.getBBox();
        
        const startX = startBBox.x + startBBox.width / 2;
        const startY = startBBox.y + startBBox.height / 2;
        const endX = endBBox.x + endBBox.width / 2;
        const endY = endBBox.y + endBBox.height / 2;
        
        // Calculer l'angle de rotation pour orienter l'avion
        // L'image de l'avion pointe vers le haut par défaut, donc on ajoute 90° pour l'orienter correctement
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI) + 90;
        
        // Créer l'élément avion
        const plane = document.createElement('img');
        plane.src = '/assets/mapper-game/mapper-plane.png';
        plane.className = 'flying-plane';
        plane.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            pointer-events: none;
            z-index: 1000;
            transform-origin: center center;
            transform: rotate(${angle}deg);
        `;
        
        // Positionner l'avion dans le conteneur SVG
        // Convertir les coordonnées SVG en coordonnées écran
        const svgRect = svg.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const viewBox = svg.viewBox.baseVal;
        
        const scaleX = svgRect.width / viewBox.width;
        const scaleY = svgRect.height / viewBox.height;
        
        const screenStartX = startX * scaleX + (svgRect.left - containerRect.left) + mapContainer.scrollLeft;
        const screenStartY = startY * scaleY + (svgRect.top - containerRect.top) + mapContainer.scrollTop;
        const screenEndX = endX * scaleX + (svgRect.left - containerRect.left) + mapContainer.scrollLeft;
        const screenEndY = endY * scaleY + (svgRect.top - containerRect.top) + mapContainer.scrollTop;
        
        plane.style.left = `${screenStartX}px`;
        plane.style.top = `${screenStartY}px`;
        
        mapContainer.appendChild(plane);
        
        // Durée de l'animation (6-10 secondes selon la distance) - plus lent pour un effet réaliste
        const distance = Math.sqrt(Math.pow(screenEndX - screenStartX, 2) + Math.pow(screenEndY - screenStartY, 2));
        const duration = Math.min(Math.max(distance * 15, 6000), 10000); // Entre 6 et 10 secondes
        
        // Animation avec Web Animations API
        const animation = plane.animate([
            { 
                left: `${screenStartX}px`, 
                top: `${screenStartY}px`, 
                width: '8px', 
                height: '8px',
                opacity: 0.3
            },
            { 
                left: `${(screenStartX + screenEndX) / 2}px`, 
                top: `${(screenStartY + screenEndY) / 2 - 30}px`, // Monte un peu au milieu
                width: '32px', 
                height: '32px',
                opacity: 1,
                offset: 0.5
            },
            { 
                left: `${screenEndX}px`, 
                top: `${screenEndY}px`, 
                width: '8px', 
                height: '8px',
                opacity: 0.3
            }
        ], {
            duration: duration,
            easing: 'ease-in-out',
            fill: 'forwards'
        });
        
        animation.onfinish = () => {
            plane.remove();
        };
        
        console.log(`✈️ Avion en vol: ${startCountry.dataset?.countryId || 'pays'} → ${endCountry.dataset?.countryId || 'pays'}`);
    }

    /* ========================================================================
       DÉMARRAGE
       ======================================================================== */
    
    // Exposer certaines fonctions globalement pour le débogage
    window.MapperGame = {
        init,
        startNewGame,
        setRegion,
        setLanguage,
        selectLanguage,
        showLanguageModal,
        hideLanguageModal,
        startCountdown,
        renderMap,
        generateShuffledLabels,
        handleDrop,
        startTimer,
        stopTimer,
        updateRulesContent,
        getState: () => GameState
    };
    
    // Exposer updateRulesContent globalement pour setPause
    window.updateRulesContent = updateRulesContent;

    // Connecter les fonctions de timer aux variables globales pour la pause
    pauseStartTimer = startTimer;
    pauseStopTimer = stopTimer;

    // Lancer l'initialisation
    init();

})();
