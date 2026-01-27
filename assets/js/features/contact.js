// Contact form functionality
// Utilise Formspree pour l'envoi d'emails (gratuit pour sites statiques)
// Créer un compte sur https://formspree.io et remplacer l'endpoint ci-dessous

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mdagbgdp'; // Remplacer par ton endpoint Formspree

function initializeContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    console.log('📧 Initializing contact form...');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📧 Form submitted');
        
        // Get form data directly from inputs
        const data = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            email: document.getElementById('email')?.value || '',
            message: document.getElementById('message')?.value || ''
        };
        
        console.log('📧 Form data:', data);
        
        // Validate form
        if (!validateContactForm(data)) {
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
        
        try {
            // Envoyer via Formspree
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    message: data.message,
                    _subject: `Message de ${data.firstName} ${data.lastName} via le site`
                })
            });
            
            if (response.ok) {
                console.log('📧 Email sent successfully');
                showContactSuccessMessage();
                form.reset();
                
                // Mettre à jour le footer de la modale
                const statusText = document.querySelector('#contact-modal .status-text');
                if (statusText) {
                    statusText.textContent = '✅ Message envoyé !';
                    setTimeout(() => {
                        statusText.textContent = 'Prêt à envoyer';
                    }, 10000);
                }
            } else {
                const errorData = await response.json();
                console.error('📧 Formspree error:', errorData);
                showContactErrorMessage('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('📧 Network error:', error);
            showContactErrorMessage('Erreur de connexion. Vérifiez votre connexion internet.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Affiche le message de succès dans la modale (disparaît après 10s)
 */
function showContactSuccessMessage() {
    const messageDiv = document.getElementById('contactMessage');
    if (messageDiv) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#90ee90';
        messageDiv.style.borderColor = '#008000';
        messageDiv.innerHTML = '✅ Votre message a été envoyé avec succès ! Je vous répondrai dans les plus brefs délais.';
        
        // Masquer après 10 secondes
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 10000);
    }
    
    // Jouer un son de succès si disponible
    if (typeof playSuccessSound === 'function') {
        playSuccessSound();
    }
}

/**
 * Affiche un message d'erreur dans la modale (disparaît après 10s)
 */
function showContactErrorMessage(errorText) {
    const messageDiv = document.getElementById('contactMessage');
    if (messageDiv) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#ffcccc';
        messageDiv.style.borderColor = '#cc0000';
        messageDiv.innerHTML = '❌ ' + errorText;
        
        // Masquer après 10 secondes
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 10000);
    }
    
    // Jouer un son d'erreur si disponible
    if (typeof playErrorSound === 'function') {
        playErrorSound();
    }
}

function validateContactForm(data) {
    const errors = [];
    
    // Validate first name
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    // Validate last name
    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Veuillez entrer une adresse email valide');
    }
    
    // Validate message
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Le message doit contenir au moins 10 caractères');
    }
    
    if (errors.length > 0) {
        // Afficher les erreurs dans la modale
        showContactErrorMessage(errors.join(' • '));
        return false;
    }
    
    return true;
}

function showContactSuccess() {
    const popup = document.getElementById('contactPopup') || createContactPopup();
    const content = popup.querySelector('.popup-content');
    
    content.innerHTML = `
        <div class="success-message">
            <div style="font-size: 48px; color: #4CAF50; margin-bottom: 16px;">✅</div>
            <h3>Message envoyé avec succès !</h3>
            <p>Merci pour votre message. Je vous répondrai dans les plus brefs délais.</p>
            <button onclick="closeContactPopup()" class="button">Fermer</button>
        </div>
    `;
    
    popup.classList.add('show');
    playSuccessSound();
}

function showContactError(errors) {
    const popup = document.getElementById('contactPopup') || createContactPopup();
    const content = popup.querySelector('.popup-content');
    
    content.innerHTML = `
        <div class="error-message">
            <div style="font-size: 48px; color: #f44336; margin-bottom: 16px;">❌</div>
            <h3>Erreur dans le formulaire</h3>
            <ul style="text-align: left; margin: 16px 0;">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
            <button onclick="closeContactPopup()" class="button">Fermer</button>
        </div>
    `;
    
    popup.classList.add('show');
    playErrorSound();
}

function createContactPopup() {
    const popup = document.createElement('div');
    popup.id = 'contactPopup';
    popup.className = 'contact-popup';
    popup.innerHTML = `
        <div class="popup-overlay" onclick="closeContactPopup()"></div>
        <div class="popup-content"></div>
    `;
    document.body.appendChild(popup);
    return popup;
}

function closeContactPopup() {
    const popup = document.getElementById('contactPopup');
    if (popup) {
        popup.classList.remove('show');
    }
    playClickSound();
}

// Character counter for textarea
function setupCharacterCounter() {
    const textarea = document.getElementById('message');
    const counter = document.getElementById('charCounter');
    
    if (!textarea || !counter) return;
    
    const maxLength = 500;
    
    textarea.addEventListener('input', function() {
        const remaining = maxLength - this.value.length;
        counter.textContent = `${remaining} caractères restants`;
        
        if (remaining < 50) {
            counter.style.color = '#ff6b6b';
        } else if (remaining < 100) {
            counter.style.color = '#f39c12';
        } else {
            counter.style.color = '#7f8c8d';
        }
    });
    
    // Initialize counter
    textarea.dispatchEvent(new Event('input'));
}

// Auto-resize textarea
function setupAutoResize() {
    const textarea = document.getElementById('message');
    if (!textarea) return;
    
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
}

function initializeContactFeatures() {
    initializeContactForm();
    setupCharacterCounter();
    setupAutoResize();
}