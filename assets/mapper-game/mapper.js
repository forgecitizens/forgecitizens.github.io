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
            worldSVG: '/assets/mapper-game/world.svg'
        },
        
        // Paramètres du jeu
        game: {
            defaultLanguage: 'FR',
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
        }
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
            flagEN: document.getElementById('flag-en')
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
        
        console.log('✅ Mapper: UI initialisée');
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
        
        // Mettre à jour le statut
        const loadingText = lang === 'FR' ? 'Chargement...' : 'Loading...';
        updateStatus(loadingText);
        
        // Charger les ressources pour cette langue
        loadResourcesForLanguage(lang)
            .then(() => {
                console.log(`✅ Mapper: Ressources ${lang} chargées`);
                
                // Cacher la modale
                hideLanguageModal();
                
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
        console.log(`🗺️ Mapper: Chargement ressources ${lang}...`);
        
        try {
            // Déterminer le chemin du fichier JSON
            const jsonPath = lang === 'FR' 
                ? CONFIG.paths.countriesFR 
                : CONFIG.paths.countriesEN;
            
            // Charger en parallèle les pays et la carte SVG
            const [countries, svgContent] = await Promise.all([
                loadJSON(jsonPath),
                loadSVG(CONFIG.paths.worldSVG)
            ]);
            
            // Stocker les données
            GameState.countries = countries;
            GameState.svgContent = svgContent;
            
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
                    
                    // Afficher la carte
                    renderMap();
                    
                    // Générer et afficher les labels mélangés
                    generateShuffledLabels();
                    
                    // Activer les boutons
                    enableButtons();
                    
                    // Mettre à jour le statut
                    const readyText = GameState.currentLanguage === 'FR' ? 'Prêt' : 'Ready';
                    updateStatus(readyText);
                    
                    console.log('✅ Mapper: Carte affichée !');
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
        
        // Pan avec clic gauche maintenu (bouton molette ou clic normal quand zoomé)
        container.addEventListener('mousedown', (e) => {
            // Ignorer si on drag un label
            if (GameState.draggedLabel) return;
            
            // Ignorer si on clique sur un label draggable (pas les locked qui ont pointer-events: none)
            if (e.target.closest('.country-label.draggable')) return;
            
            // Activer le pan si on est zoomé (clic gauche) ou avec le bouton molette (toujours)
            const isMiddleClick = e.button === 1;
            const isLeftClickZoomed = e.button === 0 && zoomState.scale > 1;
            
            if (isMiddleClick || isLeftClickZoomed) {
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
            if (e.touches.length === 1 && zoomState.scale > 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                zoomState.scrollLeft = container.scrollLeft;
                zoomState.scrollTop = container.scrollTop;
            }
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && zoomState.scale > 1 && touchStartX !== undefined) {
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
        
        // Vider les labels actuels
        wrapper.innerHTML = '';
        GameState.currentDisplayedLabels = [];
        
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
     * Crée un label draggable
     * @param {string} countryCode - Code ISO du pays
     * @param {string} countryName - Nom du pays
     * @returns {HTMLElement}
     */
    function createDraggableLabel(countryCode, countryName) {
        const label = document.createElement('div');
        label.className = 'country-label draggable';
        label.textContent = countryName;
        label.dataset.countryCode = countryCode;
        label.dataset.countryName = countryName;
        label.draggable = true;
        
        // Événements de drag HTML5
        label.addEventListener('dragstart', handleDragStart);
        label.addEventListener('dragend', handleDragEnd);
        
        // Support tactile (pointer events)
        label.addEventListener('pointerdown', handlePointerDown);
        
        return label;
    }
    
    /**
     * Gère le début du drag (HTML5)
     * @param {DragEvent} e
     */
    function handleDragStart(e) {
        const label = e.target;
        
        // Stocker les données du label
        e.dataTransfer.setData('text/plain', label.dataset.countryCode);
        e.dataTransfer.setData('application/json', JSON.stringify({
            code: label.dataset.countryCode,
            name: label.dataset.countryName
        }));
        e.dataTransfer.effectAllowed = 'move';
        
        // Marquer comme en cours de drag
        label.classList.add('dragging');
        GameState.draggedLabel = label;
        
        console.log(`🎯 Drag start: ${label.dataset.countryName} (${label.dataset.countryCode})`);
    }
    
    /**
     * Gère la fin du drag (HTML5)
     * @param {DragEvent} e
     */
    function handleDragEnd(e) {
        const label = e.target;
        label.classList.remove('dragging');
        GameState.draggedLabel = null;
    }
    
    /**
     * Gère le pointer down pour le support tactile
     * @param {PointerEvent} e
     */
    function handlePointerDown(e) {
        // Ne pas interférer avec le drag HTML5 sur desktop
        if (e.pointerType === 'mouse') return;
        
        const label = e.target.closest('.country-label');
        if (!label) return;
        
        e.preventDefault();
        
        // Créer un clone pour le drag tactile
        const clone = label.cloneNode(true);
        clone.classList.add('dragging', 'touch-drag');
        clone.style.position = 'fixed';
        clone.style.zIndex = '10000';
        clone.style.pointerEvents = 'none';
        clone.style.left = `${e.clientX - 50}px`;
        clone.style.top = `${e.clientY - 15}px`;
        document.body.appendChild(clone);
        
        GameState.touchDrag = {
            label: label,
            clone: clone,
            startX: e.clientX,
            startY: e.clientY
        };
        
        // Écouter les mouvements
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('pointercancel', handlePointerCancel);
    }
    
    /**
     * Gère le mouvement du pointer (tactile)
     * @param {PointerEvent} e
     */
    function handlePointerMove(e) {
        if (!GameState.touchDrag) return;
        
        const clone = GameState.touchDrag.clone;
        clone.style.left = `${e.clientX - 50}px`;
        clone.style.top = `${e.clientY - 15}px`;
    }
    
    /**
     * Gère le relâchement du pointer (tactile)
     * @param {PointerEvent} e
     */
    function handlePointerUp(e) {
        if (!GameState.touchDrag) return;
        
        const { label, clone } = GameState.touchDrag;
        
        // Trouver le pays sous le curseur
        clone.style.display = 'none';
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        clone.remove();
        
        // Vérifier si c'est un pays
        const countryPath = elementBelow?.closest('path.country-path');
        if (countryPath) {
            const targetCountryId = countryPath.dataset.countryId;
            const labelCountryCode = label.dataset.countryCode;
            
            handleDrop(labelCountryCode, targetCountryId, label);
        }
        
        // Nettoyer
        cleanupTouchDrag();
    }
    
    /**
     * Gère l'annulation du pointer (tactile)
     */
    function handlePointerCancel() {
        cleanupTouchDrag();
    }
    
    /**
     * Nettoie l'état du drag tactile
     */
    function cleanupTouchDrag() {
        if (GameState.touchDrag?.clone) {
            GameState.touchDrag.clone.remove();
        }
        GameState.touchDrag = null;
        
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerCancel);
    }
    
    /**
     * Configure les événements de drop sur la carte
     * @param {SVGElement} svg
     */
    function setupDropZones(svg) {
        const mapContainer = GameState.elements?.mapContainer;
        if (!mapContainer) return;
        
        // Permettre le drop sur le conteneur de la carte
        mapContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        mapContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Récupérer les données du label
            const countryCode = e.dataTransfer.getData('text/plain');
            if (!countryCode) return;
            
            // Trouver le pays sous le curseur
            const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
            const countryPath = elementBelow?.closest('path.country-path');
            
            if (countryPath) {
                const targetCountryId = countryPath.dataset.countryId;
                handleDrop(countryCode, targetCountryId, GameState.draggedLabel);
            }
        });
        
        console.log('✅ Mapper: Drop zones configurées');
    }
    
    /**
     * Gère le dépôt d'un label sur un pays
     * @param {string} labelCountryCode - Code du pays du label
     * @param {string} targetCountryId - ID du pays ciblé
     * @param {HTMLElement} labelElement - Élément du label
     */
    function handleDrop(labelCountryCode, targetCountryId, labelElement) {
        console.log(`📍 Drop: Label "${labelCountryCode}" sur pays "${targetCountryId}"`);
        
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
            
            // Retirer de la liste des labels affichés
            GameState.currentDisplayedLabels = GameState.currentDisplayedLabels.filter(
                code => code !== labelCountryCode
            );
            
            // Mettre à jour les statistiques
            GameState.stats.correctCount++;
            GameState.remainingLabels = GameState.remainingLabels.filter(
                code => code !== labelCountryCode
            );
            GameState.placedLabels.push(labelCountryCode);
            
            // Mettre à jour l'affichage du score
            updateScoreDisplay();
            
            // Si tous les labels visibles ont été placés, en afficher de nouveaux
            if (GameState.currentDisplayedLabels.length === 0 && GameState.remainingLabels.length > 0) {
                console.log('📋 Affichage de nouveaux labels...');
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
            
            // Mettre à jour les statistiques
            GameState.stats.wrongCount++;
            updateScoreDisplay();
        }
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
        
        console.log(`🏷️ Label verrouillé placé: ${countryName} sur ${targetId}`);
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
