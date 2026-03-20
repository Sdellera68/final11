# ARIA — Assistant Réactif Intelligent Autonome
## PRD Phase 1 : Pré-développement fonctionnel (Android)

### Vision
Application Android autonome, entièrement fonctionnelle, exploitant les capacités d'interaction offertes par Android via Expo React Native avec un assistant IA intégré (Claude Sonnet 4.5) qui apprend et s'améliore continuellement.

### Architecture technique
- **Frontend** : Expo SDK 54 / React Native (TypeScript)
- **Backend** : FastAPI (Python) — 18+ endpoints REST
- **Base de données** : MongoDB (motor async)
- **IA** : Claude Sonnet 4.5 via Emergent Integration (clé transparente)
- **Navigation** : 5 onglets expo-router (Tableau de bord, Assistant IA, Automatisations, Journal, Paramètres)

### Modules implémentés

#### 1. Module IA (ARIA)
- Chat conversationnel avec mémoire contextuelle persistante
- Système d'apprentissage par extraction de connaissances (knowledge_base)
- Prompt système incluant base de connaissances + contexte système en temps réel
- Capacité d'auto-amélioration : l'IA identifie des patterns et propose des optimisations
- Réponses en français

#### 2. Module Monitoring Système
- Batterie : niveau, état de charge (expo-battery)
- Réseau : type, connectivité (expo-network)
- Appareil : modèle, nom, version OS (expo-device)
- Capteurs : accéléromètre temps réel x/y/z (expo-sensors)
- Détection d'écran : capture/enregistrement (expo-screen-capture)
- État application : actif/arrière-plan/verrouillé (AppState)

#### 3. Module Automatisation
- Règles conditionnelles avec déclencheurs (batterie, réseau, état app)
- Actions : notification, journalisation, analyse IA
- Toggle on/off, création, suppression
- Évaluation automatique des triggers contre le contexte courant
- 3 automatisations par défaut (seed)

#### 4. Module Gestion des Ressources (Auto-adaptatif)
- **Mode Turbo** (en charge) : rafraîchissement 10s
- **Mode Normal** (batterie > 60%) : rafraîchissement 25s
- **Mode Éco** (batterie 25-60%) : rafraîchissement 50s
- **Mode Minimal** (batterie < 25%) : rafraîchissement 90s
- **AUCUNE RESTRICTION** : toutes les fonctions restent actives, seule la fréquence s'adapte
- Badge "Libre" affiché en permanence

#### 5. Module Détection d'Écran
- Détection de captures d'écran en temps réel
- Compteur de captures
- Journalisation automatique des événements de capture
- Compatible avec l'enregistrement d'écran système (non bloquant)

#### 6. Module Journalisation
- Enregistrement complet de toutes les activités
- Catégorisation : info, succès, alerte, erreur
- Filtrage par type et module
- Export et nettoyage

#### 7. Module Documentation
- Génération automatique de documentation technique complète
- Inclut : architecture, modules, dépendances, permissions, base de connaissances, automatisations, logs
- Partage via Share API

#### 8. Module Verrouillage d'Écran
- Détection de l'état AppState (active/background/inactive)
- Pause automatique quand le téléphone est verrouillé
- Reprise automatique au déverrouillage
- Journalisation des transitions

### Permissions Android
- ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE
- INTERNET
- RECEIVE_BOOT_COMPLETED
- POST_NOTIFICATIONS
- VIBRATE
- NSMotionUsageDescription (iOS sensors)

### API Endpoints (18+)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/ai/chat | Conversation avec ARIA |
| GET | /api/ai/history | Historique de chat |
| DELETE | /api/ai/history | Effacer l'historique |
| POST | /api/ai/learn | Extraire les apprentissages |
| GET/POST/DELETE | /api/ai/knowledge | CRUD base de connaissances |
| GET/POST/DELETE | /api/automations | CRUD automatisations |
| POST | /api/automations/{id}/toggle | Activer/Désactiver |
| POST | /api/automations/evaluate | Évaluer les déclencheurs |
| GET/POST/DELETE | /api/logs | CRUD journaux |
| POST/GET | /api/system/status | État système |
| POST | /api/documentation/generate | Générer documentation |
| GET | /api/stats | Statistiques globales |
| POST | /api/seed | Données initiales |

### Phase 2 (prévue)
- Conformité RGPD et légale
- Chiffrement bout-en-bout
- Module MediaProjection (enregistrement d'écran natif)
- Services d'arrière-plan avancés
- Certification sécurité
- Intégration root optionnelle
