# 🔧 FIX ERREUR EAS BUILD - SOLUTION COMPLÈTE

## ❌ **Erreur Rencontrée**

```
Failed to resolve plugin for module "expo-router" relative to "/workspaces/final1/frontend"
Error: build command failed.
```

## ✅ **SOLUTION : Installer les Dépendances AVANT**

### **Le Problème**
EAS Build a besoin que `node_modules` soit correctement installé pour lire la config.

---

## 🚀 **COMMANDES CORRIGÉES**

### **Dans GitHub Codespaces :**

```bash
# 1. Naviguer vers frontend
cd frontend

# 2. INSTALLER LES DÉPENDANCES D'ABORD (CRUCIAL)
npm install
# Ou si vous utilisez yarn:
yarn install

# 3. Vérifier que expo-router est installé
ls node_modules/expo-router
# Doit afficher des fichiers, pas d'erreur

# 4. Installer EAS CLI
npm install -g eas-cli

# 5. Login Expo
eas login

# 6. MAINTENANT builder
eas build --platform android --profile preview
```

---

### **Dans Termux Android :**

```bash
# 1. Installation base
pkg install nodejs-lts git -y
termux-setup-storage

# 2. Clone
cd ~/storage/downloads
git clone https://github.com/Sdellera68/emergent.git
cd emergent/frontend

# 3. INSTALLER DÉPENDANCES (CRUCIAL)
npm install
# Attendre 2-3 minutes

# 4. Vérifier
ls node_modules/expo-router

# 5. EAS CLI
npm install -g eas-cli

# 6. Login
eas login

# 7. Build
eas build --platform android --profile preview
```

---

### **Sur PC/Mac/Linux :**

```bash
# 1. Clone
git clone https://github.com/Sdellera68/emergent.git
cd emergent/frontend

# 2. INSTALLER DÉPENDANCES
npm install

# 3. EAS
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## 🔧 **Si l'Erreur Persiste**

### **Option 1 : Nettoyer et Réinstaller**

```bash
cd frontend

# Supprimer node_modules et lock files
rm -rf node_modules package-lock.json yarn.lock

# Réinstaller proprement
npm install

# Retry build
eas build --platform android --profile preview
```

### **Option 2 : Utiliser npx (Sans Install)**

```bash
cd frontend
npm install
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

### **Option 3 : Mettre à Jour EAS**

```bash
npm uninstall -g eas-cli
npm install -g eas-cli@latest
eas build --platform android --profile preview
```

---

## 📋 **Checklist Avant Build**

- [ ] Être dans le dossier `frontend/`
- [ ] `npm install` exécuté avec succès
- [ ] `node_modules/expo-router` existe
- [ ] `eas-cli` installé globalement
- [ ] `eas login` fait
- [ ] Connexion internet stable

---

## 🎯 **Commande Complète (Copy-Paste)**

**Depuis Codespaces :**
```bash
cd frontend && \
npm install && \
npm install -g eas-cli && \
eas login && \
eas build --platform android --profile preview
```

**Depuis Termux :**
```bash
pkg install nodejs-lts git -y && \
cd ~/storage/downloads && \
git clone https://github.com/Sdellera68/emergent.git && \
cd emergent/frontend && \
npm install && \
npm install -g eas-cli && \
eas login && \
eas build --platform android --profile preview
```

---

## ⚠️ **Notes Importantes**

1. **TOUJOURS faire `npm install` avant `eas build`**
2. **Attendre** que l'installation soit complète (2-5 min)
3. **Vérifier** que `node_modules/` existe
4. **Être patient** : EAS build prend 15-20 minutes

---

## 🐛 **Si Nouvelle Erreur**

Partagez le message d'erreur complet :
```bash
# Lancer build avec logs verbeux
eas build --platform android --profile preview --no-wait

# Copier TOUTE la sortie
# Et me la partager
```

---

## ✅ **Résumé**

**Erreur** : `expo-router` pas trouvé  
**Cause** : `node_modules` pas installé  
**Solution** : `npm install` AVANT `eas build`  

**Ordre correct** :
1. ✅ `cd frontend`
2. ✅ `npm install` (CRUCIAL)
3. ✅ `npm install -g eas-cli`
4. ✅ `eas login`
5. ✅ `eas build --platform android --profile preview`

**Réessayez maintenant ! 🚀**
