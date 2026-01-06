// Articles feature - Download counter, star rating system with IP-based voting
// Configuration des articles
const articlesData = {
    'prompting-role': {
        id: 'prompting-role',
        title: 'Mythe et réalité du prompting par rôle',
        author: 'Andrei Eleodor Sirbu',
        file: 'articles/prompting_IA_personnalité.pdf',
        downloads: 0,
        ratings: [],
        averageRating: 0
    }
};

// État local (simulé - dans un vrai cas, ce serait un backend)
let articlesState = {};
let userVotes = {}; // Stocke les votes par IP (simulé avec localStorage)
let userDownloads = {}; // Stocke les téléchargements uniques par IP

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeArticles();
});

/**
 * Initialise le système d'articles
 */
function initializeArticles() {
    console.log('📚 Initializing articles system...');
    
    // Charger l'état depuis localStorage (simulation de persistance)
    loadArticlesState();
    
    // Mettre à jour l'affichage
    updateArticlesDisplay();
    
    // Attacher les événements
    attachArticleEvents();
    
    console.log('✅ Articles system initialized');
}

/**
 * Charge l'état des articles depuis localStorage
 */
function loadArticlesState() {
    try {
        const savedState = localStorage.getItem('articlesState');
        if (savedState) {
            articlesState = JSON.parse(savedState);
        } else {
            // Initialiser avec les données par défaut
            articlesState = JSON.parse(JSON.stringify(articlesData));
        }
        
        // Charger les votes de l'utilisateur
        const savedVotes = localStorage.getItem('userVotes');
        if (savedVotes) {
            userVotes = JSON.parse(savedVotes);
        }
        
        // Charger les téléchargements de l'utilisateur
        const savedDownloads = localStorage.getItem('userDownloads');
        if (savedDownloads) {
            userDownloads = JSON.parse(savedDownloads);
        }
    } catch (error) {
        console.error('Error loading articles state:', error);
        articlesState = JSON.parse(JSON.stringify(articlesData));
    }
}

/**
 * Sauvegarde l'état des articles dans localStorage
 */
function saveArticlesState() {
    try {
        localStorage.setItem('articlesState', JSON.stringify(articlesState));
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
        localStorage.setItem('userDownloads', JSON.stringify(userDownloads));
    } catch (error) {
        console.error('Error saving articles state:', error);
    }
}

/**
 * Met à jour l'affichage des articles
 */
function updateArticlesDisplay() {
    Object.keys(articlesState).forEach(articleId => {
        const article = articlesState[articleId];
        
        // Mettre à jour le compteur de téléchargements
        const downloadElement = document.getElementById(`downloads-${articleId}`);
        if (downloadElement) {
            downloadElement.textContent = article.downloads || 0;
        }
        
        // Mettre à jour la note moyenne
        const ratingElement = document.getElementById(`rating-${articleId}`);
        if (ratingElement) {
            if (article.ratings && article.ratings.length > 0) {
                const avg = article.ratings.reduce((a, b) => a + b, 0) / article.ratings.length;
                ratingElement.textContent = avg.toFixed(1) + '/5';
            } else {
                ratingElement.textContent = '-';
            }
        }
        
        // Mettre à jour les étoiles si l'utilisateur a déjà voté
        updateStarDisplay(articleId);
    });
}

/**
 * Met à jour l'affichage des étoiles pour un article
 */
function updateStarDisplay(articleId) {
    const starContainer = document.querySelector(`.star-rating[data-article-id="${articleId}"]`);
    if (!starContainer) return;
    
    const stars = starContainer.querySelectorAll('.star');
    const userVote = userVotes[articleId];
    
    stars.forEach((star, index) => {
        const value = index + 1;
        if (userVote && value <= userVote) {
            star.textContent = '★';
            star.classList.add('filled');
        } else {
            star.textContent = '☆';
            star.classList.remove('filled');
        }
    });
}

/**
 * Attache les événements aux éléments d'articles
 */
