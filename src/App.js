import React, { useState, useEffect } from 'react';
import { Camera, Settings, RefreshCw, Edit3, X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

// Configuration de l'API - Votre domaine Vercel
const API_BASE = 'https://instagram-widget-claude.vercel.app/api';

// Composant pour afficher les médias avec modal
const MediaDisplay = ({ urls, type, title, caption, onOpenModal }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!urls || urls.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <Camera className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  const isVideo = (url) => {
    return url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));
  };

  const currentUrl = urls[currentIndex];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  return (
    <div 
      className="relative w-full h-full group cursor-pointer"
      onClick={() => onOpenModal && onOpenModal({ urls, type, title, caption, startIndex: currentIndex })}
    >
      {isVideo(currentUrl) ? (
        <div className="relative w-full h-full">
          <video
            src={currentUrl}
            className="w-full h-full object-cover"
            style={{ aspectRatio: '1080/1350', objectFit: 'cover', width: '100%', height: '100%' }}
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-3">
              <Play className="w-8 h-8 text-white" fill="currentColor" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={currentUrl}
          alt={title}
          className="w-full h-full object-cover"
          style={{ 
            aspectRatio: '1080/1350', 
            objectFit: 'cover', 
            width: '100%', 
            height: '100%',
            minHeight: '100%',
            minWidth: '100%'
          }}
          loading="lazy"
        />
      )}

      {/* Icônes Instagram authentiques en haut à droite */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {type === 'Carrousel' && urls.length > 1 && (
          <div className="bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded-full text-xs flex items-center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 7.5h4v9H3v-9zm5 0h4v9H8v-9zm5 0h4v9h-4v-9z"/>
            </svg>
          </div>
        )}
        {type === 'Vidéo' && (
          <div className="bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded-full text-xs flex items-center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Navigation carrousel améliorée - Toujours visible pour carrousels */}
      {type === 'Carrousel' && urls.length > 1 && (
        <>
          {/* Flèches de navigation - Visibles par défaut, plus visibles au hover */}
          <button
            onClick={prevImage}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 group-hover:bg-opacity-70 text-white rounded-full p-1.5 transition-all z-20 shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 group-hover:bg-opacity-70 text-white rounded-full p-1.5 transition-all z-20 shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Points de navigation en bas - Toujours visibles */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {urls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white scale-110' 
                    : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                }`}
              />
            ))}
          </div>
          
          {/* Indicateur de page actuelle en haut */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-0.5 rounded-full text-xs">
            {currentIndex + 1}/{urls.length}
          </div>
        </>
      )}

      {/* Caption au hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end p-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm">
          <p className="font-medium truncate">{title}</p>
          {caption && <p className="text-xs mt-1 line-clamp-2">{caption}</p>}
        </div>
      </div>
    </div>
  );
};

// Modal pour afficher le détail des posts
const PostModal = ({ post, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (post) {
      setCurrentIndex(post.startIndex || 0);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const { urls, type, title, caption } = post;

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const isVideo = (url) => {
    return url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));
  };

  const currentUrl = urls[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div className="relative">
          {isVideo(currentUrl) ? (
            <video
              src={currentUrl}
              className="w-full max-h-[60vh] object-contain"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={currentUrl}
              alt={title}
              className="w-full max-h-[60vh] object-contain"
              style={{ aspectRatio: '1080/1350' }}
            />
          )}

          {/* Navigation carrousel */}
          {urls.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer avec caption */}
        {caption && (
          <div className="p-4 border-t">
            <p className="text-sm text-gray-700">{caption}</p>
            {urls.length > 1 && (
              <div className="flex justify-center mt-3 space-x-1">
                {urls.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full cursor-pointer ${
                      index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal
function InstagramNotionWidget() {
  // États du widget
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalPost, setModalPost] = useState(null);
  const [draggedPost, setDraggedPost] = useState(null);

  // Configuration Notion
  const [notionConfig, setNotionConfig] = useState({
    apiKey: '',
    databaseId: ''
  });

  // Configuration du profil
  const [profile, setProfile] = useState({
    username: 'votre_compte',
    fullName: 'Votre Nom',
    bio: '🚀 Entrepreneur Digital\n📸 Créateur de contenu\n🌟 Mentor business',
    profilePhoto: '',
    stats: {
      posts: '', // Vide = auto-calculé
      followers: '1,234',
      following: '567'
    }
  });

  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  // Données mockées pour la démonstration - TOUTES au format 1080x1350
  const mockPosts = [
    {
      id: '1',
      title: 'Café matinal',
      date: '2024-09-20',
      urls: ['https://picsum.photos/1080/1350?random=10'],
      type: 'Image',
      caption: '☕ Perfect start to the day!',
      status: 'Programmé'
    },
    {
      id: '2',
      title: 'Mes vacances',
      date: '2024-09-19',
      urls: [
        'https://picsum.photos/1080/1350?random=11',
        'https://picsum.photos/1080/1350?random=12',
        'https://picsum.photos/1080/1350?random=13'
      ],
      type: 'Carrousel',
      caption: '🏖️ Souvenirs inoubliables de mes vacances',
      status: 'Brouillon'
    },
    {
      id: '3',
      title: 'Mon dernier reel',
      date: '2024-09-18',
      urls: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'],
      type: 'Vidéo',
      caption: '🎬 Nouveau contenu disponible !',
      status: 'À publier'
    },
    {
      id: '4',
      title: 'Sunset vibes',
      date: '2024-09-17',
      urls: ['https://picsum.photos/1080/1350?random=14'],
      type: 'Image',
      caption: '🌅 Golden hour magic',
      status: 'Programmé'
    },
    {
      id: '5',
      title: 'Collection mode',
      date: '2024-09-16',
      urls: [
        'https://picsum.photos/1080/1350?random=15',
        'https://picsum.photos/1080/1350?random=16'
      ],
      type: 'Carrousel',
      caption: '👗 Nouvelle collection automne',
      status: 'Brouillon'
    },
    {
      id: '6',
      title: 'Nature walk',
      date: '2024-09-15',
      urls: ['https://picsum.photos/1080/1350?random=17'],
      type: 'Image',
      caption: '🌿 Reconnexion avec la nature',
      status: 'À publier'
    }
  ].filter(post => post.status.toLowerCase() !== 'posté' && post.status.toLowerCase() !== 'posted');

  // Charger la configuration depuis localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('notionConfig');
    const savedProfile = localStorage.getItem('instagramProfile');
    
    if (savedConfig) {
      setNotionConfig(JSON.parse(savedConfig));
    }
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setTempProfile(JSON.parse(savedProfile));
    }

    // Test de l'API au chargement
    testApiEndpoint();
  }, []);

  // Test de connectivité de l'API
  const testApiEndpoint = async () => {
    try {
      const response = await fetch(`${API_BASE}/notion`);
      const data = await response.json();
      console.log('API Test Response:', response.status, data.error === "Method not allowed");
    } catch (error) {
      console.log('API Test Failed:', error.message);
    }
  };

  // Sauvegarder la configuration Notion
  const saveNotionConfig = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validation du format de clé API
      if (!notionConfig.apiKey.startsWith('ntn_') && !notionConfig.apiKey.startsWith('secret_')) {
        setError('❌ Format de clé API invalide. Utilisez le nouveau format "ntn_..." depuis notion.so/my-integrations');
        setIsLoading(false);
        return;
      }

      // Test de connexion avec Notion
      const response = await fetch(`${API_BASE}/notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          apiKey: notionConfig.apiKey,
          databaseId: notionConfig.databaseId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus('connected');
        localStorage.setItem('notionConfig', JSON.stringify(notionConfig));
        setShowSettings(false);
        
        // Message de succès avec format d'API détecté
        setError(`✅ Connecté avec succès ! Format API: ${data.apiFormat || 'détecté'}`);
        
        // Charger les posts automatiquement
        await loadPostsFromNotion();
      } else {
        setConnectionStatus('error');
        setError(data.error || 'Erreur de connexion');
      }
    } catch (error) {
      setConnectionStatus('error');
      if (error.message.includes('fetch')) {
        setError('❌ Erreur de réseau - Vérifiez votre connexion et que l\'API est déployée');
      } else {
        setError(`❌ Erreur: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les posts depuis Notion
  const loadPostsFromNotion = async () => {
    if (!notionConfig.apiKey || !notionConfig.databaseId) {
      setPosts(mockPosts);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getPosts',
          apiKey: notionConfig.apiKey,
          databaseId: notionConfig.databaseId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPosts(data.posts || []);
        setConnectionStatus('connected');
        // Message simplifié selon la demande
        const totalPosts = data.posts?.length || 0;
        const totalRows = data.debug?.totalRows || totalPosts;
        const statusFilter = data.debug?.filterInfo?.statusFiltering === 'Active' ? ' (hors "Posté")' : '';
        setError(`✅ Connecté à Notion • ${totalPosts}/${totalRows} post(s)${statusFilter}`);
      } else {
        setError(data.error || 'Erreur lors du chargement des posts');
        setPosts(mockPosts); // Fallback vers les données mockées
      }
    } catch (error) {
      setError(`Erreur de chargement: ${error.message}`);
      setPosts(mockPosts); // Fallback vers les données mockées
    }
  };

  // Actualiser les posts
  const refreshPosts = async () => {
    setIsRefreshing(true);
    await loadPostsFromNotion();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Mettre à jour la date d'un post dans Notion lors du drag & drop
  const updatePostDate = async (postId, newDate) => {
    if (!notionConfig.apiKey || !notionConfig.databaseId) return;

    try {
      await fetch(`${API_BASE}/notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDate',
          apiKey: notionConfig.apiKey,
          postId: postId,
          newDate: newDate
        })
      });
    } catch (error) {
      console.error('Erreur mise à jour date:', error);
    }
  };

  // Gestion du profil
  const enterEditMode = () => {
    setEditMode(true);
    setTempProfile({ ...profile });
  };

  const saveProfile = () => {
    setProfile(tempProfile);
    localStorage.setItem('instagramProfile', JSON.stringify(tempProfile));
    setEditMode(false);
  };

  const cancelEdit = () => {
    setTempProfile({ ...profile });
    setEditMode(false);
  };

  // Statistiques calculées
  const getDisplayStats = () => {
    const postsCount = profile.stats.posts || posts.length.toString();
    return {
      posts: postsCount,
      followers: profile.stats.followers,
      following: profile.stats.following
    };
  };

  // Fonction pour éditer directement une statistique
  const editStat = (statName) => {
    enterEditMode();
    // Auto-focus sur la section des statistiques
    setTimeout(() => {
      const statInput = document.querySelector(`input[name="stats.${statName}"]`);
      if (statInput) statInput.focus();
    }, 100);
  };

  // Drag & Drop avec mise à jour Notion
  const handleDragStart = (e, post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    
    if (!draggedPost) return;

    const newPosts = [...posts];
    const draggedIndex = newPosts.findIndex(p => p.id === draggedPost.id);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    // Réorganiser les posts
    const [draggedItem] = newPosts.splice(draggedIndex, 1);
    newPosts.splice(targetIndex, 0, draggedItem);

    // Calculer la nouvelle date basée sur la position
    const targetPost = posts[targetIndex];
    let newDate;
    
    if (targetPost) {
      // Utiliser la date du post de destination
      newDate = targetPost.date;
    } else {
      // Si pas de post cible, utiliser la date d'aujourd'hui
      newDate = new Date().toISOString().split('T')[0];
    }

    // Mettre à jour localement
    draggedItem.date = newDate;
    setPosts(newPosts);

    // Mettre à jour dans Notion
    await updatePostDate(draggedItem.id, newDate);
    
    setDraggedPost(null);
  };

  // Ouvrir modal
  const openModal = (post) => {
    setModalPost(post);
  };

  const closeModal = () => {
    setModalPost(null);
  };

  // Redimensionner les images pour forcer le format 1080x1350
  const getResizedImageUrl = (originalUrl) => {
    // Si c'est une URL Picsum, on peut forcer la taille
    if (originalUrl.includes('picsum.photos')) {
      return originalUrl.replace(/\/\d+\/\d+/, '/1080/1350');
    }
    // Pour toutes les autres URLs, on ajoute des paramètres de redimensionnement si possible
    if (originalUrl.includes('unsplash.com')) {
      return `${originalUrl}?w=1080&h=1350&fit=crop`;
    }
    // Pour les URLs génériques, on garde l'originale mais on force le ratio en CSS
    return originalUrl;
  };

  // Grille de posts (3x4 = 12 positions fixes)
  const gridPosts = Array(12).fill(null);
  posts.slice(0, 12).forEach((post, index) => {
    // Redimensionner les URLs d'images
    const resizedPost = {
      ...post,
      urls: post.urls?.map(getResizedImageUrl) || []
    };
    gridPosts[index] = resizedPost;
  });

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 font-sans relative">
      {/* Filigrane Freelance Créatif */}
      <div className="absolute top-2 left-2 z-10">
        <a 
          href="https://www.instagram.com/freelance.creatif/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors bg-white bg-opacity-80 px-2 py-1 rounded backdrop-blur-sm"
        >
          Créé par @Freelancecreatif
        </a>
      </div>

      {/* Header Instagram */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Camera className="w-6 h-6" />
          <span className="font-bold text-lg">Instagram</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshPosts}
            className={`p-2 rounded-full hover:bg-gray-100 ${isRefreshing ? 'animate-spin' : ''}`}
            title="Actualiser le feed"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Configuration"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Configuration Notion */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold mb-3">⚙️ Configuration Notion</h3>
          
          {/* Aide pour le nouveau format */}
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-medium text-blue-800">📢 Nouveau format API Notion (Sept 2024)</p>
            <p className="text-blue-600 mt-1">Les clés commencent maintenant par <code className="bg-blue-100 px-1 rounded">ntn_</code> au lieu de <code className="bg-blue-100 px-1 rounded">secret_</code></p>
            <p className="text-blue-600 mt-1">📍 Récupérez votre clé sur: <strong>notion.so/my-integrations</strong></p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Clé API Notion (ntn_...)
              </label>
              <input
                type="password"
                value={notionConfig.apiKey}
                onChange={(e) => setNotionConfig({...notionConfig, apiKey: e.target.value})}
                placeholder="ntn_abc123def456..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                ID de la base de données
              </label>
              <input
                type="text"
                value={notionConfig.databaseId}
                onChange={(e) => setNotionConfig({...notionConfig, databaseId: e.target.value})}
                placeholder="32 caractères de l'URL de votre base"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={saveNotionConfig}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Connexion...' : 'Connecter'}
            </button>
          </div>
        </div>
      )}

      {/* Statut de connexion / Erreurs */}
      {error && (
        <div className={`p-3 text-sm ${error.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Profil */}
      <div className="p-4 border-b border-gray-200">
        {!editMode ? (
          <>
            {/* Mode Affichage */}
            <div className="flex items-center space-x-4 mb-4">
              <div 
                className="relative group cursor-pointer"
                onClick={enterEditMode}
                title="Cliquer pour modifier"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt="Profil"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  {/* Statistiques cliquables - MAINTENANT EN NOIR */}
                  <div className="flex space-x-6">
                    <div 
                      className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors group"
                      onClick={() => editStat('posts')}
                      title="Cliquez pour modifier"
                    >
                      <div className="font-bold text-gray-900 group-hover:text-black flex items-center">
                        {getDisplayStats().posts}
                        <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm text-gray-600">posts</div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors group"
                      onClick={() => editStat('followers')}
                      title="Cliquez pour modifier"
                    >
                      <div className="font-bold text-gray-900 group-hover:text-black flex items-center">
                        {getDisplayStats().followers}
                        <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm text-gray-600">abonnés</div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors group"
                      onClick={() => editStat('following')}
                      title="Cliquez pour modifier"
                    >
                      <div className="font-bold text-gray-900 group-hover:text-black flex items-center">
                        {getDisplayStats().following}
                        <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm text-gray-600">suivi(e)s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div 
                className="font-bold cursor-pointer hover:text-blue-600 transition-colors"
                onClick={enterEditMode}
                title="Cliquer pour modifier"
              >
                {profile.fullName}
              </div>
              <div 
                className="text-sm cursor-pointer hover:text-blue-600 transition-colors"
                onClick={enterEditMode}
                title="Cliquer pour modifier"
              >
                @{profile.username}
              </div>
              <div 
                className="text-sm whitespace-pre-line cursor-pointer hover:text-blue-600 transition-colors"
                onClick={enterEditMode}
                title="Cliquer pour modifier"
              >
                {profile.bio}
              </div>
              
              {/* Bouton rapide pour modifier les statistiques */}
              <button
                onClick={enterEditMode}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modifier les statistiques</span>
              </button>
              <div className="text-xs text-gray-500">👆 Cliquez sur les chiffres pour les modifier</div>
            </div>
          </>
        ) : (
          <>
            {/* Mode Édition */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">✏️ Modifier le profil</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Photo de profil (URL)</label>
                <input
                  type="url"
                  value={tempProfile.profilePhoto}
                  onChange={(e) => setTempProfile({...tempProfile, profilePhoto: e.target.value})}
                  placeholder="https://exemple.com/photo.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={tempProfile.username}
                  onChange={(e) => setTempProfile({...tempProfile, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom complet</label>
                <input
                  type="text"
                  value={tempProfile.fullName}
                  onChange={(e) => setTempProfile({...tempProfile, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={tempProfile.bio}
                  onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Votre bio Instagram..."
                />
              </div>

              {/* Section statistiques bien visible */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium mb-3 text-blue-800">📊 Statistiques du profil</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-blue-600">Publications</label>
                    <input
                      type="text"
                      name="stats.posts"
                      value={tempProfile.stats.posts}
                      onChange={(e) => setTempProfile({
                        ...tempProfile, 
                        stats: {...tempProfile.stats, posts: e.target.value}
                      })}
                      placeholder="Auto"
                      className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-blue-600">Abonnés</label>
                    <input
                      type="text"
                      name="stats.followers"
                      value={tempProfile.stats.followers}
                      onChange={(e) => setTempProfile({
                        ...tempProfile, 
                        stats: {...tempProfile.stats, followers: e.target.value}
                      })}
                      placeholder="1,234"
                      className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-blue-600">Suivi(e)s</label>
                    <input
                      type="text"
                      name="stats.following"
                      value={tempProfile.stats.following}
                      onChange={(e) => setTempProfile({
                        ...tempProfile, 
                        stats: {...tempProfile.stats, following: e.target.value}
                      })}
                      placeholder="567"
                      className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-blue-100 px-2 py-0.5 rounded">1,234</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">15.2K</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">2.5M</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">10K+</span>
                  </div>
                  <p className="mt-1">Formats supportés: nombres, K, M, + etc.</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={saveProfile}
                  className="flex-1 bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-medium hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200">
        <div className="flex-1 text-center py-3 border-b-2 border-black">
          <div className="w-6 h-6 mx-auto">
            <div className="grid grid-cols-3 gap-0.5 w-full h-full">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-black rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grille de posts 3x4 avec drag & drop amélioré - Format 1080x1350 forcé */}
      <div className="grid grid-cols-3 gap-1">
        {gridPosts.map((post, index) => (
          <div
            key={post?.id || `empty-${index}`}
            className="relative group overflow-hidden bg-gray-100"
            draggable={!!post}
            onDragStart={(e) => post && handleDragStart(e, post)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={handleDragOver}
            style={{ 
              aspectRatio: '1080/1350',
              width: '100%',
              height: 'auto'
            }}
          >
            {post ? (
              <MediaDisplay 
                urls={post.urls} 
                type={post.type} 
                title={post.title}
                caption={post.caption}
                onOpenModal={openModal}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ aspectRatio: '1080/1350' }}>
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal pour afficher les posts en détail */}
      <PostModal 
        post={modalPost}
        isOpen={!!modalPost}
        onClose={closeModal}
      />
    </div>
  );
}

export default InstagramNotionWidget;
