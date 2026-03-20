#!/bin/bash

# 🧪 SCRIPT DE TEST PRÉ-BUILD EAS - ARIA

echo "════════════════════════════════════════════════"
echo "🧪 TESTS PRÉ-BUILD EAS - ARIA"
echo "════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

test_ok() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ═══════════════════════════════════════════════════
# 1. TEST CONFIGURATION EXPO
# ═══════════════════════════════════════════════════
echo "📋 1. VALIDATION CONFIGURATION EXPO"
echo "─────────────────────────────────────────────────"

if [ ! -f "app.json" ]; then
    test_fail "app.json manquant"
else
    test_ok "app.json trouvé"
    
    # Vérifier package name
    if grep -q '"package": "com.aria.assistant"' app.json; then
        test_ok "Package Android correct (com.aria.assistant)"
    else
        test_fail "Package Android manquant ou incorrect"
    fi
    
    # Vérifier version
    if grep -q '"version"' app.json; then
        VERSION=$(grep '"version"' app.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
        test_ok "Version trouvée: $VERSION"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════
# 2. TEST EXPO DOCTOR
# ═══════════════════════════════════════════════════
echo "📋 2. EXPO DOCTOR (Validation Complète)"
echo "─────────────────────────────────────────────────"

npx expo-doctor@latest > /tmp/expo-doctor.log 2>&1
DOCTOR_EXIT=$?

if [ $DOCTOR_EXIT -eq 0 ]; then
    test_ok "Expo Doctor: Aucune erreur"
else
    test_warn "Expo Doctor: Vérifications échouées"
    echo "Voir détails: cat /tmp/expo-doctor.log"
fi

echo ""

# ═══════════════════════════════════════════════════
# 3. TEST DÉPENDANCES
# ═══════════════════════════════════════════════════
echo "📋 3. VÉRIFICATION DÉPENDANCES"
echo "─────────────────────────────────────────────────"

if [ -d "node_modules" ]; then
    test_ok "node_modules installé"
    
    # Vérifier packages critiques
    CRITICAL_PACKAGES=("expo" "expo-router" "react-native" "react")
    for pkg in "${CRITICAL_PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ]; then
            test_ok "$pkg installé"
        else
            test_fail "$pkg MANQUANT"
        fi
    done
else
    test_fail "node_modules manquant - Exécutez: npm install"
fi

echo ""

# ═══════════════════════════════════════════════════
# 4. TEST ANDROID NATIF
# ═══════════════════════════════════════════════════
echo "📋 4. VÉRIFICATION ANDROID NATIF"
echo "─────────────────────────────────────────────────"

if [ ! -d "android" ]; then
    test_warn "Dossier android/ manquant"
    test_info "EAS Prebuild va le générer automatiquement"
else
    test_ok "Dossier android/ présent"
    
    # Vérifier gradlew
    if [ -f "android/gradlew" ]; then
        test_ok "gradlew trouvé"
        
        # Test permissions
        if [ -x "android/gradlew" ]; then
            test_ok "gradlew exécutable"
        else
            test_warn "gradlew pas exécutable (sera corrigé par EAS)"
        fi
    else
        test_fail "gradlew manquant"
    fi
    
    # Vérifier gradle wrapper jar
    if [ -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
        test_ok "gradle-wrapper.jar présent"
    else
        test_fail "gradle-wrapper.jar MANQUANT"
    fi
    
    # Vérifier AndroidManifest.xml
    if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
        test_ok "AndroidManifest.xml trouvé"
        
        # Vérifier package
        if grep -q 'package="com.aria.assistant"' android/app/src/main/AndroidManifest.xml; then
            test_ok "Package correct dans AndroidManifest"
        else
            test_fail "Package incorrect dans AndroidManifest"
        fi
    else
        test_fail "AndroidManifest.xml manquant"
    fi
    
    # Vérifier modules natifs
    MODULES_DIR="android/app/src/main/java/com/aria/assistant/modules"
    if [ -d "$MODULES_DIR" ]; then
        test_ok "Dossier modules/ natifs présent"
        
        MODULE_COUNT=$(ls -1 "$MODULES_DIR"/*.kt 2>/dev/null | wc -l)
        if [ "$MODULE_COUNT" -gt 0 ]; then
            test_ok "Modules Kotlin trouvés: $MODULE_COUNT fichiers"
        else
            test_warn "Aucun module Kotlin (.kt) trouvé"
            test_info "Les modules seront ajoutés après prebuild"
        fi
    else
        test_warn "Dossier modules/ natifs absent"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════
# 5. TEST EAS CONFIGURATION
# ═══════════════════════════════════════════════════
echo "📋 5. VÉRIFICATION CONFIGURATION EAS"
echo "─────────────────────────────────────────────────"

if [ ! -f "eas.json" ]; then
    test_fail "eas.json manquant"
else
    test_ok "eas.json trouvé"
    
    # Vérifier profil preview
    if grep -q '"preview"' eas.json; then
        test_ok "Profil 'preview' défini"
    else
        test_fail "Profil 'preview' manquant"
    fi
    
    # Vérifier buildType APK
    if grep -q '"buildType": "apk"' eas.json; then
        test_ok "buildType: apk configuré"
    else
        test_warn "buildType: apk non trouvé"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════
# 6. TEST ASSETS
# ═══════════════════════════════════════════════════
echo "📋 6. VÉRIFICATION ASSETS"
echo "─────────────────────────────────────────────────"

ASSETS=("assets/images/icon.png" "assets/images/adaptive-icon.png" "assets/images/splash-icon.png")

for asset in "${ASSETS[@]}"; do
    if [ -f "$asset" ]; then
        test_ok "$(basename $asset) trouvé"
    else
        test_fail "$(basename $asset) MANQUANT"
    fi
done

echo ""

# ═══════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════
echo "════════════════════════════════════════════════"
echo "📊 RÉSUMÉ DES TESTS"
echo "════════════════════════════════════════════════"
echo -e "${GREEN}✅ Tests réussis: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests échoués: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 PRÊT POUR EAS BUILD !${NC}"
    echo ""
    echo "Commande à exécuter:"
    echo "  eas build --platform android --profile preview"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  DES PROBLÈMES ONT ÉTÉ DÉTECTÉS${NC}"
    echo ""
    echo "Actions recommandées:"
    [ ! -d "node_modules" ] && echo "  1. npm install"
    [ ! -d "android" ] && echo "  2. npx expo prebuild"
    echo ""
    exit 1
fi
