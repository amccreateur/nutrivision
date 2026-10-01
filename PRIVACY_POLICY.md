# Politique de Confidentialité — NutriVision

**Dernière mise à jour :** 1er octobre 2026

L'application mobile **NutriVision** (éditée par Dialectal) est conçue pour respecter rigoureusement la vie privée de ses utilisateurs. Cette politique de confidentialité vous informe sur la manière dont vos données sont collectées, utilisées et protégées.

---

### 1. Données collectées et autorisations

#### A. Accès à la Caméra (`CAMERA`)
NutriVision utilise l'autorisation de la caméra exclusivement pour :
* Permettre la détection et la reconnaissance visuelle en temps réel des aliments et des plats cuisinés.
* Scanner les codes-barres des produits alimentaires emballés.
* **Important :** Aucun flux vidéo continu n'est enregistré à votre insu. Les prises de vue ne sont effectuées que lors de votre interaction active avec le scanner.

#### B. Analyse Visuelle par Intelligence Artificielle (Google Gemini Vision)
Lorsque vous effectuez un scan d'aliment, l'image correspondante est transmise de manière sécurisée et chiffrée (HTTPS / SSL) à l'API Google Gemini dans l'unique but d'analyser les composants du plat et d'estimer les macronutriments (protéines, glucides, lipides, fibres) et le Nutri-Score. Les images ne sont ni revendues, ni conservées par nos soins.

#### C. Analyse des Codes-Barres (Open Food Facts)
Lors de la lecture d'un code-barres, le numéro du code-barres est transmis à l'API publique Open Food Facts pour récupérer la fiche nutritionnelle officielle du produit.

#### D. Stockage Local sur votre Téléphone
Toutes vos données de suivi personnel (historique des repas, calories quotidiennes, objectifs nutritionnels, photos miniatures de vos plats) sont **stockées localement et exclusivement sur la mémoire de votre appareil** (via AsyncStorage). Aucune base de données externe ou serveur tiers ne stocke votre historique.

---

### 2. Partage des Données et Publicité
* **Aucune publicité :** NutriVision ne contient aucun réseau publicitaire ni aucun traceur marketing.
* **Aucune revente de données :** Nous ne vendons, ne louons et ne transférons aucune information personnelle à des tiers.

---

### 3. Contrôle et Suppression des Données
Vous conservez le contrôle total de vos données :
* Vous pouvez réinitialiser et supprimer l'ensemble de votre historique de repas directement depuis l'application.
* La désinstallation de l'application ou l'effacement du cache/stockage dans les paramètres Android supprime instantanément et définitivement toutes les données locales.

---

### 4. Contact
Pour toute question ou demande relative à cette politique de confidentialité :
* **Développeur :** Dialectal / Madani
* **E-mail :** contact@dialectal.fr / madmohsii@gmail.com
