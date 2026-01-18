# World Map Labels Game — Specification (V1)

## 1. Objectif du jeu

Le joueur doit identifier correctement tous les pays du monde en glissant et déposant leurs labels (noms) sur la carte.  
La partie se termine lorsque **tous les pays ont été correctement identifiés**, avec un score basé sur le temps et le nombre d’erreurs.

---

## 2. Sélection de la langue (écran initial)

### 2.1 Pop-up de choix de langue
- À l’ouverture de la page de jeu, une **pop-up modale** apparaît.
- La pop-up affiche deux drapeaux :
  - 🇫🇷 Français (FR)
  - 🇬🇧 English (EN)
- Le joueur choisit la langue du jeu en cliquant sur l’un des deux drapeaux.

### 2.2 Effet
- La langue sélectionnée détermine :
  - les labels des pays,
  - les textes UI (“Bonne chance” / “Good luck”, résumé final, etc.).
- Une fois la langue sélectionnée :
  - la pop-up se ferme,
  - le jeu passe à la phase de compte à rebours.

---

## 3. Compte à rebours de démarrage

### 3.1 Présentation
- Un **compte à rebours** apparaît au centre de l’écran.
- Valeurs affichées successivement :
  - `5 → 4 → 3 → 2 → 1 → "Bonne chance"` (FR)
  - `5 → 4 → 3 → 2 → 1 → "Good luck"` (EN)

### 3.2 Arrière-plan
- Pendant le compte à rebours :
  - la **carte du monde est visible mais floutée**,
  - aucune interaction n’est possible.

### 3.3 Début de la partie
- À la fin du compte à rebours :
  - le flou disparaît,
  - le chronomètre démarre,
  - les interactions deviennent actives.

---

## 4. Carte du monde et affichage des pays

### 4.1 Carte
- La carte du monde est affichée sous forme de **SVG responsive**.
- Chaque pays correspond à une forme (path/polygon) avec un identifiant unique.

### 4.2 Affichage des labels initiaux
- **Grands pays** :
  - leur label est visible et lisible directement sur la carte.
- **Petits pays** :
  - aucun label permanent,
  - un **hover (survol souris)** affiche une pop-up avec le nom du pays.

---

## 5. Mécanique principale de jeu

### 5.1 Interaction
- Les labels des pays sont disponibles sous forme d’éléments **glisser-déposer (drag & drop)**.
- Le joueur doit déposer chaque label sur le pays correspondant sur la carte.

### 5.2 Validation du dépôt
À chaque dépôt d’un label sur un pays :

#### a) Cas correct
- Le label correspond au pays ciblé.
- Effets :
  - le pays se **colore en vert**,
  - le label est verrouillé (ne peut plus être déplacé),
  - le pays est considéré comme validé.

#### b) Cas incorrect
- Le label ne correspond pas au pays ciblé.
- Le compteur d’erreurs est incrémenté de +1.

##### b1) Mauvais pays sans frontière terrestre
- Le pays ciblé se **colore en rouge**.

##### b2) Mauvais pays avec frontière terrestre commune
- Si le pays incorrectement sélectionné **partage une frontière terrestre** avec le bon pays :
  - le pays se **colore en orange** (erreur proche).

> La coloration rouge ou orange est temporaire (ex : 1–2 secondes), puis le pays revient à son état neutre.

---

## 6. Fin de partie

### 6.1 Condition de fin
- La partie se termine lorsque **tous les pays sont correctement identifiés**.

### 6.2 Pop-up de fin
Une pop-up de résumé apparaît avec les informations suivantes :

- **Temps de jeu total**
- **Nombre d’erreurs effectuées**
  - Correspond au nombre total de dépôts incorrects
  - Chaque tentative incorrecte compte, même répétée sur le même pays

### 6.3 Post-partie
- Optionnel (V1+) :
  - bouton “Rejouer”
  - sauvegarde du meilleur score (localStorage)

---

## 7. Règles générales

- Le chronomètre démarre à la fin du compte à rebours.
- Les pays validés ne peuvent plus être modifiés.
- Le jeu est entièrement jouable à la souris (desktop).
- Une adaptation tactile pourra être envisagée ultérieurement.

---

## 8. Portée V1 (non inclus)

- Pas de classement en ligne
- Pas de multi-joueur
- Pas de niveaux de difficulté
- Pas de zoom avancé sur la carte
