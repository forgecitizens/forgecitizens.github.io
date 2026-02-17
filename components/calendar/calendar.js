/**
 * ========================================================================
 * CALENDRIER WINDOWS RÉTRO - COMPOSANT AUTONOME
 * ========================================================================
 * 
 * Calendrier from scratch, style Windows classique avec :
 * - Vue mensuelle navigable (◀ mois ▶)
 * - Horloge live (HH:MM:SS)  
 * - Dates actives cliquables (vertes) avec notes persistantes
 * - Modale d'édition de notes par date
 * - Stockage localStorage
 * - Interface rétro 100% compatible
 * 
 * API publique :
 * - mountCalendar(container, options)
 * - unmountCalendar()
 * 
 * ========================================================================
 */

class RetroCalendar {
    constructor() {
        this.currentDate = new Date();
        this.container = null;
        this.clockInterval = null;
        this.activeNotes = this.loadNotes();
        
        // Événements prédéfinis (non modifiables)
        this.predefinedEvents = {
            '2025-11-13': {
                title: 'Lancement de Foozool',
                text: 'Lancement de Foozool : une chaîne YouTube avec des shorts générés grâce à Grok Imagine + ChatGPT. Le principe ? De fausses interviews sur des mesures gouvernementales absurdes.',
                link: 'https://www.youtube.com/@FoozoolMedia/shorts',
                linkText: 'Voir la chaîne YouTube'
            },
            '2025-12-25': {
                title: 'Publication scientifique',
                text: 'Publication de "Vers un modèle cosmologique unifié" dans ViXra.',
                link: 'https://ai.vixra.org/abs/2512.0089',
                linkText: 'Lire la publication'
            },
            '2026-01-04': {
                title: 'Release Drafter v.1',
                text: 'Release v.1 de Drafter, la machine à écrire numérique inspirée du Hemingwrite.',
                link: null,
                linkText: null
            },
            '2026-01-05': {
                title: 'Collection "Fault Lines"',
                text: 'Publication du premier set d\'images de la collection "Fault Lines".',
                link: null,
                linkText: null
            },
            '2026-01-11': {
                title: 'Release IGI v.1',
                text: 'Release v.1 de l\'Indice d\'Instabilité Globale (IGI). L\'IGI c\'est un nombre qui agrège les situations financières, politiques, culturelles, climatiques, épidémiques mondiales pour déterminer sur une échelle allant de 0 à 1000 si le monde tend vers la paix universelle ou le chaos total.',
                link: null,
                linkText: null
            },
            '2026-01-19': {
                title: 'Release v1 de "Mapper"',
                text: 'Mapper est un jeu pour vous aider à réviser de manière ludique les emplacements des pays du monde. La v1 contient un système de combos, un chrono, et support des langues FR et EN.',
                link: null,
                linkText: null
            },
            '2026-02-05': {
                title: 'Lancement de Qualif\'R v.1',
                text: 'Lancement de la v.1 de Qualif\'R, un jeu qui permet d\'entraîner son discernement. Public cible : tous les âges.',
                link: null,
                linkText: null
            },
            '2026-02-17': {
                title: 'Release v1 de Sophiscope',
                text: 'Sophiscope est un jeu interactif pour apprendre à reconnaître les sophismes sur les réseaux sociaux, dans les débats, dans les journaux.',
                link: null,
                linkText: null
            }
        };
        
        this.months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        this.dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        
        // Bind methods pour les event listeners
        this.handlePrevMonth = this.handlePrevMonth.bind(this);
        this.handleNextMonth = this.handleNextMonth.bind(this);
        this.handleToday = this.handleToday.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
        this.updateClock = this.updateClock.bind(this);
    }

    /**
     * Monte le calendrier dans le conteneur donné
     * @param {HTMLElement} container - Élément DOM conteneur
     * @param {Object} options - Options (non utilisé pour le moment)
     */
    mount(container, options = {}) {
        if (!container) {
            throw new Error('RetroCalendar: container requis');
        }
        
        this.container = container;
        this.container.innerHTML = this.generateHTML();
        this.attachEventListeners();
        this.renderMonth();
        this.startClock();
        
        console.log('📅 RetroCalendar monté');
    }

