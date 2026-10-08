# Politique de Confidentialité — NutriVision

**Dernière mise à jour :** 8 octobre 2026

L'application mobile **NutriVision** (éditée par AMC Créateur / Dialectal) est conçue pour respecter rigoureusement la vie privée de ses utilisateurs tout en offrant des fonctionnalités d'analyse nutritionnelle avancées. Cette politique de confidentialité vous informe sur la manière dont vos données sont collectées, utilisées et protégées.

---

### 1. Données collectées et autorisations

#### A. Accès à la Caméra (`CAMERA`)
NutriVision utilise l'autorisation de la caméra exclusivement pour :
* Permettre la détection et la reconnaissance visuelle en temps réel des aliments et des plats cuisinés.
* Scanner les codes-barres des produits alimentaires emballés.
* **Important :** Aucun flux vidéo continu n'est enregistré à votre insu. Les prises de vue ne sont effectuées que lors de votre interaction active avec le scanner.

#### B. Analyse Visuelle par Intelligence Artificielle (Google Gemini Vision)
Lorsque vous effectuez un scan d'aliment, l'image correspondante est transmise de manière sécurisée et chiffrée (HTTPS / SSL) à l'API Google Gemini dans l'unique but d'analyser les composants du plat et d'estimer les macronutriments (calories, protéines, glucides, lipides, sucres, fibres), le Nutri-Score et le score NOVA. Les images sont traitées de façon éphémère et ne sont ni revendues, ni conservées.

#### C. Analyse des Codes-Barres (Open Food Facts)
Lors de la lecture d'un code-barres, le numéro du code-barres est transmis à la base de données ouverte Open Food Facts pour récupérer la fiche nutritionnelle officielle du produit.

#### D. Publicité et Identifiant Publicitaire (Google AdMob)
Dans la version gratuite de l'application, NutriVision intègre le SDK **Google AdMob** pour diffuser des bannières et annonces récompensées. 
* Sous réserve de votre consentement, Google AdMob peut collecter des identifiants non nominatifs (IDFA sur iOS, Google Advertising ID sur Android) à des fins de mesure d'audience et de personnalisation des annonces.
* Les utilisateurs ayant souscrit à l'offre **NutriVision Pro** bénéficient d'une expérience 100% sans publicité.

#### E. Gestion des Abonnements et Achats Intégrés (RevenueCat & Stores)
Pour gérer les abonnements **NutriVision Pro**, l'application utilise **RevenueCat** en lien avec l'App Store d'Apple et Google Play Billing.
* Ces services traitent des identifiants de transaction anonymes pour valider l'état de votre abonnement et synchroniser vos droits sur vos appareils.

#### F. Stockage Local sur votre Téléphone
Toutes vos données de suivi personnel (historique des repas, calories quotidiennes, objectifs nutritionnels, préférences diététiques) sont **stockées localement et exclusivement sur la mémoire de votre appareil** (via AsyncStorage). Aucune base de données externe ne stocke votre historique privé.

---

### 2. Partage et Sécurité des Données
* **Aucune revente de données :** Nous ne vendons, ne louons et ne transférons aucune information personnelle à des tiers.
* **Sécurité :** Tous les échanges avec les APIs externes (Google Gemini, Open Food Facts, RevenueCat) s'effectuent via des connexions chiffrées sécurisées HTTPS / TLS.

---

### 3. Contrôle et Suppression des Données
Vous conservez le contrôle total de vos données :
* Vous pouvez réinitialiser et supprimer l'ensemble de votre historique de repas directement depuis l'application.
* La désinstallation de l'application ou l'effacement des données de l'application dans les réglages de votre appareil supprime instantanément et définitivement toutes les données locales.

---

### 4. Contact & Support
Pour toute question ou demande relative à cette politique de confidentialité :
* **Éditeur :** AMC Créateur / Mohamed Madani
* **E-mail :** amccreateur@gmail.com
* **Site officiel :** https://madanijr.github.io/nutrivision/
