import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Settings, Camera, Heart, MessageCircle, Upload } from 'lucide-react';

const App = () => {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notionConfig, setNotionConfig] = useState({
    connected: false,
    apiKey: '',
    databaseId: ''
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);
  const [profile, setProfile] = useState({
    username: 'mon_compte',
    fullName: 'Mon Nom',
    bio: 'Créateur de contenu 📸\nPartage mes aventures quotidiennes ✨\n🌍 Paris, France',
    profilePhoto: ''
  });

  // Fonction pour déterminer si un fichier est une vidéo
  const isVideoFile = (filename) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
    return videoExtensions.some(ext => filename.toLowerCase().includes(ext));
  };

  // Fonction pour récupérer les posts depuis Notion
  const fetchNotionPosts = async () => {
    if (!notionConfig.apiKey || !notionConfig.databaseId) {
      console.log('Configuration Notion manquante');
      return;
    }

    try {
      setRefreshing(true);
      
      const response = await fetch('https://api.notion.com/v1/databases/' + notionConfig.databaseId + '/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          sorts: [
            {
              property: 'Date',
              direction: 'descending'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur Notion: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      const formattedPosts = data.results.map(page => {
        const properties = page.properties;
        
        // Récupérer les fichiers depuis la propriété "Contenu"
        const files = properties.Contenu?.files || [];
        const urls = files.map(file => {
          // Les fichiers Notion ont soit file.file.url soit file.external.url
          return file.file?.url || file.external?.url || '';
        }).filter(url => url);

        // Déterminer automatiquement le type basé sur les fichiers
        let autoType = 'image';
        if (files.length > 1) {
          autoType = 'carrousel';
        } else if (files.length === 1 && files[0].name && isVideoFile(files[0].name)) {
          autoType = 'video';
        }

        // Utiliser le type manuel s'il existe, sinon le type auto-détecté
        const manualType = properties.Type?.select?.name?.toLowerCase();
        const finalType = manualType || autoType;
        
        return {
          id: page.id,
          date: properties.Date?.date?.start || new Date().toISOString().split('T')[0],
          type: finalType,
          urls: urls.length > 0 ? urls : ['https://picsum.photos/1080/1350?random=' + Math.floor(Math.random() * 100)],
          caption: properties.Caption?.rich_text?.[0]?.text?.content || '',
          title: properties.Titre?.title?.[0]?.text?.content || 'Post sans titre',
          fileNames: files.map(file => file.name || 'Fichier sans nom')
        };
      });

      setPosts(formattedPosts);
      console.log(`${formattedPosts.length} posts récupérés depuis Notion`);
      
      // Afficher les détails des posts pour debug
      formattedPosts.forEach(post => {
        console.log(`Post "${post.title}": ${post.urls.length} fichier(s), Type: ${post.type}`);
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des posts:', error);
      alert(`Erreur de connexion à Notion: ${error.message}\n\nVérifiez:\n- Votre clé API\n- L'ID de la base\n- Que l'intégration a accès à la base`);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Fonction pour sauvegarder la configuration
  const saveNotionConfig = () => {
    try {
      // Validation basique
      if (!notionConfig.apiKey || !notionConfig.databaseId) {
        alert('Veuillez remplir tous les champs de configuration');
        return;
      }

      if (!notionConfig.apiKey.startsWith('secret_')) {
        alert('La clé API doit commencer par "secret_"');
        return;
      }

      if (notionConfig.databaseId.length !== 32) {
        alert('L\'ID de base de données doit faire 32 caractères');
        return;
      }

      localStorage.setItem('notion-config', JSON.stringify(notionConfig));
      localStorage.setItem('instagram-widget-profile', JSON.stringify(profile));
      setEditingConfig(false);
      setNotionConfig(prev => ({ ...prev, connected: true }));
      
      // Récupérer les posts après configuration
      fetchNotionPosts();
      
      console.log('Configuration sauvegardée et connexion établie');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la configuration');
    }
  };

  // Charger la configuration au démarrage
  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('notion-config');
      const savedProfile = localStorage.getItem('instagram-widget-profile');
      
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setNotionConfig({ ...config, connected: !!(config.apiKey && config.databaseId) });
      }
      
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Récupérer les posts quand la config est prête
  useEffect(() => {
    if (notionConfig.connected && notionConfig.apiKey && notionConfig.databaseId) {
      fetchNotionPosts();
    } else {
      setLoading(false);
    }
  }, [notionConfig.connected]);

  const MediaDisplay = ({ post }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageError, setImageError] = useState(false);

    // Gestion d'erreur d'image
    const handleImageError = () => {
      setImageError(true);
    };

    if (post.type === 'video' || post.type === 'vidéo') {
      return (
        <div className="relative w-full h-full">
          {imageError ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Vidéo non disponible</p>
              </div>
            </div>
          ) : (
            <>
              <video 
                className="w-full h-full object-cover"
                poster={post.urls[0]}
                muted
                loop
                onMouseEnter={(e) => e.target.play().catch(() => {})}
                onMouseLeave={(e) => e.target.pause()}
                onError={handleImageError}
              >
                <source src={post.urls[0]} type="video/mp4" />
              </video>
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded flex items-center">
                <svg className="w-3 h-3" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </>
          )}
        </div>
      );
    }

    if (post.type === 'carousel' || post.type === 'carrousel') {
      return (
        <div className="relative w-full h-full">
          {imageError ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Images non disponibles</p>
              </div>
            </div>
          ) : (
            <>
              <img 
                src={post.urls[currentIndex]} 
                alt="Post"
                className="w-full h-full object-cover"
                style={{ aspectRatio: '1080/1350' }}
                onError={handleImageError}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded flex items-center">
                <svg className="w-3 h-3" fill="white" viewBox="0 0 24 24">
                  <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11.5-6L8 13h12l-3.5-5-2.5 3.01L10.5 10z"/>
                  <path d="M2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
                </svg>
              </div>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {post.urls.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full cursor-pointer ${
                      idx === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>

              {post.urls.length > 1 && (
                <>
                  {currentIndex > 0 && (
                    <button 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(prev => prev - 1);
                      }}
                    >
                      ‹
                    </button>
                  )}
                  {currentIndex < post.urls.length - 1 && (
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(prev => prev + 1);
                      }}
                    >
                      ›
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {imageError ? (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Image non disponible</p>
            </div>
          </div>
        ) : (
          <img 
            src={post.urls[0]} 
            alt="Post"
            className="w-full h-full object-cover"
            style={{ aspectRatio: '1080/1350' }}
            onError={handleImageError}
          />
        )}
      </div>
    );
  };

  const saveProfile = () => {
    try {
      localStorage.setItem('instagram-widget-profile', JSON.stringify(profile));
      setEditingProfile(false);
      console.log('Profil sauvegardé');
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
    }
  };

  const handleDragStart = (e, post) => {
    setDraggedItem(post);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetPost) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetPost.id) return;

    const draggedDate = draggedItem.date;
    const targetDate = targetPost.date;

    setPosts(prev => prev.map(p => {
      if (p.id === draggedItem.id) return { ...p, date: targetDate };
      if (p.id === targetPost.id) return { ...p, date: draggedDate };
      return p;
    }));

    setDraggedItem(null);
    
    console.log(`Post "${draggedItem.title}" déplacé du ${draggedDate} au ${targetDate}`);
  };

  const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white border border-gray-200 shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Camera className="w-6 h-6" />
          <h1 className="text-xl font-semibold">{profile.username}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchNotionPosts}
            disabled={refreshing || !notionConfig.connected}
            className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Sync...' : 'Actualiser'}</span>
          </button>
          
          <button
            onClick={() => setEditingConfig(true)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${
              notionConfig.connected 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            <Settings size={14} />
            {notionConfig.connected && <span className="text-xs">✓</span>}
          </button>
        </div>
      </div>

      {/* Configuration Notion */}
      {editingConfig && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Configuration Notion
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              <p><strong>📋 Colonnes requises dans votre base :</strong></p>
              <ul className="list-disc list-inside mt-1 text-xs">
                <li><strong>Contenu</strong> (Files & media) - Glissez vos images/vidéos</li>
                <li><strong>Date</strong> (Date) - Date de publication</li>
                <li><strong>Type</strong> (Select) - Image/Carrousel/Vidéo</li>
                <li><strong>Caption</strong> (Text) - Description</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                🔑 Clé API Notion
              </label>
              <input
                type="password"
                value={notionConfig.apiKey}
                onChange={(e) => setNotionConfig({...notionConfig, apiKey: e.target.value})}
                className="text-sm w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                placeholder="secret_xxx..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Créée sur notion.so/my-integrations
              </p>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                🗂️ ID de la base de données
              </label>
              <input
                type="text"
                value={notionConfig.databaseId}
                onChange={(e) => setNotionConfig({...notionConfig, databaseId: e.target.value})}
                className="text-sm w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                placeholder="abc123def456..."
              />
              <p className="text-xs text-gray-400 mt-1">
                32 caractères dans l'URL de votre base
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={saveNotionConfig}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 flex items-center"
              >
                <Upload className="w-4 h-4 mr-1" />
                Connecter
              </button>
              <button
                onClick={() => setEditingConfig(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profil */}
      <div className="p-4">
        <div className="flex items-start space-x-4 mb-4">
          <div 
            onClick={() => setEditingProfile(true)}
            className="relative cursor-pointer group"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                {profile.profilePhoto ? (
                  <img 
                    src={profile.profilePhoto} 
                    alt="Photo de profil"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-all">
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex-1">
            {editingProfile ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({...profile, username: e.target.value})}
                  className="font-semibold text-lg border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                  placeholder="nom_dutilisateur"
                />
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                  className="text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                  placeholder="Nom complet"
                />
              </div>
            ) : (
              <div onClick={() => setEditingProfile(true)} className="cursor-pointer">
                <h1 className="font-semibold text-lg hover:text-blue-500">{profile.username}</h1>
                <h2 className="text-gray-600 hover:text-blue-500">{profile.fullName}</h2>
              </div>
            )}
            <div className="flex space-x-8 mt-2">
              <div className="text-center">
                <div className="font-semibold">{posts.length}</div>
                <div className="text-xs text-gray-600">publications</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">1,234</div>
                <div className="text-xs text-gray-600">abonnés</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">567</div>
                <div className="text-xs text-gray-600">suivi(e)s</div>
              </div>
            </div>
          </div>
        </div>
        
        {editingProfile ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Photo de profil (URL)</label>
              <input
                type="url"
                value={profile.profilePhoto}
                onChange={(e) => setProfile({...profile, profilePhoto: e.target.value})}
                className="text-sm w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                placeholder="https://exemple.com/ma-photo.jpg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="text-sm w-full p-2 border border-gray-300 rounded resize-none focus:border-blue-500 outline-none"
                rows="3"
                placeholder="Votre bio..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={saveProfile}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setEditingProfile(true)}
            className="text-sm cursor-pointer hover:text-blue-500 whitespace-pre-line"
          >
            {profile.bio}
          </div>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <div className="flex-1 text-center py-3 border-b-2 border-black">
            <div className="w-6 h-6 mx-auto">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm0 8h6v6H3v-6zm0 8h6v6H3v-6zm8-16h6v6h-6V3zm0 8h6v6h-6v-6zm0 8h6v6h-6v-6zm8-16h6v6h-6V3zm0 8h6v6h-6v-6zm0 8h6v6h-6v-6z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Message de statut */}
      {!notionConfig.connected && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 m-4">
          <div className="flex items-center">
            <Settings className="h-4 w-4 text-amber-400 mr-2" />
            <div>
              <p className="text-amber-700 text-sm font-medium">
                📁 Glissez-déposez vos fichiers directement dans Notion !
              </p>
              <p className="text-amber-600 text-xs">
                Cliquez sur ⚙️ pour connecter votre base avec la colonne "Contenu" (Files & media)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grille 3x4 */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {Array.from({ length: 12 }, (_, index) => {
          const post = sortedPosts[index];
          
          if (!post) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-[4/5] bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-gray-400 text-xs">Ajoutez des fichiers dans Notion</span>
                </div>
              </div>
            );
          }
          
          return (
            <div
              key={post.id}
              draggable
              onDragStart={(e) => handleDragStart(e, post)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, post)}
              className="aspect-[4/5] bg-white cursor-move relative group"
            >
              <MediaDisplay post={post} />
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-5 h-5" fill="white" />
                      <span className="font-semibold">142</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-5 h-5" fill="white" />
                      <span className="font-semibold">8</span>
                    </div>
                  </div>
                  <div className="text-xs mb-1">
                    {new Date(post.date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="text-xs text-gray-200">
                    {post.fileNames?.[0] || post.title}
                  </div>
                  {post.caption && (
                    <div className="text-xs mt-1 px-2 line-clamp-2">
                      {post.caption}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-gray-50 text-center text-xs text-gray-600">
        <p>
          {notionConfig.connected 
            ? `✅ Connecté à Notion • ${posts.length} post(s) synchronisé(s)` 
            : '📁 Glissez vos fichiers dans Notion → Connectez ici → Synchronisez !'
          }
        </p>
      </div>
    </div>
  );
};

export default App;
