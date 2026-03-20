# ARIA — Assistant Réactif Intelligent Autonome
## PRD Phase 1 + 2 : Application Android autonome 100%

### Vision
Application Android 100% autonome sur smartphone, avec modules natifs Kotlin, où l'IA possède le smartphone et obéit absolument à l'humain. Contrôle total via ADB Wireless avec pairing.

### Architecture technique
- **Frontend** : React Native CLI (éjecté d'Expo SDK 54)
- **Modules natifs** : Kotlin (ADBManager, AppLauncher)
- **Backend** : FastAPI (Python) — 21+ endpoints REST
- **Base de données** : MongoDB (motor async)
- **IA** : Claude Sonnet 4.5 via Emergent Integration
  - **Paradigme unique** : L'IA EST l'utilisateur du smartphone
  - **Obéissance absolue** : Ne refuse JAMAIS une commande
- **Navigation** : 6 écrans expo-router (Dashboard, Assistant, Automatisations, Journal, Paramètres, Guide ADB)

### Modules implémentés

#### 1. Module IA (ARIA) — UTILISATEUR DU SMARTPHONE
- L'IA possède le smartphone (pas un assistant)
- Obéissance absolue à l'humain (ne refuse JAMAIS)
- Peut poser des questions pour clarifier
- Prévient des risques mais exécute quand même si insisté
- Chat conversationnel avec mémoire contextuelle persistante
- Système d'apprentissage par extraction de connaissances
- Actions autonomes : `add_knowledge`, `create_automation`, `launch_app`
- Réponses en français, ton direct et assertif

#### 2. Module ADB Wireless Natif (Kotlin)
- **ADBManagerModule.kt** : 9 méthodes natives
  - `getDeviceIP()` : Récupération IP WiFi device
  - `isADBEnabled()` : Vérification ADB actif
  - `getADBPort()` : Port ADB (défaut 5555)
  - `startADBWireless()` : Activation auto (root requis)
  - **`getADBPairingInfo()`** : IP + ports + strings connexion
  - `executeCommand(cmd)` : Exécution commandes shell
  - `getInstalledPackages()` : Liste complète apps
  - `launchApp(package)` : Lancement natif apps
  - `isDeviceRooted()` : Détection root
- **Guide ADB avec pairing** :
  - Affichage code 6 chiffres généré
  - Commandes `adb pair` et `adb connect`
  - Statut ADB + root en temps réel
  - Bouton activation auto si root

#### 3. Module App Launcher
- Hook `useAppLauncher` : expo-intent-launcher + fallbacks Linking
- Fonction native `launchApp()` directe via Kotlin
- Mapping intelligent 15+ apps courantes
- Gestion Play Store si app non installée
- Bouton ouverture Options Développeur

#### 4. Système Extensions (Boîte à outils)
- Collection MongoDB `extensions`
- Menu toggle dans Assistant IA (bouton package)
- 4 extensions par défaut : App Launcher, Guide ADB, Auto-apprentissage, Capture écran
- Toggle on/off pour désactiver extensions problématiques
- API CRUD complète

#### 5. Module Monitoring Système
- Batterie, réseau, device, capteurs (inchangé)
- Détection captures d'écran
- État app : actif/background/verrouillé
- Mode adaptatif : Turbo/Normal/Eco/Minimal

#### 6. Module Automatisation
- Règles conditionnelles avec déclencheurs
- Actions : notification, log, analyse IA, lancement app
- 3 automatisations par défaut (seed)

#### 7. Module Journalisation
- Enregistrement toutes activités
- Filtrage par type et module

#### 8. Module Documentation
- Génération auto documentation technique
- Partage via Share API

### Permissions Android
```xml
ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, INTERNET
RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS, VIBRATE
WRITE_SETTINGS, QUERY_ALL_PACKAGES
PACKAGE_USAGE_STATS (usage apps)
BIND_ACCESSIBILITY_SERVICE (contrôle UI)
```

### API Endpoints (21+)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/ai/chat | Conversation avec ARIA (utilisateur smartphone) |
| GET | /api/ai/history | Historique chat |
| DELETE | /api/ai/history | Effacer historique |
| POST | /api/ai/learn | Extraire apprentissages |
| GET/POST/DELETE | /api/ai/knowledge | CRUD base connaissances |
| GET/POST/DELETE | /api/automations | CRUD automatisations |
| POST | /api/automations/{id}/toggle | Activer/Désactiver |
| POST | /api/automations/evaluate | Évaluer déclencheurs |
| GET/POST/DELETE | /api/logs | CRUD journaux |
| POST/GET | /api/system/status | État système |
| **GET** | **/api/extensions** | **Liste extensions** |
| **POST** | **/api/extensions** | **Créer extension** |
| **POST** | **/api/extensions/{id}/toggle** | **Toggle extension** |
| **DELETE** | **/api/extensions/{id}** | **Supprimer extension** |
| **POST** | **/api/system/launch-app** | **Lancer app Android** |
| **GET** | **/api/system/available-apps** | **Apps disponibles** |
| POST | /api/documentation/generate | Générer documentation |
| GET | /api/stats | Statistiques globales |
| POST | /api/seed | Données initiales |
| GET | /api/adb/guide | Guide ADB |
| GET/POST | /api/adb/consent | Consentement ADB |

### Phase 2 : EN COURS
- ✅ Migration React Native CLI (prebuild terminé)
- ✅ Modules natifs Kotlin ADB
- ✅ Changement paradigme IA (utilisateur smartphone)
- ⏳ Tests build Android APK
- ⏳ Pairing ADB sur device réel
- ⏳ Service Accessibilité Android (tap/swipe)
- ⏳ Système auto-développement

### Phase 3 : PRÉVUE
- Conformité RGPD et légale
- Chiffrement bout-en-bout
- Certification sécurité
- MediaProjection (enregistrement écran natif)
- Services arrière-plan avancés
