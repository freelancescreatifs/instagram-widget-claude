import React, { useState, useEffect } from 'react';
import { Camera, Settings, Heart, MessageCircle, MoreHorizontal, RefreshCw, Edit3, Users, UserPlus } from 'lucide-react';

// Configuration de l'API - Votre domaine Vercel
const API_BASE = 'https://instagram-widget-claude.vercel.app/api';

// Composant pour afficher les médias (images, carrousels, vidéos)
const MediaDisplay = ({ urls, type, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const currentUrl = urls[currentIndex];

  return (
    <div className="relative w-full h-full group">
      {isVideo(currentUrl) ? (
        <video
          src={currentUrl}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          onMouseEnter={() => setIsVideoPlaying(true)}
          onMouseLeave={() => setIsVideoPlaying(false)}
          autoPlay={isVideoPlaying}
        />
      ) : (
        <img
          src={currentUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Indicateur type de contenu */}
      <div className="absolute top-2 right-2">
        {type === 'Carrousel' && urls.length > 1 && (
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            ⋯
          </div>
        )}
        {type === 'Vidéo' && (
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            ▶️
          </div>
        )}
      </div>

      {/* Navigation carrousel */}
      {type === 'Carrousel' && urls.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ←
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            →
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {urls.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function InstagramNotionWidget() {
  // États du widget
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Données mockées pour la démonstration
  const mockPosts = [
    {
      id: '1',
      title: 'Café matinal',
      date: '2024-09-20',
      urls: ['https://picsum.photos/1080/1350?random=10'],
      type: 'Image',
      caption: '☕ Perfect start to the day!'
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
      caption: '🏖️ Souvenirs inoubliables de mes vacances'
    },
    {
      id: '3',
      title: 'Mon dernier reel',
      date: '2024-09-18',
      urls: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'],
      type: 'Vidéo',
      caption: '🎬 Nouveau contenu disponible !'
    }
  ];

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
        setError(`✅ Connecté à Notion • ${data.posts?.length || 0} post(s) synchronisé(s)`);
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

  // Drag & Drop (simulation - pour la démo)
  const handleDragStart = (e, post) => {
    e.dataTransfer.setData('text/plain', post.id);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    // Simulation de réorganisation
    console.log(`Post ${draggedId} moved to position ${targetIndex}`);
  };

  // Grille de posts (3x4 = 12 positions fixes)
  const gridPosts = Array(12).fill(null);
  posts.slice(0, 12).forEach((post, index) => {
    gridPosts[index] = post;
  });

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 font-sans">
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
                  {/* Statistiques cliquables */}
                  <div className="flex space-x-6">
                    <div 
                      className="text-center cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors group"
                      onClick={() => editStat('posts')}
                      title="Cliquez pour modifier"
                    >
                      <div className="font-bold text-blue-600 group-hover:text-blue-800 flex items-center">
                        {getDisplayStats().posts}
                        <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm text-gray-600">posts</div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors group"
                      onClick={() => editStat('followers')}
                      title="Cliquez pour modifier"
                    >
                      <div className="font-bold text-blue-600 group-hover:text-blue-800 flex items-center">
                        {getDisplayStats().followers}
                        <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm text-gray-600">abonnés</div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors group"
                      onClick={() => editStat('following')}
                      title="Cliquez pour modifier"
                    >
                      <div className="font-bold text-blue-600 group-hover:text-blue-800 flex items-center">
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

      {/* Grille de posts 3x4 */}
      <div className="grid grid-cols-3 gap-1 aspect-square">
        {gridPosts.map((post, index) => (
          <div
            key={post?.id || `empty-${index}`}
            className="aspect-[4/5] bg-gray-100 relative group overflow-hidden"
            draggable={!!post}
            onDragStart={(e) => post && handleDragStart(e, post)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={(e) => e.preventDefault()}
            style={{ aspectRatio: '1080/1350' }}
          >
            {post ? (
              <>
                <MediaDisplay 
                  urls={post.urls} 
                  type={post.type} 
                  title={post.title}
                />
                
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-4 text-white">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-6 h-6" fill="currentColor" />
                      <span className="font-bold">{Math.floor(Math.random() * 1000)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-6 h-6" fill="currentColor" />
                      <span className="font-bold">{Math.floor(Math.random() * 100)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default InstagramNotionWidget;
