// Gallery Module - Système de galerie photo réutilisable
// Repository: forgecitizens.github.io

const GalleryModule = (function() {
    'use strict';

    // État du module
    let state = {
        currentGallery: null,
        currentImageIndex: 0,
        images: [],
        galleries: [],
        navigationStack: [], // Pile de navigation pour le retour
        isViewerOpen: false,
        touchStartX: 0,
        touchEndX: 0
    };

    // Configuration
    const config = {
        basePath: '/assets/img/galleries/',
        sizes: {
            thumb: 'thumb',
            medium: 'medium',
            full: 'full'
        },
        breakpoints: {
            useFullSize: 1200
        }
    };

    /**
     * Encode un chemin de galerie pour les URL (gère les espaces et caractères spéciaux)
     * @param {string} path - Chemin à encoder
     * @returns {string} - Chemin encodé
     */
    function encodeGalleryPath(path) {
        return path.split('/').map(part => encodeURIComponent(part)).join('/');
    }

    /**
     * Charge les métadonnées d'une galerie ou collection
     * Essaie d'abord collection.json, puis gallery.json
     * @param {string} galleryId - ID de la galerie (chemin relatif du dossier)
     * @returns {Promise<Object>} - Métadonnées de la galerie/collection
     */
    async function loadGalleryData(galleryId) {
        const encodedPath = encodeGalleryPath(galleryId);
        
        // Essayer d'abord collection.json (pour les collections parent)
        try {
            const collectionPath = `${config.basePath}${encodedPath}/collection.json`;
            const response = await fetch(collectionPath);
            if (response.ok) {
                const data = await response.json();
                data.type = 'collection';
                return data;
            }
        } catch (e) {
            // Pas une collection, continuer
        }
        
        // Sinon charger gallery.json
        try {
            const jsonPath = `${config.basePath}${encodedPath}/gallery.json`;
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`Gallery not found: ${galleryId}`);
            const data = await response.json();
            data.type = 'gallery';
            return data;
        } catch (error) {
            console.error('Error loading gallery:', error);
            return null;
        }
    }

    /**
     * Génère l'URL d'une image
     * @param {string} galleryId - ID de la galerie (chemin relatif)
     * @param {string} imageId - ID de l'image
     * @param {string} size - Taille (thumb, medium, full)
     * @returns {string} - URL de l'image
     */
    function getImageUrl(galleryId, imageId, size = 'medium') {
        const encodedPath = encodeGalleryPath(galleryId);
        return `${config.basePath}${encodedPath}/${size}/${imageId}.webp`;
    }

    /**
     * Génère le HTML pour l'icône d'un dossier (image ou emoji)
     * @param {Object} data - Données de la galerie/collection
     * @param {string} galleryId - ID de la galerie pour construire le chemin
     * @param {boolean} isCollection - True si c'est une collection
     * @returns {string} - HTML de l'icône
     */
    function getFolderIconHtml(data, galleryId, isCollection = false) {
        if (data.icon) {
            const encodedPath = encodeGalleryPath(galleryId);
            const iconUrl = `${config.basePath}${encodedPath}/${data.icon}`;
            return `<img src="${iconUrl}" alt="" class="folder-icon-img">`;
        }
        return isCollection ? '🗂️' : '📁';
    }

    /**
     * Affiche la vue Collections (liste des dossiers)
     * @param {HTMLElement} container - Conteneur de la vue
     * @param {Array} galleries - Liste des galeries disponibles
     */
    async function renderCollectionsView(container, galleries) {
        // Stocker la liste des galeries dans l'état
        state.galleries = galleries;
        
        container.innerHTML = `
            <div class="info-section">
                <h3 class="section-title">🎨 Collections d'images générées par IA</h3>
                <p style="margin: 0; font-size: 11px; color: #666;">
                    Explorez des collections d'images créées avec l'intelligence artificielle générative.
                </p>
            </div>
            <div class="gallery-folders" id="gallery-folders"></div>
        `;

        const foldersContainer = container.querySelector('#gallery-folders');

        for (const galleryId of galleries) {
            const data = await loadGalleryData(galleryId);
            if (data) {
                const folder = document.createElement('div');
                folder.className = 'gallery-folder';
                folder.dataset.galleryId = galleryId;
                
                // Détecter si c'est une collection ou une galerie
                const isCollection = data.type === 'collection';
                const count = isCollection 
                    ? `${data.subGalleries.length} collection(s)` 
                    : `${data.images.length} images`;
                
                const iconHtml = getFolderIconHtml(data, galleryId, isCollection);
                
                folder.innerHTML = `
                    <div class="folder-icon">${iconHtml}</div>
                    <div class="folder-name">${data.title}</div>
                    <div class="folder-count">${count}</div>
                `;
                
                folder.addEventListener('click', () => {
                    if (isCollection) {
                        openCollectionView(container, galleryId, data);
                    } else {
                        openGalleryGrid(container, galleryId);
                    }
                });
                foldersContainer.appendChild(folder);
            }
        }
    }

    /**
     * Affiche la vue d'une collection (liste des sous-galeries)
     * @param {HTMLElement} container - Conteneur de la vue
     * @param {string} collectionId - ID de la collection
     * @param {Object} data - Données de la collection
     */
    async function openCollectionView(container, collectionId, data) {
        if (typeof playClickSound === 'function') playClickSound();
        
        // Ajouter à la pile de navigation
        state.navigationStack.push({ type: 'root', galleries: state.galleries });
        
        container.innerHTML = `
            <div class="gallery-header">
                <button class="gallery-back-btn" id="gallery-back">
                    ← Retour aux collections
                </button>
            </div>
            <div class="gallery-intro">
                <h3 class="gallery-title">${data.title}</h3>
                <p class="gallery-subtitle">${data.subtitle || ''}</p>
                <p class="gallery-description">${data.intro || ''}</p>
            </div>
            <div class="gallery-folders" id="gallery-folders"></div>
        `;
        
        // Bouton retour
        container.querySelector('#gallery-back').addEventListener('click', () => {
            if (typeof playClickSound === 'function') playClickSound();
            state.navigationStack.pop();
            renderCollectionsView(container, state.galleries);
        });
        
        const foldersContainer = container.querySelector('#gallery-folders');
        
        for (const subGalleryName of data.subGalleries) {
            const subGalleryId = `${collectionId}/${subGalleryName}`;
            const subData = await loadGalleryData(subGalleryId);
            
            if (subData) {
                const folder = document.createElement('div');
                folder.className = 'gallery-folder';
                folder.dataset.galleryId = subGalleryId;
                const subIconHtml = getFolderIconHtml(subData, subGalleryId, false);
                folder.innerHTML = `
                    <div class="folder-icon">${subIconHtml}</div>
                    <div class="folder-name">${subData.title}</div>
                    <div class="folder-count">${subData.images.length} images</div>
                `;
                folder.addEventListener('click', () => {
                    // Ajouter la collection à la pile avant d'ouvrir la sous-galerie
                    state.navigationStack.push({ type: 'collection', id: collectionId, data: data });
                    openGalleryGrid(container, subGalleryId, collectionId);
                });
                foldersContainer.appendChild(folder);
            }
        }
        
        updateFooter(`🗂️ ${data.subGalleries.length} collection(s) dans "${data.title}"`);
    }

    /**
     * Affiche la grille de miniatures d'une galerie
     * @param {HTMLElement} container - Conteneur de la vue
     * @param {string} galleryId - ID de la galerie
     */
    async function openGalleryGrid(container, galleryId) {
        const data = await loadGalleryData(galleryId);
        if (!data) return;

        state.currentGallery = galleryId;
        state.images = data.images;

        // Jouer le son de clic
        if (typeof playClickSound === 'function') {
            playClickSound();
        }

        // Déterminer le texte du bouton retour
        const lastNav = state.navigationStack[state.navigationStack.length - 1];
        const backLabel = lastNav && lastNav.type === 'collection' 
            ? `← Retour à ${lastNav.data.title}`
            : '← Retour aux collections';

        container.innerHTML = `
            <div class="gallery-header">
                <button class="gallery-back-btn" id="gallery-back">
                    ${backLabel}
                </button>
            </div>
            <div class="gallery-intro">
                <h3 class="gallery-title">${data.title}</h3>
                <p class="gallery-subtitle">${data.subtitle || ''}</p>
                <p class="gallery-description">${data.intro || ''}</p>
            </div>
            <div class="gallery-grid" id="gallery-grid"></div>
        `;

        // Bouton retour - naviguer vers le parent approprié
        container.querySelector('#gallery-back').addEventListener('click', () => {
            if (typeof playClickSound === 'function') playClickSound();
            
            const nav = state.navigationStack.pop();
            if (nav && nav.type === 'collection') {
                // Retourner à la vue collection
                openCollectionView(container, nav.id, nav.data);
                // Retirer l'entrée ajoutée par openCollectionView puisqu'on y retourne
                state.navigationStack.pop();
            } else {
                // Retourner à la racine
                renderCollectionsView(container, state.galleries);
            }
        });

        // Grille de miniatures
        const grid = container.querySelector('#gallery-grid');
        
        data.images.forEach((image, index) => {
            const thumbUrl = getImageUrl(galleryId, image.id, 'thumb');
            const item = document.createElement('div');
            item.className = 'gallery-thumb';
            item.innerHTML = `
                <img 
                    src="${thumbUrl}" 
                    alt="${image.caption || data.title + ' - ' + (index + 1)}"
                    loading="lazy"
                    decoding="async"
                >
            `;
            item.addEventListener('click', () => openViewer(container, index));
            grid.appendChild(item);
        });

        // Mettre à jour le footer
        updateFooter(`📷 ${data.images.length} image(s) dans "${data.title}"`);
    }

    /**
     * Ouvre le viewer d'images
     * @param {HTMLElement} container - Conteneur parent
     * @param {number} index - Index de l'image à afficher
     */
    function openViewer(container, index) {
        state.currentImageIndex = index;
        state.isViewerOpen = true;

        if (typeof playClickSound === 'function') playClickSound();

        // Créer le viewer s'il n'existe pas
        let viewer = document.getElementById('gallery-viewer');
        if (!viewer) {
            viewer = document.createElement('div');
            viewer.id = 'gallery-viewer';
            viewer.className = 'gallery-viewer';
            viewer.innerHTML = `
                <div class="viewer-overlay"></div>
                <div class="viewer-content">
                    <div class="viewer-header">
                        <span class="viewer-counter"></span>
                        <button class="viewer-close" title="Fermer (ESC)">×</button>
                    </div>
                    <div class="viewer-main">
                        <button class="viewer-nav viewer-prev" title="Précédent (←)">‹</button>
                        <div class="viewer-image-container">
                            <img class="viewer-image viewer-image-back" src="" alt="">
                            <img class="viewer-image viewer-image-front" src="" alt="">
                            <div class="viewer-loading">Chargement...</div>
                        </div>
                        <button class="viewer-nav viewer-next" title="Suivant (→)">›</button>
                    </div>
                    <div class="viewer-footer">
                        <span class="viewer-caption"></span>
                    </div>
                </div>
            `;
            document.body.appendChild(viewer);

            // Event listeners
            viewer.querySelector('.viewer-close').addEventListener('click', closeViewer);
            viewer.querySelector('.viewer-overlay').addEventListener('click', closeViewer);
            viewer.querySelector('.viewer-prev').addEventListener('click', () => navigateViewer(-1));
            viewer.querySelector('.viewer-next').addEventListener('click', () => navigateViewer(1));

            // Touch events pour swipe
            viewer.addEventListener('touchstart', handleTouchStart, { passive: true });
            viewer.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        // Afficher le viewer
        viewer.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Charger l'image
        updateViewerImage(index);

        // Keyboard events
        document.addEventListener('keydown', handleKeyboard);
    }

    /**
     * Met à jour l'image affichée dans le viewer
     * @param {number} index - Index de l'image
     */
    function updateViewerImage(index) {
        const viewer = document.getElementById('gallery-viewer');
        if (!viewer || !state.images[index]) return;

        const image = state.images[index];
        const imgBack = viewer.querySelector('.viewer-image-back');
        const imgFront = viewer.querySelector('.viewer-image-front');
        const loading = viewer.querySelector('.viewer-loading');
        const counter = viewer.querySelector('.viewer-counter');
        const caption = viewer.querySelector('.viewer-caption');

        // Déterminer la taille à charger
        const size = window.innerWidth > config.breakpoints.useFullSize ? 'full' : 'medium';
        const imageUrl = getImageUrl(state.currentGallery, image.id, size);

        // Crossfade: copier l'image actuelle en arrière-plan si elle existe
        if (imgFront.src && imgFront.src !== '' && imgFront.complete) {
            imgBack.src = imgFront.src;
            imgBack.style.opacity = '1';
        }

        // Afficher le loading et masquer la nouvelle image
        loading.style.display = 'block';
        imgFront.style.opacity = '0';

        // Charger la nouvelle image
        imgFront.onload = () => {
            loading.style.display = 'none';
            // Fade in de la nouvelle image (crossfade avec l'ancienne)
            imgFront.style.opacity = '1';
            // Après la transition, masquer l'image arrière
            setTimeout(() => {
                imgBack.style.opacity = '0';
            }, 300);
        };
        imgFront.src = imageUrl;
        imgFront.alt = image.caption || `Image ${index + 1}`;

        // Mettre à jour le compteur et la légende
        counter.textContent = `${index + 1} / ${state.images.length}`;
        caption.textContent = image.caption || '';

        // Précharger les images adjacentes
        preloadAdjacentImages(index);

        // Mettre à jour les boutons de navigation
        const prevBtn = viewer.querySelector('.viewer-prev');
        const nextBtn = viewer.querySelector('.viewer-next');
        prevBtn.style.visibility = index > 0 ? 'visible' : 'hidden';
        nextBtn.style.visibility = index < state.images.length - 1 ? 'visible' : 'hidden';
    }

    /**
     * Précharge les images adjacentes
     * @param {number} currentIndex - Index actuel
     */
    function preloadAdjacentImages(currentIndex) {
        const size = window.innerWidth > config.breakpoints.useFullSize ? 'full' : 'medium';
        
        // Précharger l'image suivante
        if (currentIndex < state.images.length - 1) {
            const nextImg = new Image();
            nextImg.src = getImageUrl(state.currentGallery, state.images[currentIndex + 1].id, size);
        }

        // Précharger l'image précédente
        if (currentIndex > 0) {
            const prevImg = new Image();
            prevImg.src = getImageUrl(state.currentGallery, state.images[currentIndex - 1].id, size);
        }
    }

    /**
     * Navigation dans le viewer
     * @param {number} direction - -1 pour précédent, 1 pour suivant
     */
    function navigateViewer(direction) {
        const newIndex = state.currentImageIndex + direction;
        if (newIndex >= 0 && newIndex < state.images.length) {
            state.currentImageIndex = newIndex;
            updateViewerImage(newIndex);
            if (typeof playClickSound === 'function') playClickSound();
        }
    }

    /**
     * Ferme le viewer
     */
    function closeViewer() {
        const viewer = document.getElementById('gallery-viewer');
        if (viewer) {
            viewer.classList.remove('show');
            document.body.style.overflow = '';
            state.isViewerOpen = false;
            document.removeEventListener('keydown', handleKeyboard);
            if (typeof playClickSound === 'function') playClickSound();
        }
    }

    /**
     * Gestion du clavier
     */
    function handleKeyboard(e) {
        if (!state.isViewerOpen) return;

        switch (e.key) {
            case 'ArrowLeft':
                navigateViewer(-1);
                break;
            case 'ArrowRight':
                navigateViewer(1);
                break;
            case 'Escape':
                closeViewer();
                break;
        }
    }

    /**
     * Touch start handler
     */
    function handleTouchStart(e) {
        state.touchStartX = e.changedTouches[0].screenX;
    }

    /**
     * Touch end handler
     */
    function handleTouchEnd(e) {
        state.touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }

    /**
     * Gestion du swipe
     */
    function handleSwipe() {
        const threshold = 50;
        const diff = state.touchStartX - state.touchEndX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe gauche → image suivante
                navigateViewer(1);
            } else {
                // Swipe droite → image précédente
                navigateViewer(-1);
            }
        }
    }

    /**
     * Met à jour le footer de la fenêtre
     */
    function updateFooter(text) {
        const modal = document.getElementById('ia-gallery-modal');
        if (modal) {
            const footer = modal.querySelector('.status-text');
            if (footer) {
                footer.textContent = text;
            }
        }
    }

    /**
     * Initialise la galerie dans un conteneur
     * @param {string} containerId - ID du conteneur
     * @param {Array} galleries - Liste des IDs de galeries à afficher
     */
    function init(containerId, galleries = ['fault-lines']) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Gallery container not found:', containerId);
            return;
        }

        renderCollectionsView(container, galleries);
    }

    // API publique
    return {
        init,
        loadGalleryData,
        openGalleryGrid,
        closeViewer
    };
})();

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // La galerie sera initialisée quand la modale s'ouvre
    console.log('📷 Gallery module loaded');
});

// Exposer globalement pour l'initialisation depuis la modale
window.GalleryModule = GalleryModule;
