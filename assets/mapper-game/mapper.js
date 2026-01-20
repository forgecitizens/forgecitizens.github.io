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
            min: 1,
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
        consecutiveErrors: 0
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
            difficultyEasy: document.getElementById('difficulty-easy'),
            difficultyHard: document.getElementById('difficulty-hard')
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
        if (elements.difficultyEasy) {
            elements.difficultyEasy.addEventListener('click', () => selectDifficulty('easy'));
        }
        
        if (elements.difficultyHard) {
            elements.difficultyHard.addEventListener('click', () => selectDifficulty('hard'));
        }
        
        // Initialiser la modale des crédits
        initCreditsModal();
        
        console.log('✅ Mapper: UI initialisée');
    }
    
    /**
     * Initialise la modale des crédits
     */
    function initCreditsModal() {
        const btnCredits = document.getElementById('btn-credits');
        const creditsOverlay = document.getElementById('credits-modal-overlay');
        const creditsCloseBtn = document.getElementById('credits-close-btn');
        
        if (btnCredits && creditsOverlay) {
            // Ouvrir la modale au clic sur "Crédits"
            btnCredits.addEventListener('click', () => {
                showCreditsModal();
            });
            
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
        
        // Mettre à jour l'interface
        updateGameState('playing');
        
        console.log('🎮 Mapper: Partie démarrée !');
    }
    
    /**
     * Réinitialise le zoom à 100%
     */
    function resetZoom() {
        const mapContainer = GameState.elements?.mapContainer;
        const svg = mapContainer?.querySelector('svg');
        
        if (svg && GameState.zoom) {
            GameState.zoom.scale = CONFIG.zoom.default;
            svg.style.transform = `scale(${CONFIG.zoom.default})`;
            mapContainer.scrollLeft = 0;
            mapContainer.scrollTop = 0;
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
            updateGameState('paused');
        } else {
            startTimer();
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
        updateGameState('finished');
        
        // Afficher le score final
        const stats = GameState.stats;
        console.log(`📊 Score: ${stats.correctCount}/${stats.totalCountries}`);
        console.log(`⏱️ Temps: ${formatTime(stats.elapsedTime)}`);
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
        
        // Labels et descriptions
        const easyLabelEl = document.getElementById('difficulty-easy-label');
        const easyDescEl = document.getElementById('difficulty-easy-desc');
        const hardLabelEl = document.getElementById('difficulty-hard-label');
        const hardDescEl = document.getElementById('difficulty-hard-desc');
        
        if (easyLabelEl) {
            easyLabelEl.textContent = lang === 'FR' ? 'Facile' : 'Easy';
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
                ? 'Vous devez trouver les pays et les îles' 
                : 'You must find both countries and islands';
        }
    }
    
    /**
     * Sélection de la difficulté depuis la modale
     * @param {string} difficulty - 'easy' ou 'hard'
     */
    function selectDifficulty(difficulty) {
        console.log(`🗺️ Mapper: Difficulté sélectionnée → ${difficulty}`);
        
        // Marquer le bouton comme sélectionné visuellement
        const easyBtn = GameState.elements?.difficultyEasy;
        const hardBtn = GameState.elements?.difficultyHard;
        
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
            let jsonPath;
            if (GameState.currentDifficulty === 'easy') {
                jsonPath = lang === 'FR' 
                    ? CONFIG.paths.countriesEasyFR 
                    : CONFIG.paths.countriesEasyEN;
            } else {
                jsonPath = lang === 'FR' 
                    ? CONFIG.paths.countriesFR 
                    : CONFIG.paths.countriesEN;
            }
            
            // Charger en parallèle les pays et la carte SVG
                // Déterminer le chemin du fichier de scoring
                let scoringPath;
                if (GameState.currentDifficulty === 'easy') {
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

                // Stocker les données
                GameState.countries = countries;
                GameState.svgContent = svgContent;
                GameState.scoring = scoring;

                const countryCount = Object.keys(countries).length;

            console.log(`✅ Mapper: ${countryCount} pays chargés (${lang})`);
            console.log('✅ Mapper: Carte SVG chargée');
            
            return true;
        } catch (error) {
            throw new Error(`Erreur de chargement: ${error.message}`);
        }
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
         * Zoom vers le point de la souris (comme Google Maps)
         * Le point sous le curseur reste fixe pendant le zoom
         * 
         * Algorithme:
         * 1. Calculer la position de la souris dans le conteneur
         * 2. Calculer quelle coordonnée SVG est sous cette position (tenant compte du scroll et scale)
         * 3. Appliquer le nouveau scale
         * 4. Calculer le nouveau scroll pour que la même coordonnée SVG reste sous la souris
         */
        function zoomToPoint(newScale, clientX, clientY) {
            const oldScale = zoomState.scale;
            
            // S'assurer que les scales sont valides
            if (!oldScale || oldScale <= 0) {
                console.warn('⚠️ oldScale invalide, reset à 1');
                zoomState.scale = 1;
                return zoomToPoint(newScale, clientX, clientY);
            }
            
            // Position de la souris relative au conteneur
            const containerRect = container.getBoundingClientRect();
            const mouseX = clientX - containerRect.left;
            const mouseY = clientY - containerRect.top;
            
            // Vérifier que la souris est dans le conteneur
            if (mouseX < 0 || mouseY < 0 || mouseX > containerRect.width || mouseY > containerRect.height) {
                console.warn('⚠️ Souris hors du conteneur');
                return;
            }
            
            // Sauvegarder les valeurs avant modification
            const oldScrollLeft = container.scrollLeft;
            const oldScrollTop = container.scrollTop;
            
            // Position absolue dans le contenu scrollé (à l'échelle actuelle)
            const contentX = oldScrollLeft + mouseX;
            const contentY = oldScrollTop + mouseY;
            
            // Coordonnées dans le SVG original (non-zoomé)
            const svgX = contentX / oldScale;
            const svgY = contentY / oldScale;
            
            // Appliquer le nouveau scale
            zoomState.scale = newScale;
            svg.style.transform = `scale(${newScale})`;
            
            // Calculer la nouvelle position de ce point SVG après zoom
            const newContentX = svgX * newScale;
            const newContentY = svgY * newScale;
            
            // Calculer le nouveau scroll
            const newScrollLeft = newContentX - mouseX;
            const newScrollTop = newContentY - mouseY;
            
            // Appliquer le scroll (avec clamp pour éviter les valeurs négatives)
            container.scrollLeft = Math.max(0, newScrollLeft);
            container.scrollTop = Math.max(0, newScrollTop);
        }
        
        // Zoom avec la molette
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Calculer le nouveau scale
            const direction = e.deltaY > 0 ? -1 : 1;
            const newScale = Math.max(
                CONFIG.zoom.min,
                Math.min(CONFIG.zoom.max, zoomState.scale + direction * CONFIG.zoom.step)
            );
            
            if (newScale !== zoomState.scale) {
                zoomToPoint(newScale, e.clientX, e.clientY);
                console.log(`🔍 Zoom: ${Math.round(newScale * 100)}%`);
            }
            
        }, { passive: false });
        
        // Pan avec clic gauche maintenu (bouton molette ou clic normal)
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
        
        // Support tactile pour le pan
        let touchStartX, touchStartY;
        
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                zoomState.scrollLeft = container.scrollLeft;
                zoomState.scrollTop = container.scrollTop;
            }
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && touchStartX !== undefined) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                
                container.scrollLeft = zoomState.scrollLeft - dx;
                container.scrollTop = zoomState.scrollTop - dy;
            }
        }, { passive: true });
        
        console.log('✅ Mapper: Zoom/Pan configuré');
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
        refreshBtn.innerHTML = '🔄';
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
            }
        } else {
            // Désactiver le combo si on désélectionne un label
            if (GameState.geoCombo.active) {
                resetGeoCombo(true); // Jouer too_bad car désélection
            }
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
        
        // Vérifier qu'au moins un label est sélectionné
        if (GameState.selectedLabels.length === 0) {
            console.log('ℹ️ Sélectionnez d\'abord un pays dans la liste');
            return;
        }
        
        const targetCountryId = countryPath.dataset.countryId;
        
        // Chercher si le pays cliqué correspond à un des labels sélectionnés
        const matchingLabel = GameState.selectedLabels.find(code => checkCountryMatch(code, targetCountryId));
        if (matchingLabel) {
            // Placement normal
            const labelElement = document.querySelector(`.country-label[data-country-code="${matchingLabel}"]`);
            handleDrop(matchingLabel, targetCountryId, labelElement);
        } else {
            // Aucun label sélectionné ne correspond à ce pays
            // Si GEO-COMBO actif, c'est une erreur !
            if (GameState.geoCombo.active) {
                // On simule une erreur GEO-COMBO (comme si on avait tenté de placer un label sur le mauvais pays)
                // On prend arbitrairement le premier label sélectionné pour l'erreur
                const fakeLabel = GameState.selectedLabels[0];
                handleDrop(fakeLabel, targetCountryId, null);
            }
            // Sinon, ne rien faire
        }
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

                // Animation du déplacement
                anim.animate([
                    { transform: `translate(0, 0) scale(1)`, opacity: 1 },
                    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.3)`, opacity: 1 },
                    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)`, opacity: 0.2 }
                ], {
                    duration: 900,
                    easing: 'cubic-bezier(0.4,0.8,0.2,1)'
                });

                setTimeout(() => {
                    anim.remove();
                }, 950);

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
        tooBad: null
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
            'Angola': 'AO', 'Argentina': 'AR', 'Australia': 'AU', 'Azerbaijan': 'AZ',
            'Canada': 'CA', 'Chile': 'CL', 'China': 'CN', 'Croatia': 'HR',
            'Denmark': 'DK', 'Ecuador': 'EC', 'Equatorial': 'GQ', 'France': 'FR',
            'Greece': 'GR', 'India': 'IN', 'Indonesia': 'ID', 'Italy': 'IT',
            'Japan': 'JP', 'Malaysia': 'MY', 'New': 'NZ', 'Norway': 'NO',
            'Oman': 'OM', 'Philippines': 'PH', 'Portugal': 'PT', 'Russia': 'RU',
            'South': 'ZA', 'Spain': 'ES', 'United': 'US', 'USA': 'US'
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
        let paths = [];
        
        // Chercher par ID
        const pathById = svg.getElementById(countryId);
        if (pathById) {
            paths.push(pathById);
        }
        
        // Chercher par classe (pour les pays multi-territoires)
        const pathsByClass = svg.querySelectorAll(`.${countryId}`);
        pathsByClass.forEach(p => paths.push(p));
        
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
        let targetPath = svg.getElementById(targetId);
        if (!targetPath) {
            // Essayer par classe
            targetPath = svg.querySelector(`.${targetId}`);
        }
        if (!targetPath) return;
        
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
        
        // Ajouter un événement de clic sur le pays pour réafficher brièvement le label
        const allPaths = svg.querySelectorAll(`#${targetId}, .${targetId}`);
        allPaths.forEach(path => {
            path.addEventListener('click', (e) => {
                // Seulement si le pays est correct (vert)
                if (path.classList.contains('country-correct')) {
                    e.stopPropagation();
                    showLabelBriefly(labelGroup);
                }
            });
        });
        
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
        
        // Pour les pays multi-territoires, le targetId peut être le nom du pays
        // On doit mapper les noms de classe aux codes ISO
        const classToCodeMap = {
            'Angola': 'AO',
            'Argentina': 'AR',
            'Australia': 'AU',
            'Azerbaijan': 'AZ',
            'Canada': 'CA',
            'Chile': 'CL',
            'China': 'CN',
            'Croatia': 'HR',
            'Denmark': 'DK',
            'Ecuador': 'EC',
            'Equatorial': 'GQ', // Equatorial Guinea
            'France': 'FR',
            'Greece': 'GR',
            'India': 'IN',
            'Indonesia': 'ID',
            'Italy': 'IT',
            'Japan': 'JP',
            'Malaysia': 'MY',
            'New': 'NZ', // New Zealand
            'Norway': 'NO',
            'Oman': 'OM',
            'Philippines': 'PH',
            'Portugal': 'PT',
            'Russia': 'RU',
            'South': 'ZA', // South Africa (mais pourrait être South Korea...)
            'Spain': 'ES',
            'United': 'US', // United States (mais pourrait être UK...)
            'USA': 'US'
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
            const { correctCount, totalCountries } = GameState.stats;
            statusScore.textContent = `Score: ${correctCount}/${totalCountries}`;
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
        getState: () => GameState
    };

    // Lancer l'initialisation
    init();

})();
