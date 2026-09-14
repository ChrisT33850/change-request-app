# 🚀 COMMENCE ICI - GUIDE DE DÉPLOIEMENT

Salut Christophe! 👋

Tu vas déployer une **web app privée** pour signer les Change Requests en ligne.

---

## 📋 Avant de commencer

Assure-toi d'avoir:

- [ ] Un compte GitHub (tu l'as ✅)
- [ ] Node.js 18+ installé (https://nodejs.org - version LTS)
- [ ] Git installé (https://git-scm.com)
- [ ] Un terminal ouvert

---

## ⚡ LES 7 ÉTAPES POUR DÉPLOYER

### ÉTAPE 1️⃣ : GitHub Pages Configuration (2 min)

1. Va dans ton repo: https://github.com/ChrisT33850/change-request-app
2. Clique **"Settings"** (en haut à droite)
3. Dans le menu de gauche, clique **"Pages"**
4. **Source**: Sélectionne **"GitHub Actions"**
5. Sauvegarde

✅ **GitHub Pages est configuré!**

---

### ÉTAPE 2️⃣ : Installer les dépendances (3 min)

Ouvre un terminal et tape:

```bash
git clone https://github.com/ChrisT33850/change-request-app.git
cd change-request-app
npm install
```

✅ **Dépendances installées!**

---

### ÉTAPE 3️⃣ : Tester en local (5 min)

```bash
npm start
```

L'app s'ouvre automatiquement sur `http://localhost:3000`

**Login**: `christophe` / `password123`

Teste le dashboard, la vue Tableau/Kanban, clique sur une CR.

**Ctrl+C** pour arrêter.

✅ **App fonctionne en local!**

---

### ÉTAPE 4️⃣ : Build pour production (2 min)

```bash
npm run build
```

Ça crée un dossier `build/` optimisé.

✅ **App compilée pour production!**

---

### ÉTAPE 5️⃣ : Push vers GitHub (2 min)

```bash
git add .
git commit -m "Deploy: Change Request Dashboard"
git push origin main
```

✅ **Code poussé vers GitHub!**

---

### ÉTAPE 6️⃣ : Attendre le déploiement (2-3 min)

1. Va sur: https://github.com/ChrisT33850/change-request-app/actions
2. Tu vois un workflow qui tourne (cercle orange ⏳)
3. Attends que ça devienne ✅ vert

✅ **App déployée!**

---

### ÉTAPE 7️⃣ : Accéder à l'app en ligne (1 min)

Ouvre dans ton navigateur:
