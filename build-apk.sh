#!/bin/bash

# 🚀 SCRIPT DE BUILD APK ARIA - VÉRIFICATION COMPLÈTE
# Ce script vérifie TOUT avant de builder l'APK

set -e  # Arrêt immédiat en cas d'erreur

echo "════════════════════════════════════════════════"
echo "🚀 ARIA APK BUILD - Vérification Complète"
echo "════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
CHECKS_PASSED=0
CHECKS_FAILED=0

check_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ═══════════════════════════════════════════════════
# 1. VÉRIFICATION ENVIRONNEMENT
# ═══════════════════════════════════════════════════
echo "📋 1. VÉRIFICATION ENVIRONNEMENT"
echo "─────────────────────────────────────────────────"

# Check Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    check_success "Java installé: $JAVA_VERSION"
else
    check_failed "Java NON installé"
    echo "   ➜ Installez Java 17: sudo apt install openjdk-17-jdk"
    echo "   ➜ Ou macOS: brew install openjdk@17"
fi

# Check Android SDK
if [ -n "$ANDROID_HOME" ]; then
    check_success "ANDROID_HOME défini: $ANDROID_HOME"
else
    check_warning "ANDROID_HOME non défini"
    echo "   ➜ Exportez: export ANDROID_HOME=\$HOME/Android/Sdk"
fi

# Check Gradle
if [ -f "android/gradlew" ]; then
    check_success "Gradle wrapper trouvé"
else
    check_failed "Gradle wrapper manquant"
fi

echo ""

# ═══════════════════════════════════════════════════
# 2. VÉRIFICATION FICHIERS KOTLIN
# ═══════════════════════════════════════════════════
echo "📋 2. VÉRIFICATION FICHIERS KOTLIN"
echo "─────────────────────────────────────────────────"

KOTLIN_FILES=(
    "android/app/src/main/java/com/aria/assistant/MainActivity.kt"
    "android/app/src/main/java/com/aria/assistant/MainApplication.kt"
    "android/app/src/main/java/com/aria/assistant/modules/ADBManagerModule.kt"
    "android/app/src/main/java/com/aria/assistant/modules/ADBManagerPackage.kt"
    "android/app/src/main/java/com/aria/assistant/modules/AccessibilityModule.kt"
    "android/app/src/main/java/com/aria/assistant/modules/AccessibilityPackage.kt"
)

for file in "${KOTLIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Vérification basique syntaxe
        if grep -q "package com.aria.assistant" "$file"; then
            check_success "$(basename $file)"
        else
            check_failed "$(basename $file) - Package incorrect"
        fi
    else
        check_failed "$(basename $file) - MANQUANT"
    fi
done

echo ""

# ═══════════════════════════════════════════════════
# 3. VÉRIFICATION RESSOURCES XML
# ═══════════════════════════════════════════════════
echo "📋 3. VÉRIFICATION RESSOURCES XML"
echo "─────────────────────────────────────────────────"

# Strings.xml
if [ -f "android/app/src/main/res/values/strings.xml" ]; then
    if grep -q "accessibility_service_description" "android/app/src/main/res/values/strings.xml"; then
        check_success "strings.xml (avec description accessibilité)"
    else
        check_failed "strings.xml - Description accessibilité manquante"
    fi
else
    check_failed "strings.xml - MANQUANT"
fi

# Accessibility config
if [ -f "android/app/src/main/res/xml/accessibility_service_config.xml" ]; then
    check_success "accessibility_service_config.xml"
else
    check_failed "accessibility_service_config.xml - MANQUANT"
fi

echo ""

# ═══════════════════════════════════════════════════
# 4. VÉRIFICATION ANDROIDMANIFEST.XML
# ═══════════════════════════════════════════════════
echo "📋 4. VÉRIFICATION ANDROIDMANIFEST.XML"
echo "─────────────────────────────────────────────────"

MANIFEST="android/app/src/main/AndroidManifest.xml"