function attachArticleEvents() {
    // Événements pour les lignes d'articles (clic pour télécharger)
    document.querySelectorAll('.article-row').forEach(row => {
        const articleName = row.querySelector('.article-name');
        if (articleName) {
            articleName.addEventListener('click', function(e) {
                e.stopPropagation();
                const articleId = row.dataset.articleId;
                const filePath = row.dataset.file;
                showDownloadPopup(articleId, filePath);
            });
            
            // Curseur pointer pour indiquer que c'est cliquable
            articleName.style.cursor = 'pointer';
        }
    });
    
    // Événements pour les étoiles de notation
    document.querySelectorAll('.star-rating').forEach(container => {
        const articleId = container.dataset.articleId;
        const stars = container.querySelectorAll('.star');
        
        stars.forEach(star => {
            // Hover effect
            star.addEventListener('mouseenter', function() {
                const value = parseInt(this.dataset.value);
                highlightStars(container, value);
            });
            
            star.addEventListener('mouseleave', function() {
                // Revenir à l'état actuel
                updateStarDisplay(articleId);
            });
            
            // Click pour voter
            star.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = parseInt(this.dataset.value);
                rateArticle(articleId, value);
            });
        });
    });
    
    // Événements pour le popup de téléchargement
    const downloadYes = document.getElementById('downloadYes');
    const downloadNo = document.getElementById('downloadNo');
    
    if (downloadYes) {
        downloadYes.addEventListener('click', confirmDownload);
    }
    
    if (downloadNo) {
        downloadNo.addEventListener('click', closeDownloadPopup);
    }
    
    // Fermer le popup en cliquant à l'extérieur
    const popup = document.getElementById('downloadPopup');
    if (popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                closeDownloadPopup();
            }
        });
    }
}

/**
 * Met en surbrillance les étoiles au survol
 */
function highlightStars(container, value) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.textContent = '★';
            star.classList.add('hover');
        } else {
            star.textContent = '☆';
            star.classList.remove('hover');
        }
    });
}

/**
 * Enregistre un vote pour un article
 */
function rateArticle(articleId, rating) {
    // Vérifier si l'utilisateur a déjà voté (simulation avec localStorage)
    if (userVotes[articleId]) {
        showNotification('Vous avez déjà voté pour ce document.', 'warning');
        return;
    }
    
    // Enregistrer le vote
    if (!articlesState[articleId]) {
        articlesState[articleId] = { ...articlesData[articleId] };
    }
    
    if (!articlesState[articleId].ratings) {
        articlesState[articleId].ratings = [];
    }
    
    articlesState[articleId].ratings.push(rating);
    userVotes[articleId] = rating;
    
    // Sauvegarder et mettre à jour l'affichage
    saveArticlesState();
    updateArticlesDisplay();
    
    // Jouer un son de confirmation
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    showNotification(`Merci pour votre vote : ${rating}/5 étoiles !`, 'success');
}

/**
 * Affiche le popup de confirmation de téléchargement
 */
let currentDownload = null;

function showDownloadPopup(articleId, filePath) {
    const popup = document.getElementById('downloadPopup');
    const filenameElement = document.getElementById('downloadFilename');
    
    if (!popup || !filenameElement) return;
    
    // Stocker les infos du téléchargement en cours
    currentDownload = { articleId, filePath };
    
    // Afficher le nom du fichier
    const article = articlesState[articleId] || articlesData[articleId];
    filenameElement.textContent = article ? article.title : filePath;
    
    // Afficher le popup
    popup.classList.add('show');
    
    // Jouer un son
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
}

/**
 * Confirme et lance le téléchargement
 */
function confirmDownload() {
    if (!currentDownload) {
        closeDownloadPopup();
        return;
    }
    
    const { articleId, filePath } = currentDownload;
    
    // Incrémenter le compteur uniquement si c'est un nouveau téléchargement
    if (!userDownloads[articleId]) {
        if (!articlesState[articleId]) {
            articlesState[articleId] = { ...articlesData[articleId] };
        }
        articlesState[articleId].downloads = (articlesState[articleId].downloads || 0) + 1;
        userDownloads[articleId] = true;
        saveArticlesState();
        updateArticlesDisplay();
    }
    
    // Créer un lien temporaire pour le téléchargement
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.split('/').pop();
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Fermer le popup
    closeDownloadPopup();
    
    // Jouer un son
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
    
    showNotification('Téléchargement lancé !', 'success');
}

/**
 * Ferme le popup de téléchargement
 */
function closeDownloadPopup() {
    const popup = document.getElementById('downloadPopup');
    if (popup) {
        popup.classList.remove('show');
    }
    currentDownload = null;
    
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
}

/**
 * Affiche une notification
 */
function showNotification(message, type = 'info') {
    // Créer une notification style Windows 95
    const notification = document.createElement('div');
    notification.className = `article-notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Retirer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Exposer les fonctions globalement
window.showDownloadPopup = showDownloadPopup;
window.confirmDownload = confirmDownload;
window.closeDownloadPopup = closeDownloadPopup;
window.rateArticle = rateArticle;
