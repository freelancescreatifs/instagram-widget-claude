# Widget Instagram pour Notion

Un widget interactif qui permet de planifier et visualiser vos posts Instagram directement dans Notion.

## 🚀 Fonctionnalités

- ✅ Grille Instagram 3x4 authentique (format 1080×1350)
- ✅ Support images, carrousels et vidéos
- ✅ Drag & drop pour réorganiser les posts
- ✅ Profil personnalisable avec photo
- ✅ Bio éditable multilignes
- ✅ Synchronisation avec Notion (API)
- ✅ Design responsive et authentique Instagram
- ✅ Hover effects avec likes/commentaires
- ✅ Sauvegarde automatique des modifications

## 📦 Installation locale

1. Téléchargez tous les fichiers
2. Ouvrez un terminal dans le dossier du projet
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Lancez le serveur de développement :
   ```bash
   npm start
   ```
5. Ouvrez [http://localhost:3000](http://localhost:3000)

## 🌐 Déploiement sur Vercel

1. Pushez le code sur GitHub
2. Connectez votre repo à [Vercel](https://vercel.com)
3. Le déploiement se fait automatiquement
4. Récupérez l'URL de production

## 📋 Utilisation dans Notion

1. Copiez l'URL de votre widget déployé
2. Dans une page Notion, tapez `/embed`
3. Collez l'URL du widget
4. Ajustez la taille (recommandé : 400×800px)

## ⚙️ Configuration Notion (optionnel)

Pour la synchronisation complète avec Notion, créez une base de données avec ces colonnes :

- **Date** (Date) - Date de publication
- **URLs** (Text) - URLs des images/vidéos (séparées par des virgules pour les carrousels)
- **Type** (Select) - Image, Carrousel, ou Vidéo
- **Caption** (Text) - Description du post
- **Profil** (Text) - Nom d'utilisateur, nom complet, bio (optionnel)

## 🎯 Fonctionnalités en développement

- API Notion complète pour synchronisation bidirectionnelle
- Analytics des performances des posts
- Planification automatique
- Templates de posts
- Export calendrier
- Mode collaboration

## 🛠️ Technologies utilisées

- React 18
- Tailwind CSS
- Lucide React (icônes)
- HTML5 Drag & Drop API
- Local Storage pour persistance

## 🚀 Potentiel commercial

Ce widget est parfait pour :
- Créateurs de contenu Instagram
- Agences de marketing digital  
- Community managers
- Entrepreneurs utilisant Notion

**Modèle SaaS suggéré :** 15-29€/mois par utilisateur

## 📞 Support

Pour toute question ou suggestion :
- Créez une issue sur GitHub
- Consultez la documentation Notion
- Testez d'abord en local avant déploiement

---

**Développé avec ❤️ pour la communauté Notion**

*Ce widget respecte les guidelines Instagram et Notion pour une intégration parfaite.*