if [ -f "$MANIFEST" ]; then
    # Permissions
    PERMISSIONS=(
        "INTERNET"
        "ACCESS_NETWORK_STATE"
        "QUERY_ALL_PACKAGES"
        "BIND_ACCESSIBILITY_SERVICE"
    )
    
    for perm in "${PERMISSIONS[@]}"; do
        if grep -q "$perm" "$MANIFEST"; then
            check_success "Permission: $perm"
        else
            check_warning "Permission manquante: $perm"
        fi
    done
    
    # Service Accessibilité
    if grep -q "ARIAAccessibilityService" "$MANIFEST"; then
        check_success "Service Accessibilité déclaré"
    else
        check_failed "Service Accessibilité NON déclaré"
    fi
else
    check_failed "AndroidManifest.xml - MANQUANT"
fi

echo ""

# ═══════════════════════════════════════════════════
# 5. VÉRIFICATION MAINAPPLICATION.KT
# ═══════════════════════════════════════════════════
echo "📋 5. VÉRIFICATION MAINAPPLICATION.KT"
echo "─────────────────────────────────────────────────"

MAINAPP="android/app/src/main/java/com/aria/assistant/MainApplication.kt"

if [ -f "$MAINAPP" ]; then
    if grep -q "ADBManagerPackage" "$MAINAPP"; then
        check_success "ADBManagerPackage enregistré"
    else
        check_failed "ADBManagerPackage NON enregistré"
    fi
    
    if grep -q "AccessibilityPackage" "$MAINAPP"; then
        check_success "AccessibilityPackage enregistré"
    else
        check_failed "AccessibilityPackage NON enregistré"
    fi
else
    check_failed "MainApplication.kt - MANQUANT"
fi

echo ""

# ═══════════════════════════════════════════════════
# 6. VÉRIFICATION DÉPENDANCES NPM
# ═══════════════════════════════════════════════════
echo "📋 6. VÉRIFICATION DÉPENDANCES NPM"
echo "─────────────────────────────────────────────────"

if [ -d "node_modules" ]; then
    check_success "node_modules installé"
else
    check_warning "node_modules manquant - Exécutez: npm install"
fi

if [ -f "package.json" ]; then
    check_success "package.json trouvé"
else
    check_failed "package.json manquant"
fi

echo ""

# ═══════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════
echo "════════════════════════════════════════════════"
echo "📊 RÉSUMÉ"
echo "════════════════════════════════════════════════"
echo -e "${GREEN}✅ Vérifications réussies: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Vérifications échouées: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUT EST OK ! Prêt pour le build !${NC}"
    echo ""
    echo "════════════════════════════════════════════════"
    echo "🚀 LANCEMENT DU BUILD"
    echo "════════════════════════════════════════════════"
    echo ""
    
    # Demander confirmation
    read -p "Voulez-vous lancer le build maintenant ? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📦 Build en cours..."
        echo ""
        
        cd android
        
        # Clean build
        echo "🧹 Nettoyage..."
        ./gradlew clean
        
        # Build debug APK
        echo "🔨 Compilation APK debug..."
        ./gradlew assembleDebug
        
        # Résultat
        APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$APK_PATH" ]; then
            echo ""
            echo "════════════════════════════════════════════════"
            echo -e "${GREEN}✅ BUILD RÉUSSI !${NC}"
            echo "════════════════════════════════════════════════"
            echo ""
            echo "📱 APK généré : $APK_PATH"
            echo ""
            echo "📋 PROCHAINES ÉTAPES :"
            echo "   1. Connectez votre smartphone en USB"
            echo "   2. Activez le débogage USB"
            echo "   3. Installez: adb install -r $APK_PATH"
            echo "   4. Activez le service Accessibilité dans Paramètres"
            echo ""
        else
            echo -e "${RED}❌ BUILD ÉCHOUÉ - APK non trouvé${NC}"
            exit 1
        fi
    else
        echo "Build annulé."
    fi
else
    echo -e "${RED}❌ DES PROBLÈMES ONT ÉTÉ DÉTECTÉS !${NC}"
    echo ""
    echo "⚠️  Corrigez les erreurs ci-dessus avant de builder."
    echo ""
    exit 1
fi
