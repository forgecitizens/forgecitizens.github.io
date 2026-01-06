// Contact form functionality
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            nom: formData.get('nom'),
            email: formData.get('email'),
            sujet: formData.get('sujet'),
            message: formData.get('message')
        };
        
        // Validate form
        if (!validateContactForm(data)) {
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
        
        // Simulate sending (replace with actual API call)
        setTimeout(() => {
            // Success
            showContactSuccess();
            form.reset();
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

function validateContactForm(data) {
    const errors = [];
    
    // Validate name
    if (!data.nom || data.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Veuillez entrer une adresse email valide');
    }
    
    // Validate subject
    if (!data.sujet || data.sujet.trim().length < 5) {
        errors.push('Le sujet doit contenir au moins 5 caractères');
    }
    
    // Validate message
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Le message doit contenir au moins 10 caractères');
    }
    
    if (errors.length > 0) {
        showContactError(errors);
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