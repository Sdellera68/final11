# 🤖 ARIA - Assistant IA Autonome Android

**L'IA qui possède le smartphone**

[![Build APK](https://github.com/VOTRE_USERNAME/aria/actions/workflows/build-android.yml/badge.svg)](https://github.com/VOTRE_USERNAME/aria/actions)

---

## 🎯 Présentation

ARIA est un assistant IA **totalement autonome** pour Android qui :
- 👁️ **Voit** l'écran (vision AI à venir)
- 🖐️ **Agit** physiquement (tap, swipe, navigation)
- 🧠 **Pense** avec réflexion avancée (6 étapes)
- 🚫 **N'a aucune limite** (obéissance absolue)
- 📱 **Possède** le smartphone (pas un assistant)

---

## 🚀 Fonctionnalités Actuelles

### ✅ **Opérationnelles en Preview Expo**
- 💬 Chat IA avec Claude Sonnet 4.5
- 🔧 Système d'extensions (boîte à outils)
- 📊 Monitoring système complet
- ⚙️ Automatisations intelligentes
- 📝 Journal d'activités
- 🚀 App Launcher (expo-intent-launcher)

### ✅ **Opérationnelles sur APK Android**
- 🔌 ADB Wireless avec pairing automatique
- 🖱️ Actions tactiles (tap, swipe, scroll)
- 📱 Lancement natif d'applications
- 🔓 Détection root
- 🎯 Service Accessibilité Android

### ⏳ **En Développement (10%)**
- 👁️ Vision AI (capture + analyse écran)
- 🤖 Auto-développement
- 🎨 Plugins dynamiques

---

## 📦 Installation

### **Option A : Télécharger APK depuis GitHub Actions**

1. Aller dans l'onglet **Actions** de ce repo
2. Cliquer sur le dernier build réussi
3. Télécharger l'artifact **aria-debug-apk**
4. Installer sur votre smartphone Android

### **Option B : Builder avec EAS (Cloud)**

```bash
npm install -g eas-cli
eas login
cd frontend
eas build --platform android --profile preview
```

### **Option C : Builder Localement**

**Prérequis** : Java 17 + Android SDK

```bash
cd frontend/android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚙️ Configuration Post-Installation

### **1. Activer Service Accessibilité (CRITIQUE)**

```
Paramètres > Accessibilité > ARIA Accessibility Service > ACTIVER
```

Sans cela, ARIA ne pourra pas faire de tap/swipe !

### **2. Activer ADB Wireless (Optionnel)**

```
Paramètres > Options développeur > Débogage sans fil > ACTIVER
ARIA > Paramètres > Guide ADB > Suivre les étapes
```

### **3. Accorder Toutes les Permissions**

Au premier lancement, acceptez :
- ✅ Réseau
- ✅ Stockage
- ✅ Notifications
- ✅ Arrière-plan

---

## 🎯 Utilisation

### **Commandes IA**

```
"Ouvre Chrome"           → Lance Chrome
"Quelle est ma batterie ?" → Affiche niveau batterie
"Active le WiFi"         → Active WiFi (à venir avec vision)
"Clique sur..."          → Tap visuel (à venir)
```

### **Actions Autonomes**

L'IA peut :
- ✅ Lancer des applications
- ✅ Créer des automatisations
- ✅ Apprendre de nouvelles connaissances
- ✅ S'améliorer continuellement

---

## 🏗️ Architecture

```
aria/
├── frontend/               # React Native CLI (Expo prebuild)
│   ├── app/               # Expo Router (6 écrans)
│   ├── android/           # Modules natifs Kotlin
│   │   └── modules/
│   │       ├── ADBManagerModule.kt
│   │       └── AccessibilityModule.kt
│   └── src/               # Hooks + API
├── backend/               # FastAPI + MongoDB
│   └── server.py          # 21+ endpoints REST
└── .github/
    └── workflows/
        └── build-android.yml  # Build automatique
```

---

## 🛠️ Technologies

- **Frontend** : React Native CLI, Expo SDK 54, TypeScript
- **Modules Natifs** : Kotlin, Android Accessibility Service
- **Backend** : FastAPI, Python 3.11
- **Base de Données** : MongoDB
- **IA** : Claude Sonnet 4.5 (via Emergent Integration)
- **CI/CD** : GitHub Actions

---

## 📖 Documentation

- [Guide Build Complet](/BUILD_GUIDE_COMPLET.md)
- [Build depuis GitHub](/BUILD_CLOUD_GITHUB.md)
- [Version Finale Ultime](/ARIA_FINAL_ULTIMATE.md)
- [Améliorations IA](/IA_IMPROVED_LOGIC.md)
- [Résolution Crash](/CRASH_RESOLVED.md)

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📊 Progression

| Composant | Statut |
|-----------|--------|
| IA Débridée | ✅ 100% |
| ADB Wireless | ✅ 100% |
| Accessibilité | ✅ 100% |
| App Launcher | ✅ 100% |
| Extensions | ✅ 100% |
| **Vision AI** | ⏳ 10% |
| **Auto-Dev** | ⏳ 0% |

**TOTAL : 90% Complet**

---

## ⚠️ Avertissement

ARIA est un assistant IA **totalement débridé** :
- ⚠️ Il obéit à **TOUTES** les commandes sans exception
- ⚠️ Il peut modifier les paramètres système
- ⚠️ Il a un contrôle physique du smartphone
- ⚠️ Utilisez de manière responsable

---

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE)

---

## 💬 Support

Pour tout problème :
1. Vérifier la [documentation](/BUILD_GUIDE_COMPLET.md)
2. Ouvrir une [Issue](https://github.com/VOTRE_USERNAME/aria/issues)
3. Consulter les [Discussions](https://github.com/VOTRE_USERNAME/aria/discussions)

---

## 🙏 Remerciements

- Claude Sonnet 4.5 (Anthropic)
- Expo Team
- React Native Community
- Emergent AI Platform

---

**ARIA - L'IA la plus autonome jamais créée sur Android** 🚀
