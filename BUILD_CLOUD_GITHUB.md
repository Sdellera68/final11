# 🚀 BUILD APK DEPUIS GITHUB - MÉTHODES CLOUD

## ✅ MÉTHODE 1 : EXPO EAS BUILD (LE PLUS SIMPLE)

### **Avantages**
- ✅ Aucun Java/Android SDK nécessaire localement
- ✅ Build dans le cloud Expo
- ✅ Fonctionne depuis n'importe où (PC, smartphone, tablette)
- ✅ APK téléchargeable directement
- ✅ Support modules natifs (notre cas)
- ✅ Gratuit pour projets open source

### **Étapes Complètes**

#### **1. Push vers GitHub**
```bash
# Sur votre machine ou via GitHub web
cd /app
git init
git add .
git commit -m "ARIA - Version finale avec modules natifs"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/aria.git
git push -u origin main
```

#### **2. Installer EAS CLI (sur PC ou Termux Android)**
```bash
npm install -g eas-cli
```

#### **3. Login Expo**
```bash
eas login
# Créez un compte gratuit sur expo.dev si besoin
```

#### **4. Configurer EAS Build**
```bash
cd frontend
eas build:configure
```

Cela créera automatiquement `eas.json` :
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

#### **5. Lancer le Build Cloud**
```bash
# Build Preview APK (recommandé pour tests)
eas build --platform android --profile preview

# Ou Production
eas build --platform android --profile production
```

#### **6. Suivre le Build**
```
✓ Build en queue
✓ Build démarré
✓ Installation dépendances
✓ Compilation Kotlin
✓ Génération APK
✓ Upload terminé
```

**Temps : 10-20 minutes**

#### **7. Télécharger APK**
```
Option A : Via navigateur
- Lien fourni dans le terminal
- Ouvrir sur smartphone
- Télécharger APK

Option B : QR Code
- Scanner avec smartphone
- Téléchargement direct

Option C : Via commande
eas build:list
# Copier l'URL de téléchargement
```

#### **8. Installer sur Smartphone**
```
1. Activer "Sources inconnues" dans Paramètres
2. Ouvrir le fichier APK téléchargé
3. Installer
```

---

## ✅ MÉTHODE 2 : GITHUB ACTIONS (AUTOMATIQUE)

### **Build automatique à chaque push**

#### **Créer `.github/workflows/build-android.yml`**
```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    
    - name: Build APK
      run: |
        cd frontend/android
        chmod +x gradlew
        ./gradlew assembleDebug
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: aria-debug.apk
        path: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

#### **Utilisation**
```
1. Push vers GitHub
2. GitHub Actions build automatiquement
3. Aller dans "Actions" tab sur GitHub
4. Télécharger l'artifact "aria-debug.apk"
5. Transférer sur smartphone
6. Installer
```

---

## ✅ MÉTHODE 3 : TERMUX SUR SMARTPHONE (BUILD LOCAL)

### **Builder directement sur Android sans PC**

#### **1. Installer Termux**
```
F-Droid : https://f-droid.org/en/packages/com.termux/
Ou APK direct
```

#### **2. Installation Environnement**
```bash
# Dans Termux
pkg update && pkg upgrade
pkg install git nodejs openjdk-17 android-tools

# Configurer stockage
termux-setup-storage
```

#### **3. Clone Repo**
```bash
cd storage/downloads
git clone https://github.com/VOTRE_USERNAME/aria.git
cd aria/frontend
npm install
```

#### **4. Build APK**
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

**⚠️ Attention** : Build très lent sur smartphone (30-60 min)

---

## ✅ MÉTHODE 4 : SERVICES CLOUD TIERS

### **A. Codemagic**
```
1. Connecter GitHub
2. Sélectionner repo aria
3. Configurer workflow Android
4. Build automatique
5. Télécharger APK

Gratuit : 500 minutes/mois
```

### **B. Bitrise**
```
1. Connecter GitHub
2. Workflow React Native Android
3. Build cloud
4. APK téléchargeable

Gratuit : 200 builds/mois
```

### **C. AppCenter (Microsoft)**
```
1. Connecter GitHub
2. Configuration build Android
3. Distribution automatique
4. Installation OTA