    /**
     * Démonte proprement le calendrier
     */
    unmount() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        
        this.removeEventListeners();
        
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        
        // Fermer la modale de note si ouverte
        this.closeNoteModal();
        
        console.log('📅 RetroCalendar démonté');
    }

    /**
     * Génère le HTML du calendrier
     */
    generateHTML() {
        return `
            <div class="retro-calendar">
                <!-- Horloge en temps réel -->
                <div class="calendar-clock">
                    <span id="retro-clock">--:--:--</span>
                </div>
                
                <!-- Navigation mois -->
                <div class="calendar-navigation">
                    <button class="nav-btn" id="calendar-prev">◀</button>
                    <div class="month-year-display" id="month-year-display">
                        ${this.months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}
                    </div>
                    <button class="nav-btn" id="calendar-next">▶</button>
                </div>
                
                <!-- Bouton Aujourd'hui -->
                <div class="calendar-today">
                    <button class="today-btn" id="calendar-today">Aujourd'hui</button>
                </div>
                
                <!-- Grille calendrier -->
                <div class="calendar-grid-container">
                    <table class="calendar-table">
                        <thead>
                            <tr class="calendar-header-row">
                                ${this.dayNames.map(day => 
                                    `<th class="day-header">${day}</th>`
                                ).join('')}
                            </tr>
                        </thead>
                        <tbody id="calendar-body">
                            <!-- Les jours seront générés ici -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Instructions -->
                <div class="calendar-instructions">
                    <small>📝 Clic sur date verte = voir/éditer note</small>
                </div>
                
                <!-- Bouton gestion des notes -->
                <div class="calendar-management">
                    <button class="manage-btn" id="calendar-manage">Gérer les notes</button>
                </div>
            </div>
        `;
    }

    /**
     * Attache les event listeners
     */
    attachEventListeners() {
        const prevBtn = this.container.querySelector('#calendar-prev');
        const nextBtn = this.container.querySelector('#calendar-next');
        const todayBtn = this.container.querySelector('#calendar-today');
        const manageBtn = this.container.querySelector('#calendar-manage');
        
        if (prevBtn) prevBtn.addEventListener('click', this.handlePrevMonth);
        if (nextBtn) nextBtn.addEventListener('click', this.handleNextMonth);
        if (todayBtn) todayBtn.addEventListener('click', this.handleToday);
        if (manageBtn) manageBtn.addEventListener('click', () => this.showManageModal());
    }

    /**
     * Retire les event listeners
     */
    removeEventListeners() {
        if (!this.container) return;
        
        const prevBtn = this.container.querySelector('#calendar-prev');
        const nextBtn = this.container.querySelector('#calendar-next');
        const todayBtn = this.container.querySelector('#calendar-today');
        const manageBtn = this.container.querySelector('#calendar-manage');
        
        if (prevBtn) prevBtn.removeEventListener('click', this.handlePrevMonth);
        if (nextBtn) nextBtn.removeEventListener('click', this.handleNextMonth);
        if (todayBtn) todayBtn.removeEventListener('click', this.handleToday);
        if (manageBtn) manageBtn.removeEventListener('click', () => this.showManageModal());
    }

    /**
     * Démarre l'horloge temps réel
     */
    startClock() {
        this.updateClock(); // Affichage immédiat
        this.clockInterval = setInterval(this.updateClock, 1000);
    }

    /**
     * Met à jour l'affichage de l'horloge
     */
    updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const clockElement = this.container?.querySelector('#retro-clock');
        if (clockElement) {
            clockElement.textContent = `${hours}:${minutes}:${seconds}`;
        }
    }

    /**
     * Gestion navigation mois précédent
     */
    handlePrevMonth() {
        this.playClickSound();
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderMonth();
    }

    /**
     * Gestion navigation mois suivant
     */
    handleNextMonth() {
        this.playClickSound();
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderMonth();
    }

    /**
     * Retour au mois actuel
     */
    handleToday() {
        this.playClickSound();
        this.currentDate = new Date();
        this.renderMonth();
    }

    /**
     * Rend la grille du mois actuel
     */
    renderMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Mettre à jour le titre mois/année
        const monthYearDisplay = this.container?.querySelector('#month-year-display');
        if (monthYearDisplay) {
            monthYearDisplay.textContent = `${this.months[month]} ${year}`;
        }
        
        // Générer la grille
        const calendarBody = this.container?.querySelector('#calendar-body');
        if (!calendarBody) return;
        
        // Calculs dates
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstWeekday = firstDay.getDay(); // 0 = dimanche
        const daysInMonth = lastDay.getDate();
        
        // Date actuelle pour highlight
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();
        
        let html = '';
        let dayCounter = 1;
        
        // Générer 6 semaines maximum
        for (let week = 0; week < 6; week++) {
            html += '<tr>';
            
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                if (week === 0 && dayOfWeek < firstWeekday) {
                    // Cellules vides avant le 1er du mois
                    html += '<td class="calendar-day empty-day"></td>';
                } else if (dayCounter <= daysInMonth) {
                    // Jour du mois
                    const dateKey = this.formatDateKey(year, month, dayCounter);
                    const isToday = isCurrentMonth && dayCounter === todayDate;
                    const hasNote = this.activeNotes[dateKey] && this.activeNotes[dateKey].text.trim().length > 0;
                    const hasEvent = this.predefinedEvents[dateKey] !== undefined;
                    
                    let classes = 'calendar-day';
                    if (isToday) classes += ' today';
                    if (hasNote || hasEvent) classes += ' has-note';
                    if (hasEvent) classes += ' has-event';
                    
                    html += `<td class="${classes}" data-date="${dateKey}" data-day="${dayCounter}" ${hasEvent ? 'data-event="true"' : ''}>
                        <span class="day-number">${dayCounter}</span>
                    </td>`;
                    
                    dayCounter++;
                } else {
                    // Cellules vides après le dernier jour
                    html += '<td class="calendar-day empty-day"></td>';
                }
            }
            
            html += '</tr>';
            
            // Si on a affiché tous les jours, pas besoin de lignes supplémentaires
            if (dayCounter > daysInMonth) break;
        }
        
        calendarBody.innerHTML = html;
        
        // Attacher les listeners de clic sur les jours
        this.attachDayClickListeners();
    }

    /**
     * Attache les listeners de clic sur les jours
     */
    attachDayClickListeners() {
        const dayElements = this.container?.querySelectorAll('.calendar-day:not(.empty-day)');
        dayElements?.forEach(day => {
            day.addEventListener('click', this.handleDayClick);
        });
    }

    /**
     * Gestion du clic sur un jour
     */
    handleDayClick(event) {
        const dayElement = event.currentTarget;
        const dateKey = dayElement.dataset.date;
        const hasNote = dayElement.classList.contains('has-note');
        const hasEvent = dayElement.dataset.event === 'true';
        
        // Priorité aux événements prédéfinis
        if (hasEvent) {
            this.playClickSound();
            this.showEventModal(dateKey);
        } else if (hasNote) {
            this.playClickSound();
            this.showNoteModal(dateKey);
        }
        // Sinon, pas de réaction (pas cliquable)
    }

    /**
     * Affiche la modale d'affichage d'un événement prédéfini (lecture seule)
     */
    showEventModal(dateKey) {
        const event = this.predefinedEvents[dateKey];
        if (!event) return;
        
        // Formater la date pour affichage
        const date = new Date(dateKey);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Construire le lien si présent
        let linkHTML = '';
        if (event.link) {
            linkHTML = `
                <div class="event-link">
                    <a href="${event.link}" target="_blank" rel="noopener noreferrer" class="event-link-btn">
                        🔗 ${event.linkText || 'Voir plus'}
                    </a>
                </div>
            `;
        }
        
        const modalHTML = `
            <div class="note-modal-overlay" id="event-modal-overlay">
                <div class="note-modal event-modal">
                    <div class="note-modal-header event-modal-header">
                        <span class="modal-title">📅 ${event.title}</span>
                        <button class="close-btn" id="close-event-modal">✕</button>
                    </div>
                    <div class="note-modal-content">
                        <div class="event-date">
                            ${formattedDate}
                        </div>
                        <div class="event-content">
                            <p>${event.text}</p>
                        </div>
                        ${linkHTML}
                        <div class="event-actions">
                            <button class="close-event-btn" id="close-event-btn">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        document.getElementById('close-event-modal').addEventListener('click', () => {
            this.closeEventModal();
        });
        
        document.getElementById('close-event-btn').addEventListener('click', () => {
            this.closeEventModal();
        });
        
        // Fermeture par overlay
        document.getElementById('event-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'event-modal-overlay') {
                this.closeEventModal();
            }
        });
        
        // ESC pour fermer
        document.addEventListener('keydown', this.handleEventEscKey = (e) => {
            if (e.key === 'Escape') {
                this.closeEventModal();
            }
        });
    }

    /**
     * Ferme la modale d'événement
     */
    closeEventModal() {
        const modal = document.getElementById('event-modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        // Retirer le listener ESC
        if (this.handleEventEscKey) {
            document.removeEventListener('keydown', this.handleEventEscKey);
            this.handleEventEscKey = null;
        }
    }

    /**
     * Affiche la modale de gestion des notes
     */
    showManageModal() {
        this.playClickSound();
        
        let modalHTML = `
            <div class="note-modal-overlay" id="manage-modal-overlay">
                <div class="note-modal">
                    <div class="note-modal-header">
                        <span class="modal-title">📝 Gérer les notes du calendrier</span>
                        <button class="close-btn" id="close-manage-modal">✕</button>
                    </div>
                    <div class="note-modal-content">
                        <div class="manage-instructions">
                            <p><strong>Instructions :</strong></p>
                            <p>• Sélectionnez une date ci-dessous pour créer/modifier une note</p>
                            <p>• Les dates avec notes apparaissent en <span style="color: #008000; font-weight: bold;">vert</span> sur le calendrier</p>
                            <p>• Seules les dates vertes sont cliquables</p>
                        </div>
                        
                        <div class="date-selector">
                            <label for="note-date">Date :</label>
                            <input type="date" id="note-date" class="date-input">
                            <button class="edit-date-btn" id="edit-selected-date">Éditer cette date</button>
                        </div>
                        
                        <div class="existing-notes">
                            <h4>Notes existantes :</h4>
                            <div class="notes-list" id="notes-list">
                                ${this.generateNotesListHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        document.getElementById('close-manage-modal').addEventListener('click', () => {
            this.closeManageModal();
        });
        
        document.getElementById('edit-selected-date').addEventListener('click', () => {
            const dateInput = document.getElementById('note-date');
            const dateValue = dateInput.value;
            if (dateValue) {
                const dateKey = dateValue; // Format YYYY-MM-DD
                this.closeManageModal();
                this.showNoteModal(dateKey);
            }
        });
        
        // Fermeture par clic sur overlay
        document.getElementById('manage-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'manage-modal-overlay') {
                this.closeManageModal();
            }
        });
    }

    /**
     * Génère le HTML de la liste des notes existantes
     */
    generateNotesListHTML() {
        const notes = Object.entries(this.activeNotes).filter(([key, note]) => 
            note.text.trim().length > 0
        );
        
        if (notes.length === 0) {
            return '<p class="no-notes">Aucune note pour le moment.</p>';
        }
        
        return notes.map(([dateKey, note]) => {
            const date = new Date(dateKey);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const preview = note.text.length > 50 
                ? note.text.substring(0, 50) + '...' 
                : note.text;
            
            return `
                <div class="note-item" data-date="${dateKey}">
                    <div class="note-date">${formattedDate}</div>
                    <div class="note-preview">${preview}</div>
                    <button class="edit-note-btn" onclick="retroCalendar.showNoteModal('${dateKey}')">Éditer</button>
                </div>
            `;
        }).join('');
    }

    /**
     * Ferme la modale de gestion
     */
    closeManageModal() {
        const modal = document.getElementById('manage-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Affiche la modale d'édition de note pour une date
     */
    showNoteModal(dateKey) {
        const note = this.activeNotes[dateKey] || { text: '', updatedAt: new Date().toISOString() };
        
        // Formater la date pour affichage
        const date = new Date(dateKey);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const modalHTML = `
            <div class="note-modal-overlay" id="note-modal-overlay">
                <div class="note-modal">
                    <div class="note-modal-header">
                        <span class="modal-title">📝 Note du ${formattedDate}</span>
                        <button class="close-btn" id="close-note-modal">✕</button>
                    </div>
                    <div class="note-modal-content">
                        <div class="note-editor">
                            <textarea 
                                id="note-textarea" 
                                class="note-textarea" 
                                placeholder="Écrivez votre note ici..."
                                rows="8"
                            >${note.text}</textarea>
                        </div>
                        <div class="note-actions">
                            <button class="save-btn" id="save-note">💾 Enregistrer</button>
                            <button class="cancel-btn" id="cancel-note">❌ Annuler</button>
                            <button class="delete-btn" id="delete-note">🗑️ Supprimer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus sur textarea
        const textarea = document.getElementById('note-textarea');
        textarea.focus();
        
        // Event listeners
        document.getElementById('close-note-modal').addEventListener('click', () => {
            this.closeNoteModal();
        });
        
        document.getElementById('save-note').addEventListener('click', () => {
            this.saveNote(dateKey, textarea.value);
        });
        
        document.getElementById('cancel-note').addEventListener('click', () => {
            this.closeNoteModal();
        });
        
        document.getElementById('delete-note').addEventListener('click', () => {
            this.deleteNote(dateKey);
        });
        
        // Fermeture par overlay
        document.getElementById('note-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'note-modal-overlay') {
                this.closeNoteModal();
            }
        });
        
        // ESC pour fermer
        document.addEventListener('keydown', this.handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.closeNoteModal();
            }
        });
    }

    /**
     * Ferme la modale de note
     */
    closeNoteModal() {
        const modal = document.getElementById('note-modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        // Retirer le listener ESC
        if (this.handleEscKey) {
            document.removeEventListener('keydown', this.handleEscKey);
            this.handleEscKey = null;
        }
    }

    /**
     * Sauvegarde une note
     */
    saveNote(dateKey, text) {
        const trimmedText = text.trim();
        
        if (trimmedText.length > 0) {
            this.activeNotes[dateKey] = {
                text: trimmedText,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Texte vide = suppression
            delete this.activeNotes[dateKey];
        }
        
        this.saveNotes();
        this.renderMonth(); // Re-render pour mettre à jour les styles
        this.closeNoteModal();
        this.playSuccessSound();
        
        console.log(`📝 Note sauvegardée pour ${dateKey}`);
    }

    /**
     * Supprime une note
     */
    deleteNote(dateKey) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
            delete this.activeNotes[dateKey];
            this.saveNotes();
            this.renderMonth();
            this.closeNoteModal();
            this.playSuccessSound();
            
            console.log(`🗑️ Note supprimée pour ${dateKey}`);
        }
    }

    /**
     * Formate une clé de date (YYYY-MM-DD)
     */
    formatDateKey(year, month, day) {
        return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    /**
     * Charge les notes depuis localStorage
     */
    loadNotes() {
        try {
            const stored = localStorage.getItem('calendar_notes_v1');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Erreur chargement notes:', error);
            return {};
        }
    }

    /**
     * Sauvegarde les notes dans localStorage
     */
    saveNotes() {
        try {
            localStorage.setItem('calendar_notes_v1', JSON.stringify(this.activeNotes));
        } catch (error) {
            console.error('Erreur sauvegarde notes:', error);
        }
    }

    /**
     * Joue un son de clic (si disponible)
     */
    playClickSound() {
        if (typeof playClickSound === 'function') {
            playClickSound();
        }
    }

    /**
     * Joue un son de succès (si disponible)  
     */
    playSuccessSound() {
        if (typeof playSuccessSound === 'function') {
            playSuccessSound();
        }
    }
}

// ========================================================================
// API PUBLIQUE
// ========================================================================

let retroCalendar = null;

/**
 * Monte le calendrier dans un conteneur
 * @param {HTMLElement} container - Élément DOM conteneur
 * @param {Object} options - Options de configuration
 */
function mountCalendar(container, options = {}) {
    if (retroCalendar) {
        console.warn('Calendrier déjà monté, démontage automatique...');
        unmountCalendar();
    }
    
    retroCalendar = new RetroCalendar();
    retroCalendar.mount(container, options);
    
    // Exposer globalement pour les callbacks HTML inline
    window.retroCalendar = retroCalendar;
}

/**
 * Démonte proprement le calendrier
 */
function unmountCalendar() {
    if (retroCalendar) {
        retroCalendar.unmount();
        retroCalendar = null;
        
        // Nettoyer la référence globale
        if (window.retroCalendar) {
            delete window.retroCalendar;
        }
    }
}

// Export pour usage en module si besoin
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mountCalendar, unmountCalendar, RetroCalendar };
}