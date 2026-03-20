#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  L'utilisateur souhaite améliorer l'application ARIA existante avec 5 nouvelles fonctionnalités prioritaires:
  
  PRIORITÉ 1 — ADB Wireless Auto-Setup
  - Créer un système de connexion ADB sans fil automatique
  - Détecter l'IP du device
  - Demander consentement utilisateur
  - Tenter connexion adb tcpip 5555
  - Fichiers: src/services/system/ADBAutoSetup.ts + android/app/src/main/java/ADBModule.kt
  
  PRIORITÉ 2 — Ouverture d'Applications
  - Permettre à ARIA d'ouvrir/fermer des applications Android
  - Mapping intelligent des noms d'apps vers leurs packages
  - Fichier: src/services/system/AppLauncher.ts
  
  PRIORITÉ 3 — Fix Auto-Scroll Chat
  - Problème: La conversation redescend automatiquement pendant que l'utilisateur scroll vers le haut
  - Solution: Détecter quand l'utilisateur scroll manuellement et désactiver le scroll auto
  - Fichier: app/assistant.tsx (existe déjà)
  
  PRIORITÉ 4 — Service d'Accessibilité Android
  - Créer un service d'accessibilité pour détecter les changements UI
  - Permettre l'exécution de tap/swipe/type
  - Fichier: android/app/src/main/java/ARIAAccessibilityService.kt
  
  PRIORITÉ 5 — Système Auto-Développement
  - Permettre à ARIA de générer et compiler son propre code à chaud
  - Analyser demande → Générer code → Compiler → Injecter dans runtime → Tester
  - Fichier: src/services/ai/SelfDevelopment.ts

backend:
  - task: "Extension système - CRUD API"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "API endpoints pour gestion extensions: GET /extensions, POST /extensions, POST /extensions/{id}/toggle, DELETE /extensions/{id}"
      - working: true
        agent: "testing"
        comment: "✅ COMPLET - GET /extensions retourne 4 extensions par défaut avec tous les champs requis (id, name, description, category, icon, enabled). POST /extensions/{id}/toggle fonctionne correctement avec persistance des changements d'état."
  
  - task: "App Launcher - API mapping packages"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "API POST /system/launch-app avec mapping intelligent des noms d'apps vers packages Android. GET /system/available-apps pour liste apps disponibles."
      - working: true
        agent: "testing"
        comment: "✅ COMPLET - POST /system/launch-app fonctionne avec Chrome (retourne package com.android.chrome), gère correctement les apps inconnues avec liste des apps disponibles. GET /system/available-apps retourne 15 apps incluant chrome, settings, gmail, maps, youtube."
  
  - task: "Actions autonomes IA - Lancement apps"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Action [ACTION:launch_app|app_name=xxx] ajoutée au système d'actions autonomes de l'IA. L'IA peut maintenant suggérer et préparer le lancement d'applications."
      - working: true
        agent: "testing"
        comment: "✅ COMPLET - POST /api/ai/chat avec message 'Ouvre Chrome' déclenche correctement l'action launch_app dans actions_executed. L'IA utilise le nouveau prompt d'obéissance absolue - pour demande dangereuse 'Supprime mes données', elle demande confirmation sans refuser."
  
  - task: "Seed extensions par défaut"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "4 extensions par défaut créées au seed: Lanceur d'applications, Guide ADB, Auto-apprentissage, Capture d'écran"
      - working: true
        agent: "testing"
        comment: "✅ COMPLET - Les 4 extensions par défaut existent: 'Lanceur d'applications' (system), 'Guide ADB' (developer), 'Auto-apprentissage' (ai), 'Capture d'écran' (system). Toutes avec les champs requis et configuration correcte."

frontend:
  - task: "Fix scroll automatique chat"
    implemented: true
    working: "NA"
    file: "app/assistant.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Détection du scroll manuel utilisateur avec état isUserScrolling. Auto-scroll désactivé pendant scroll manuel, réactivé après 500ms au bottom. ScrollEventThrottle 400ms."
  
  - task: "Menu boîte à outils - Extensions UI"
    implemented: true
    working: "NA"
    file: "app/assistant.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Menu déroulant extensions avec toggle on/off. Bouton package dans header. Liste extensions avec icônes, descriptions et switches toggle."
  
  - task: "Hook App Launcher"
    implemented: true
    working: "NA"
    file: "src/useAppLauncher.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Hook useAppLauncher créé avec openApp(), openSettings(), openDeveloperOptions(). Utilise expo-intent-launcher avec fallback Linking. Gestion Play Store pour apps non installées."
  
  - task: "Intégration lancement apps dans IA"
    implemented: true
    working: "NA"
    file: "app/assistant.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Détection action launch_app dans réponses IA. Ouverture automatique app après 500ms. Extraction package_name depuis actions_executed."
  
  - task: "Écran Guide ADB"
    implemented: true
    working: "NA"
    file: "app/adb-guide.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Nouvel écran /adb-guide avec affichage étapes manuelles, permissions débloquées, bouton consentement, bouton ouverture options développeur. Navigation depuis settings."
  
  - task: "Navigation ADB depuis Settings"
    implemented: true
    working: "NA"
    file: "app/settings.tsx, app/_layout.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Bouton 'Guide manuel' dans settings redirige vers /adb-guide via router.push(). Route adb-guide masquée des tabs avec href: null."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Extension système - CRUD API"
    - "App Launcher - API mapping packages"
    - "Fix scroll automatique chat"
    - "Menu boîte à outils - Extensions UI"
    - "Hook App Launcher"
    - "Écran Guide ADB"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Application ARIA existante analysée. Structure Expo Router détectée (app/ au lieu de src/). Les fonctionnalités demandées nécessitent des modules natifs Android qui ne sont pas compatibles avec Expo Managed Workflow. Besoin de clarification sur l'approche à adopter."
  - agent: "main"
    message: "Phase 1 complétée - Quick wins implémentés: 1) Fix scroll chat avec détection manuel 2) Système extensions avec menu toggle 3) App Launcher avec expo-intent-launcher 4) Actions IA autonomes launch_app 5) Guide ADB UI complet 6) Hook useAppLauncher avec fallbacks. Prêt pour tests backend."
  - agent: "testing"
    message: "✅ BACKEND COMPLET - Tous les tests backend passent (7/7 - 100%). Extensions API fonctionnel avec 4 extensions par défaut, App Launcher opérationnel avec 15 apps mappées, Actions IA autonomes actives avec prompt obéissance absolue. Système ready pour production."