Gratuit pour projets open source
```

---

## 📊 COMPARAISON DES MÉTHODES

| Méthode | Gratuit | Temps | Difficulté | Recommandé |
|---------|---------|-------|------------|------------|
| **EAS Build** | ✅ Oui | 10-20 min | ⭐ Facile | ✅ **OUI** |
| GitHub Actions | ✅ Oui | 15-25 min | ⭐⭐ Moyen | ✅ Oui |
| Termux Android | ✅ Oui | 30-60 min | ⭐⭐⭐ Difficile | ❌ Non |
| Codemagic | ✅ 500 min | 15-20 min | ⭐⭐ Moyen | ✅ Oui |
| Bitrise | ✅ 200 builds | 15-20 min | ⭐⭐ Moyen | ✅ Oui |

---

## 🎯 RECOMMANDATION : EXPO EAS BUILD

### **Pourquoi ?**
1. ✅ **Le plus simple** - Une seule commande
2. ✅ **Le plus rapide** - 10-20 minutes
3. ✅ **Support natif** - Modules Kotlin/Java supportés
4. ✅ **Depuis smartphone** - Fonctionne via Termux ou browser
5. ✅ **Gratuit** - Builds illimités pour open source

### **GUIDE COMPLET EAS BUILD**

#### **Sur PC/Mac/Linux**
```bash
# 1. Clone depuis GitHub
git clone https://github.com/VOTRE_USERNAME/aria.git
cd aria/frontend

# 2. Install EAS
npm install -g eas-cli

# 3. Login
eas login

# 4. Build
eas build --platform android --profile preview

# 5. Attendre 10-20 min
# 6. Télécharger APK depuis le lien fourni
```

#### **Sur Smartphone Android (Termux)**
```bash
# 1. Installer Termux depuis F-Droid

# 2. Dans Termux
pkg install git nodejs
npm install -g eas-cli

# 3. Clone
cd storage/downloads
git clone https://github.com/VOTRE_USERNAME/aria.git
cd aria/frontend

# 4. Login Expo
eas login

# 5. Build
eas build --platform android --profile preview

# 6. Copier l'URL de téléchargement
# 7. Ouvrir dans navigateur
# 8. Télécharger APK
# 9. Installer
```

#### **Via GitHub Codespaces (Browser)**
```bash
# 1. Aller sur github.com/VOTRE_USERNAME/aria
# 2. Code > Codespaces > Create codespace
# 3. Terminal dans le browser
npm install -g eas-cli
cd frontend
eas login
eas build --platform android --profile preview

# 4. Attendre le build
# 5. Télécharger APK depuis l'URL
```

---

## 🔐 SÉCURITÉ & CREDENTIALS

### **Pour EAS Build avec modules natifs**

Si vous avez besoin de signing keys :

```bash
# Générer keystore
keytool -genkey -v -keystore aria.keystore \
  -alias aria -keyalg RSA -keysize 2048 -validity 10000

# Upload vers EAS
eas credentials
```

Mais pour **Preview/Debug APK** : **PAS BESOIN** de signing !

---

## 💡 WORKFLOW RECOMMANDÉ

### **Développement Continu**

```bash
# 1. Développer localement (Preview Expo)
# 2. Push vers GitHub
git push origin main

# 3. Build cloud automatique (GitHub Actions OU)
eas build --platform android --profile preview

# 4. Télécharger APK
# 5. Tester sur smartphone
# 6. Itérer
```

---

## 📱 INSTALLATION DEPUIS CLOUD

### **Méthode A : Téléchargement Direct**
```
1. Build terminé → Copier URL APK
2. Ouvrir navigateur sur smartphone
3. Coller URL
4. Télécharger APK
5. Paramètres > Sécurité > Sources inconnues
6. Installer
```

### **Méthode B : QR Code**
```
1. EAS Build génère un QR code
2. Scanner avec smartphone
3. Téléchargement automatique
4. Installer
```

### **Méthode C : ADB Wireless**
```
1. Build génère APK
2. Télécharger sur PC
3. adb connect IP_SMARTPHONE:5555
4. adb install aria.apk
```

---

## ✅ RÉSUMÉ RAPIDE

**Pour builder depuis GitHub SANS avoir Java/Android SDK localement :**

```bash
# ÉTAPE 1 : Push vers GitHub
git push origin main

# ÉTAPE 2 : Build cloud avec EAS (10-20 min)
npm install -g eas-cli
eas login
cd frontend
eas build --platform android --profile preview

# ÉTAPE 3 : Télécharger APK
# Lien fourni dans terminal

# ÉTAPE 4 : Installer sur smartphone
# Ouvrir le fichier APK téléchargé
```

**C'EST TOUT ! ✅**

---

## 🎯 PROCHAINE ÉTAPE

1. **Poussez votre code sur GitHub**
2. **Installez EAS CLI** (sur PC ou Termux)
3. **Lancez `eas build`**
4. **Attendez 15 minutes**
5. **Téléchargez et installez l'APK**

**Voulez-vous que je crée le workflow GitHub Actions pour vous ?**
