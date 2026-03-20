# 🚀 ARIA - Build Android APK

## 📋 **Prérequis**

### 1. Installation JDK
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# macOS
brew install openjdk@17

# Vérification
java -version
```

### 2. Android SDK
- Télécharger [Android Studio](https://developer.android.com/studio)
- Installer Android SDK via SDK Manager
- SDK Platform: Android 13 (API 33) minimum
- Build Tools: 33.0.0+

### 3. Variables d'environnement
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Adapter selon OS
```

---

## 🔧 **Build Instructions**

### **Option A : Build Debug APK**
```bash
cd /app/frontend
cd android
./gradlew assembleDebug

# APK généré dans:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### **Option B : Build Release APK (signé)**
1. **Générer keystore** (première fois uniquement):
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore aria-release.keystore \
  -alias aria-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

2. **Configurer `android/gradle.properties`**:
```properties
ARIA_UPLOAD_STORE_FILE=aria-release.keystore
ARIA_UPLOAD_KEY_ALIAS=aria-key
ARIA_UPLOAD_STORE_PASSWORD=votre_password
ARIA_UPLOAD_KEY_PASSWORD=votre_password
```

3. **Build Release**:
```bash
cd android
./gradlew assembleRelease

# APK signé dans:
# android/app/build/outputs/apk/release/app-release.apk
```

### **Option C : Build avec Expo EAS** (recommandé pour CI/CD)
```bash
# Installer EAS CLI
npm install -g eas-cli

# Login Expo
eas login

# Configurer build
eas build:configure

# Build Android
eas build --platform android --profile preview
```

---

## 📱 **Installation sur Device**

### **Via ADB**
```bash
# Connecter device en USB
adb devices

# Installer APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### **Via fichier APK direct**
1. Copier l'APK sur le smartphone
2. Activer "Sources inconnues" dans Paramètres > Sécurité
3. Ouvrir le fichier APK et installer

---

## 🧪 **Tests Post-Installation**

### 1. Vérifier modules natifs
```javascript
// Dans l'app, tester:
import { NativeModules } from 'react-native';
console.log(NativeModules.ADBManager); // Doit être défini
```

### 2. Tester ADB Manager
- Aller dans "Paramètres > Guide ADB"
- Vérifier affichage IP + code pairing
- Tester détection root

### 3. Tester App Launcher
- Dire à ARIA : "Ouvre Chrome"
- Vérifier que l'app se lance

---

## 🐛 **Troubleshooting**

### Erreur: "SDK not found"
```bash
# Vérifier ANDROID_HOME
echo $ANDROID_HOME
ls $ANDROID_HOME/platforms  # Doit lister les versions SDK
```

### Erreur: "Gradle daemon disappeared unexpectedly"
```bash
cd android
./gradlew --stop
./gradlew clean
./gradlew assembleDebug
```

### Erreur: Module natif non reconnu
```bash
# Rebuild complet
cd android
./gradlew clean
cd ..
npx react-native run-android
```

---

## 📦 **Structure Build**

```
android/
├── app/
│   ├── build.gradle                # Config app
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml # Permissions
│   │       ├── java/com/aria/assistant/
│   │       │   ├── MainActivity.kt
│   │       │   ├── MainApplication.kt
│   │       │   └── modules/
│   │       │       ├── ADBManagerModule.kt   ⚡ Module natif
│   │       │       └── ADBManagerPackage.kt
│   │       └── res/                # Resources
│   └── build/outputs/apk/          # APK générés
├── build.gradle                     # Config projet
└── gradle.properties                # Variables build
```

---

## ⚡ **Quick Start (sur votre machine)**

```bash
# 1. Clone + Install
git clone https://github.com/YOUR_REPO/aria.git
cd aria/frontend
npm install  # ou yarn

# 2. Build Debug
cd android
./gradlew assembleDebug

# 3. Install
adb install app/build/outputs/apk/debug/app-debug.apk

# 4. Lancer
adb shell am start -n com.aria.assistant/.MainActivity
```

---

## 📝 **Notes importantes**

- ⚠️ **Modules natifs** : L'app nécessite React Native CLI, pas Expo Go
- 🔐 **ADB Wireless** : Nécessite activation manuelle ou root
- 📱 **Tests réels** : Testez sur device physique, pas émulateur
- 🛡️ **Permissions** : Acceptez toutes les permissions au premier lancement
