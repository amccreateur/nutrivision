# NutriVision 🥗📸

Application mobile iOS & Android d'analyse nutritionnelle en temps réel par caméra, avec calcul automatique du **Nutri-Score** et estimation des **calories & macronutriments**.

---

## 🚀 Fonctionnalités Clés

1. **Scanner Caméra en Direct :**
   - Viseur HUD avec laser de scan animé et ciblage automatique.
   - Mode **Scan Continu (Live)** ou **Déclenchement Manuel**.
   - Contrôle du flash/torche et inversion caméra avant/arrière.
   - Compression optimisée en millisecondes pour un transfert ultra-rapide (< 100 Ko).

2. **Moteur d'IA & Vision Multimodale :**
   - Reconnaissance visuelle automatique du plat et des ingrédients.
   - Décomposition détaillée : Protéines, Glucides, Lipides, Graisses Saturées, Sucres, Fibres, Sodium.
   - Intégration directe **Google Gemini 2.0 Flash** (API gratuite).
   - Mode Démo hors-ligne intégré avec simulation pour tester immédiatement sans clé API.

3. **Calculateur Officiel du Nutri-Score (A, B, C, D, E) :**
   - Implémentation fidèle de l'algorithme officiel (Points négatifs N vs Points positifs P pour 100g).
   - Badge visuel interactif avec mise en valeur de la note attribuée.
   - Synthèse diététique et conseils santé personnalisés.

4. **Journal Nutritionnel & Suivi Quotidien :**
   - Enregistrement des repas scannés avec horodatage et portion en grammes.
   - Jauge d'objectif calorique quotidien (ex: 1 850 / 2 000 kcal).
   - Historique persistant en local (AsyncStorage) respectant la vie privée.

---

## 📱 Lancement sur votre Smartphone

### 1. Installer l'application Expo Go
- **Sur iPhone (iOS) :** Téléchargez **Expo Go** sur l'[App Store](https://apps.apple.com/app/expo-go/id982107779).
- **Sur Android :** Téléchargez **Expo Go** sur le [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).

### 2. Démarrer le serveur de développement
Dans le terminal de votre projet, lancez :
```bash
npx expo start
```

### 3. Scanner le QR Code
- Ouvrez la caméra de votre smartphone (ou l'application Expo Go sur Android) et scannez le QR Code affiché dans votre terminal.
- L'application se charge instantanément sur votre téléphone !

---

## 🔑 Configuration de l'IA (Optionnel)

L'application fonctionne immédiatement en mode démo. Pour connecter l'analyse à vos vrais plats avec l'IA en direct :
1. Obtenez une clé gratuite sur [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Dans l'application, touchez le bouton **Réglages** en bas à droite.
3. Collez votre clé API et enregistrez.
