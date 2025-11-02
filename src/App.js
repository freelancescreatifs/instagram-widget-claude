import React, { useState, useEffect } from 'react';
import { Camera, Settings, RefreshCw, Edit3, X, ChevronLeft, ChevronRight, Play, Plus, ChevronDown, Calendar } from 'lucide-react';

const API_BASE = 'https://instagram-widget-claude.vercel.app/api';

// Génération d'un ID unique pour chaque instance du widget
const generateWidgetId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `widget_${timestamp}_${random}`;
};

// Récupération ou création de l'ID du widget STABLE ET ISOLÉ
const getStableWidgetId = () => {
  try {
    // UTILISER sessionStorage pour l'isolation par iframe/onglet
    // sessionStorage est unique à chaque contexte de navigation
    let widgetId = sessionStorage.getItem('widget_id');
    
    if (widgetId) {
      console.log('✅ Widget existant chargé avec ID:', widgetId);
      return widgetId;
    }
    
    // Pas d'ID en sessionStorage, vérifier si on a un ID "partagé" dans localStorage
    // pour permettre la persistance entre rechargements
    const storedWidgets = JSON.parse(localStorage.getItem('all_widgets') || '[]');
    
    // Générer un nouvel ID unique
    widgetId = generateWidgetId();
    
    // Stocker dans sessionStorage (isolé par iframe)
    sessionStorage.setItem('widget_id', widgetId);
    
    // Enregistrer ce widget dans la liste globale
    if (!storedWidgets.includes(widgetId)) {
      storedWidgets.push(widgetId);
      localStorage.setItem('all_widgets', JSON.stringify(storedWidgets));
    }
    
    console.log('✨ Nouveau widget créé avec ID:', widgetId);
    console.log('📊 Widgets actifs:', storedWidgets.length);
    
    return widgetId;
  } catch (e) {
    console.error('Erreur lors de la récupération du Widget ID:', e);
    // Fallback : utiliser un ID basé uniquement sur le timestamp
    const fallbackId = `widget_fallback_${Date.now()}`;
    try {
      sessionStorage.setItem('widget_id', fallbackId);
    } catch (err) {
      console.error('Impossible de stocker dans sessionStorage:', err);
    }
    return fallbackId;
  }
};

const WIDGET_ID = getStableWidgetId();

// Fonctions utilitaires pour localStorage avec isolation par widget
const getStorageKey = (key) => `${WIDGET_ID}_${key}`;

const getLocalStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(getStorageKey(key));
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error('Erreur lecture localStorage:', e);
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (e) {
    console.error('Erreur écriture localStorage:', e);
  }
};

const detectMediaType = (urls) => {
  if (!urls || urls.length === 0) return 'Image';
  
  const hasVideo = urls.some(url => 
    url.match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) ||
    url.includes('video') ||
    url.includes('.mp4')
  );
  
  if (hasVideo) return 'Vidéo';
  if (urls.length > 1) return 'Carrousel';
  return 'Image';
};

const MediaDisplay = ({ urls, type, caption }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!urls || urls.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500 text-xs">Pas de média</span>
      </div>
    );
  }

  const detectedType = detectMediaType(urls);
  const isVideo = detectedType === 'Vidéo';
  const isCarousel = urls.length > 1;
  const currentUrl = urls[currentIndex];

  return (
    <div className="relative w-full h-full group">
      {currentUrl && currentUrl.match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) ? (
        <video
          src={currentUrl}
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1080/1350' }}
          controls={false}
          muted
          loop
        />
      ) : (
        <img
          src={currentUrl}
          alt="Post"
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1080/1350' }}
          onError={(e) => {
            e.target.src = `https://picsum.photos/1080/1350?random=${Date.now()}`;
          }}
        />
      )}

      {isCarousel && (
        <div className="absolute top-2 right-2 text-white drop-shadow-lg z-10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="6" height="18"/>
            <rect x="9" y="3" width="6" height="18"/>
            <rect x="15" y="3" width="6" height="18"/>
          </svg>
        </div>
      )}
      
      {isVideo && (
        <div className="absolute top-2 right-2 text-white drop-shadow-lg z-10">
          <Play size={16} fill="white" stroke="white" />
        </div>
      )}

      {isCarousel && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(prev => prev > 0 ? prev - 1 : urls.length - 1);
            }}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            style={{ width: '28px', height: '28px' }}
          >
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(prev => prev < urls.length - 1 ? prev + 1 : 0);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            style={{ width: '28px', height: '28px' }}
          >
            <ChevronRight size={16} className="mx-auto" />
          </button>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
            {urls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-60'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ height: '40px' }}>
        <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
          {caption || 'Cliquer pour voir en détail'}
        </div>
      </div>
    </div>
  );
};

const PostModal = ({ post, isOpen, onClose, onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !post) return null;

  const urls = post.urls || [];
  const detectedType = detectMediaType(urls);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl max-h-[90vh] w-full h-full flex items-center justify-center" 
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2"
        >
          <X size={24} />
        </button>

        {onNavigate && (
          <>
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        <div className="flex flex-col items-center max-w-lg">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {urls[currentIndex] && (
              <>
                {urls[currentIndex].match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) ? (
                  <video
                    src={urls[currentIndex]}
                    className="max-w-sm max-h-[60vh] object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={urls[currentIndex]}
                    alt={post.title}
                    className="max-w-sm max-h-[60vh] object-contain"
                  />
                )}

                {urls.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : urls.length - 1)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full p-2"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentIndex(prev => prev < urls.length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full p-2"
                    >
                      <ChevronRight size={20} />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {urls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full ${
                            index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="text-white text-center mt-6 px-4">
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            {post.caption && (
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">{post.caption}</p>
            )}
            <div className="text-xs text-gray-400 space-y-1">
              <p>📅 {post.date && new Date(post.date).toLocaleDateString('fr-FR')}</p>
              <p>📷 {detectedType} {urls.length > 1 && `(${urls.length} médias)`}</p>
              {post.account && <p>👤 {post.account}</p>}
              {post.calendarName && <p>📆 {post.calendarName}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InstagramNotionWidget = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProfileEdit, setIsProfileEdit] = useState(false);
  const [notionApiKey, setNotionApiKey] = useState('');
  
  // Gestion multi-calendriers
  const [calendars, setCalendars] = useState([]);
  const [activeCalendar, setActiveCalendar] = useState('default');
  const [isCalendarManager, setIsCalendarManager] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarDbId, setNewCalendarDbId] = useState('');
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [editCalendarName, setEditCalendarName] = useState('');
  const [editCalendarDbId, setEditCalendarDbId] = useState('');
  
  const [allPosts, setAllPosts] = useState([]); // Tous les posts de tous les calendriers
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState('All');
  const [showAllTab, setShowAllTab] = useState(true);
  const [isAccountManager, setIsAccountManager] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');

  const [profiles, setProfiles] = useState({
    'All': {
      username: 'mon_compte',
      fullName: 'Mon Compte Principal',
      bio: '🚀 Créateur de contenu\n📸 Planning Instagram\n📍 Paris, France',
      profilePhoto: '',
      followers: '1,234',
      following: '567'
    }
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    const savedApiKey = getLocalStorage('notionApiKey', '');
    const savedCalendars = getLocalStorage('calendars', []);
    const savedActiveCalendar = getLocalStorage('activeCalendar', 'default');
    const savedProfiles = getLocalStorage('instagramProfiles', null);
    const savedAccounts = getLocalStorage('instagramAccounts', []);
    const savedShowAllTab = getLocalStorage('showAllTab', true);
    
    // Message de confirmation du chargement
    const isConfigured = savedApiKey && savedCalendars.length > 0;
    
    if (savedApiKey) setNotionApiKey(savedApiKey);
    
    // Charger les calendriers
    if (savedCalendars && savedCalendars.length > 0) {
      setCalendars(savedCalendars);
      setActiveCalendar(savedActiveCalendar);
      
      // Charger les posts de tous les calendriers
      loadAllCalendarsPosts(savedApiKey, savedCalendars);
      
      // Message de confirmation
      setTimeout(() => {
        showNotification(`✅ Widget chargé - ${savedCalendars.length} calendrier(s)`, 'success');
      }, 500);
    } else if (savedApiKey) {
      // API configurée mais pas de calendrier
      setTimeout(() => {
        showNotification('⚙️ Ajoutez un calendrier pour commencer', 'info');
      }, 500);
    }
    
    if (savedProfiles) {
      setProfiles(savedProfiles);
    }
    
    if (savedShowAllTab !== null) {
      setShowAllTab(savedShowAllTab);
    }
    
    if (savedAccounts) {
      setAccounts(savedAccounts);
      if (savedAccounts.length > 0 && activeAccount === 'All') {
        setActiveAccount(savedAccounts[0]);
      }
    }
    
    // Log pour debug
    console.log('📊 Widget Stats:', {
      widgetId: WIDGET_ID,
      calendars: savedCalendars.length,
      accounts: savedAccounts.length,
      configured: isConfigured
    });
  }, []);

  // Charger les posts de tous les calendriers
  const loadAllCalendarsPosts = async (apiKey = notionApiKey, calendarsList = calendars) => {
    if (!apiKey || !calendarsList || calendarsList.length === 0) return;

    setIsRefreshing(true);
    
    try {
      const postsPromises = calendarsList.map(calendar => 
        fetchPostsFromCalendar(apiKey, calendar.databaseId, calendar.name)
      );
      
      const results = await Promise.all(postsPromises);
      const combinedPosts = results.flat();
      
      setAllPosts(combinedPosts);
      
      if (combinedPosts.length > 0) {
        showNotification(`${combinedPosts.length} posts chargés`, 'success');
      }
    } catch (error) {
      console.error('Erreur chargement calendriers:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Fetch posts d'un calendrier spécifique
  const fetchPostsFromCalendar = async (apiKey, databaseId, calendarName) => {
    try {
      const response = await fetch(`${API_BASE}/notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey,
          databaseId: databaseId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Ajouter le nom du calendrier à chaque post
        return data.posts.map(post => ({
          ...post,
          calendarName: calendarName
        }));
      } else {
        console.error('Erreur Notion:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Erreur fetch:', error);
      return [];
    }
  };

  const fetchPosts = async () => {
    setShowRefreshMenu(false);
    await loadAllCalendarsPosts();
  };

  // Calculer une nouvelle date entre deux posts
  const calculateNewDate = (prevPost, nextPost) => {
    const now = new Date();
    
    if (!prevPost && !nextPost) {
      return now.toISOString().split('T')[0];
    }
    
    if (!prevPost) {
      const nextDate = new Date(nextPost.date);
      const newDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
      return newDate.toISOString().split('T')[0];
    }
    
    if (!nextPost) {
      const prevDate = new Date(prevPost.date);
      const newDate = new Date(prevDate.getTime() - 24 * 60 * 60 * 1000);
      return newDate.toISOString().split('T')[0];
    }
    
    const prevTime = new Date(prevPost.date).getTime();
    const nextTime = new Date(nextPost.date).getTime();
    const middleTime = (prevTime + nextTime) / 2;
    
    return new Date(middleTime).toISOString().split('T')[0];
  };

  // Synchroniser la nouvelle date avec Notion
  const syncDateToNotion = async (post, newDate) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    console.log(`🔄 Mise à jour de la date pour ${post.id}: ${newDate}`);

    // Trouver le calendrier du post
    const calendar = calendars.find(cal => cal.name === post.calendarName);
    if (!calendar) {
      showNotification('Calendrier introuvable', 'error');
      setIsSyncing(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: notionApiKey,
          databaseId: calendar.databaseId,
          action: 'updateDate',
          postId: post.id,
          newDate: newDate,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Date mise à jour dans Notion');
        showNotification(`Date mise à jour: ${new Date(newDate).toLocaleDateString('fr-FR')}`, 'success');
        
        setTimeout(() => {
          fetchPosts();
        }, 1000);
      } else {
        console.error('Erreur:', result.error);
        showNotification('Erreur lors de la mise à jour', 'error');
      }
      
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      showNotification('Erreur de connexion', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const connectToNotion = async () => {
    if (!notionApiKey) {
      showNotification('Veuillez saisir la clé API', 'error');
      return;
    }

    if (calendars.length === 0) {
      showNotification('Veuillez ajouter au moins un calendrier', 'error');
      return;
    }

    setLocalStorage('notionApiKey', notionApiKey);
    
    await loadAllCalendarsPosts();
    setIsConfigOpen(false);
  };

  // Fonction pour réinitialiser complètement le widget
  const resetWidget = () => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser ce widget ?\n\nToutes les données seront effacées (API, calendriers, comptes, profils).\n\nVos données Notion ne seront PAS affectées.')) {
      try {
        // Supprimer toutes les clés préfixées de ce widget
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(WIDGET_ID)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Supprimer l'ID du widget de la liste globale
        try {
          const storedWidgets = JSON.parse(localStorage.getItem('all_widgets') || '[]');
          const updatedWidgets = storedWidgets.filter(id => id !== WIDGET_ID);
          localStorage.setItem('all_widgets', JSON.stringify(updatedWidgets));
        } catch (e) {
          console.error('Erreur lors de la mise à jour de la liste des widgets:', e);
        }
        
        showNotification('Widget réinitialisé avec succès', 'success');
        
        // Recharger la page après 1 seconde
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        console.error('Erreur lors de la réinitialisation:', e);
        showNotification('Erreur lors de la réinitialisation', 'error');
      }
    }
  };

  // Fonction pour créer un nouveau widget indépendant
  const createNewWidget = () => {
    if (window.confirm('🆕 Créer un nouveau widget indépendant ?\n\nCela va :\n1. Créer un nouveau widget avec un nouvel ID\n2. Conserver l\'ancien widget intact\n\nPour revenir à l\'ancien widget, vous devrez actualiser cette page.')) {
      try {
        // Supprimer l'ID du sessionStorage pour forcer la création d'un nouveau
        sessionStorage.removeItem('widget_id');
        
        showNotification('Nouveau widget créé ! Rechargement...', 'success');
        
        // Recharger la page après 1 seconde
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        console.error('Erreur lors de la création:', e);
        showNotification('Erreur lors de la création', 'error');
      }
    }
  };

  const getProfile = (account) => {
    if (profiles[account]) {
      return profiles[account];
    }
    return profiles['All'] || {
      username: 'mon_compte',
      fullName: 'Mon Compte',
      bio: '🚀 Créateur de contenu\n📸 Planning Instagram\n📍 Paris, France',
      profilePhoto: '',
      followers: '1,234',
      following: '567'
    };
  };

  const saveProfile = (account, profileData) => {
    const newProfiles = { ...profiles, [account]: profileData };
    setProfiles(newProfiles);
    setLocalStorage('instagramProfiles', newProfiles);
  };

  const hideAllTab = () => {
    setShowAllTab(false);
    setLocalStorage('showAllTab', false);
    if (activeAccount === 'All' && accounts.length > 0) {
      setActiveAccount(accounts[0]);
    }
  };

  // Gestion des calendriers
  const addCalendar = () => {
    if (!newCalendarName.trim() || !newCalendarDbId.trim()) {
      showNotification('Nom et ID requis', 'error');
      return;
    }

    if (calendars.some(cal => cal.name === newCalendarName.trim())) {
      showNotification('Ce calendrier existe déjà', 'error');
      return;
    }

    const newCalendar = {
      id: Date.now().toString(),
      name: newCalendarName.trim(),
      databaseId: newCalendarDbId.trim()
    };
    
    const newCalendars = [...calendars, newCalendar];
    setCalendars(newCalendars);
    setLocalStorage('calendars', newCalendars);
    
    setActiveCalendar(newCalendar.name);
    setLocalStorage('activeCalendar', newCalendar.name);
    
    setNewCalendarName('');
    setNewCalendarDbId('');
    
    showNotification('Calendrier ajouté', 'success');
  };

  const removeCalendar = (calendarToRemove) => {
    const newCalendars = calendars.filter(cal => cal.name !== calendarToRemove);
    setCalendars(newCalendars);
    setLocalStorage('calendars', newCalendars);
    
    // Supprimer les posts de ce calendrier
    const newPosts = allPosts.filter(post => post.calendarName !== calendarToRemove);
    setAllPosts(newPosts);
    
    if (activeCalendar === calendarToRemove) {
      if (newCalendars.length > 0) {
        setActiveCalendar(newCalendars[0].name);
        setLocalStorage('activeCalendar', newCalendars[0].name);
      } else {
        setActiveCalendar('default');
        setLocalStorage('activeCalendar', 'default');
      }
    }
    
    showNotification('Calendrier supprimé', 'success');
  };

  const renameCalendar = (oldName, newName, newDbId) => {
    if (!newName.trim()) {
      setEditingCalendar(null);
      return;
    }

    if (newName !== oldName && calendars.some(cal => cal.name === newName.trim())) {
      showNotification('Ce nom existe déjà', 'error');
      return;
    }

    const trimmedNewName = newName.trim();
    
    const newCalendars = calendars.map(cal => 
      cal.name === oldName 
        ? { ...cal, name: trimmedNewName, databaseId: newDbId.trim() } 
        : cal
    );
    setCalendars(newCalendars);
    setLocalStorage('calendars', newCalendars);
    
    // Mettre à jour les posts
    const newPosts = allPosts.map(post => 
      post.calendarName === oldName 
        ? { ...post, calendarName: trimmedNewName } 
        : post
    );
    setAllPosts(newPosts);
    
    if (activeCalendar === oldName) {
      setActiveCalendar(trimmedNewName);
      setLocalStorage('activeCalendar', trimmedNewName);
    }
    
    setEditingCalendar(null);
    setEditCalendarName('');
    setEditCalendarDbId('');
    showNotification('Calendrier modifié', 'success');
  };

  // Gestion des comptes Instagram
  const addAccount = () => {
    if (!newAccountName.trim() || accounts.includes(newAccountName.trim())) {
      return;
    }

    const newAccount = newAccountName.trim();
    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    
    const newProfile = {
      username: newAccount.toLowerCase().replace(/\s+/g, '_'),
      fullName: newAccount,
      bio: `🚀 ${newAccount}\n📸 Créateur de contenu\n📍 Paris, France`,
      profilePhoto: '',
      followers: '1,234',
      following: '567'
    };
    
    const newProfiles = { ...profiles, [newAccount]: newProfile };
    setProfiles(newProfiles);
    
    setLocalStorage('instagramAccounts', newAccounts);
    setLocalStorage('instagramProfiles', newProfiles);
    
    setActiveAccount(newAccount);
    setNewAccountName('');
    setIsAccountManager(false);
  };

  const removeAccount = (accountToRemove) => {
    const newAccounts = accounts.filter(acc => acc !== accountToRemove);
    setAccounts(newAccounts);
    
    if (activeAccount === accountToRemove) {
      if (newAccounts.length > 0) {
        setActiveAccount(newAccounts[0]);
      } else {
        setActiveAccount('All');
        setShowAllTab(true);
        setLocalStorage('showAllTab', true);
      }
    }
    
    const newProfiles = { ...profiles };
    delete newProfiles[accountToRemove];
    setProfiles(newProfiles);
    
    setLocalStorage('instagramAccounts', newAccounts);
    setLocalStorage('instagramProfiles', newProfiles);
  };

  const removeAllAccounts = () => {
    setAccounts([]);
    setActiveAccount('All');
    
    const newProfiles = { 'All': profiles['All'] || getProfile('All') };
    setProfiles(newProfiles);
    
    setLocalStorage('instagramAccounts', []);
    setLocalStorage('instagramProfiles', newProfiles);
    setIsAccountManager(false);
  };

  const renameAccount = (oldName, newName) => {
    if (!newName.trim() || newName === oldName || accounts.includes(newName.trim())) {
      setEditingAccount(null);
      setEditAccountName('');
      return;
    }

    const trimmedNewName = newName.trim();
    
    const newAccounts = accounts.map(acc => acc === oldName ? trimmedNewName : acc);
    setAccounts(newAccounts);
    
    if (activeAccount === oldName) {
      setActiveAccount(trimmedNewName);
    }
    
    const newProfiles = { ...profiles };
    if (profiles[oldName]) {
      newProfiles[trimmedNewName] = { ...profiles[oldName] };
      delete newProfiles[oldName];
      setProfiles(newProfiles);
    }
    
    setLocalStorage('instagramAccounts', newAccounts);
    setLocalStorage('instagramProfiles', newProfiles);
    
    setEditingAccount(null);
    setEditAccountName('');
  };

  // Filtrer et trier les posts
  const getOrderedFilteredPosts = () => {
    let posts = allPosts;

    // Filtre par calendrier
    if (activeCalendar !== 'all' && activeCalendar !== 'default') {
      posts = posts.filter(post => post.calendarName === activeCalendar);
    }

    // Filtre par compte Instagram
    if (activeAccount !== 'All' && accounts.length > 0) {
      posts = posts.filter(post => post.account === activeAccount);
    }

    // Tri par date (plus récent en premier)
    return posts.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  };

  const filteredPosts = getOrderedFilteredPosts();

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = (e) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const sourcePost = filteredPosts[draggedIndex];
    if (!sourcePost) {
      setDraggedIndex(null);
      return;
    }

    console.log(`🔄 DRAG & DROP: "${sourcePost.title}" de position ${draggedIndex} → ${dropIndex}`);

    // Calculer la nouvelle date basée sur les posts adjacents
    const prevPost = dropIndex > 0 ? filteredPosts[dropIndex - 1] : null;
    const nextPost = dropIndex < filteredPosts.length ? filteredPosts[dropIndex] : null;
    
    const newDate = calculateNewDate(prevPost, nextPost);
    
    console.log(`📅 Nouvelle date calculée: ${newDate}`);
    console.log(`📅 Entre: ${prevPost?.date || 'début'} et ${nextPost?.date || 'fin'}`);

    // Synchroniser avec Notion
    await syncDateToNotion(sourcePost, newDate);

    setDraggedIndex(null);
  };

  const gridItems = Array.from({ length: 60 }, (_, index) => {
    const post = filteredPosts[index];
    return post || null;
  });

  const currentProfile = getProfile(activeAccount);
  const shouldShowTabs = accounts.length > 0;
  const shouldShowAllTab = accounts.length > 1 && showAllTab;
  const shouldShowCalendarTabs = calendars.length > 0;

  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Camera size={24} className="text-gray-800" />
          <span className="font-semibold text-lg text-gray-800">Instagram</span>
        </div>
        <div className="flex items-center space-x-2">
          {(isSyncing || isRefreshing) && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">
                {isSyncing ? 'Sync...' : 'Chargement...'}
              </span>
            </div>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowRefreshMenu(!showRefreshMenu)}
              disabled={isRefreshing || isSyncing}
              className={`flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-full transition-all ${
                (isRefreshing || isSyncing) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Options d'actualisation"
            >
              <RefreshCw 
                size={20} 
                className={`text-gray-700 transition-transform ${
                  (isRefreshing || isSyncing) ? 'animate-spin' : ''
                }`}
              />
              <ChevronDown size={14} className="text-gray-700" />
            </button>

            {showRefreshMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => fetchPosts()}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <RefreshCw size={16} className="text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Actualiser</div>
                    <div className="text-xs text-gray-500">Récupérer nouveaux posts</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Paramètres"
          >
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {showRefreshMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowRefreshMenu(false)}
        />
      )}

      <div className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div 
            className="relative cursor-pointer group"
            onClick={() => setIsProfileEdit(true)}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                {currentProfile.profilePhoto ? (
                  <img
                    src={currentProfile.profilePhoto}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <Camera size={24} className="text-gray-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit3 size={16} className="text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{filteredPosts.length}</div>
                <div className="text-xs text-gray-500">publications</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                onClick={() => setIsProfileEdit(true)}
              >
                <div className="font-semibold text-gray-900">{currentProfile.followers}</div>
                <div className="text-xs text-gray-500">abonnés</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                onClick={() => setIsProfileEdit(true)}
              >
                <div className="font-semibold text-gray-900">{currentProfile.following}</div>
                <div className="text-xs text-gray-500">suivi(e)s</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div 
            className="font-semibold mb-1 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setIsProfileEdit(true)}
          >
            {currentProfile.fullName}
          </div>
          <div className="text-sm whitespace-pre-line text-gray-700">
            {currentProfile.bio}
          </div>
        </div>
      </div>

      {/* Filtre par Calendrier */}
      {shouldShowCalendarTabs && (
        <div className="px-4 mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar size={16} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-600 uppercase">Calendrier</span>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {calendars.length > 1 && (
              <button
                onClick={() => {
                  setActiveCalendar('all');
                  setLocalStorage('activeCalendar', 'all');
                }}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  activeCalendar === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
                <span className="ml-1 text-xs opacity-75">
                  ({allPosts.length})
                </span>
              </button>
            )}

            {calendars.map((calendar) => {
              const calendarPostCount = allPosts.filter(p => p.calendarName === calendar.name).length;
              
              return (
                <button
                  key={calendar.id}
                  onClick={() => {
                    setActiveCalendar(calendar.name);
                    setLocalStorage('activeCalendar', calendar.name);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    activeCalendar === calendar.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {calendar.name}
                  <span className="ml-1 text-xs opacity-75">
                    ({calendarPostCount})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtre par Compte Instagram */}
      {shouldShowTabs && (
        <div className="flex items-center space-x-2 px-4 mb-4 overflow-x-auto">
          {shouldShowAllTab && (
            <button
              onClick={() => setActiveAccount('All')}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                activeAccount === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
              <span className="ml-1 text-xs opacity-75">
                ({getOrderedFilteredPosts().filter(() => activeAccount === 'All').length || filteredPosts.length})
              </span>
            </button>
          )}

          {accounts.map((account) => {
            // Calculer le nombre de posts pour ce compte en tenant compte du calendrier actif
            let accountPosts = allPosts;
            if (activeCalendar !== 'all' && activeCalendar !== 'default') {
              accountPosts = accountPosts.filter(p => p.calendarName === activeCalendar);
            }
            const accountPostCount = accountPosts.filter(p => p.account === account).length;
              
            return (
              <button
                key={account}
                onClick={() => setActiveAccount(account)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  activeAccount === account
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {account}
                <span className="ml-1 text-xs opacity-75">
                  ({accountPostCount})
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-center px-4 mb-4 space-x-2">
        <button
          onClick={() => setIsCalendarManager(true)}
          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-full transition-colors"
          title="Gérer les calendriers"
        >
          <Calendar size={16} />
          <span>{calendars.length === 0 ? 'Ajouter calendriers' : 'Calendriers'}</span>
        </button>
        
        <button
          onClick={() => setIsAccountManager(true)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors"
          title="Gérer les comptes"
        >
          <Plus size={16} />
          <span>{accounts.length === 0 ? 'Ajouter comptes' : 'Comptes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 p-4">
        {gridItems.map((post, index) => (
          <div
            key={post?.id || `empty-${index}`}
            className={`relative bg-gray-100 transition-all duration-200 ${
              dragOverIndex === index 
                ? 'bg-green-200 scale-105 border-2 border-green-500 shadow-lg ring-2 ring-green-300' 
                : draggedIndex === index
                ? 'bg-blue-200 scale-95 opacity-80'
                : 'hover:scale-102'
            }`}
            style={{ aspectRatio: '1080/1350' }}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {post ? (
              <div
                className="w-full h-full select-none rounded-sm overflow-hidden cursor-move transition-all duration-200"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  if (draggedIndex === null) {
                    setSelectedPost(post);
                    setModalOpen(true);
                  }
                }}
              >
                <MediaDisplay urls={post.urls} type={post.type} caption={post.caption} />
                
                {draggedIndex === index && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-25 flex items-center justify-center z-10">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Déplacement...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className={`w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-sm border-2 border-dashed transition-all duration-200 ${
                  dragOverIndex === index 
                    ? 'border-green-400 bg-green-50 text-green-600 scale-105' 
                    : 'border-gray-200'
                }`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="text-center">
                  <div>{dragOverIndex === index ? '📍' : 'Vide'}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Configuration */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Configuration Notion</h3>
              <button onClick={() => setIsConfigOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Clé API Notion
                </label>
                <input
                  type="text"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="ntn_..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-xs">
                <p className="font-medium mb-2">📋 Colonnes Notion requises :</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Couverture</strong> (Files & media) - Vos images/vidéos</li>
                  <li>• <strong>Date</strong> (Date) - Date de publication</li>
                  <li>• <strong>Caption</strong> (Text) - Description</li>
                  <li>• <strong>Compte Instagram</strong> (Select) - Multi-comptes</li>
                </ul>
                <p className="text-blue-700 mt-2 font-medium">
                  ✨ L'ordre est géré automatiquement par les dates !
                </p>
                <p className="text-blue-600 mt-1 text-xs">
                  Déplace un post dans le widget = sa date change automatiquement dans Notion
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg text-xs">
                <p className="font-medium mb-2 text-purple-800">🗓️ Multi-Calendriers</p>
                <p className="text-gray-700">
                  Gérez plusieurs bases Notion ! Ajoutez vos calendriers via le bouton "Gérer les calendriers" ci-dessous.
                </p>
              </div>

              <button
                onClick={connectToNotion}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connecter à Notion
              </button>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs text-gray-500 mb-2">⚙️ Gestion du widget</p>
                
                <button
                  onClick={createNewWidget}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  🆕 Créer un Nouveau Widget
                </button>
                
                <button
                  onClick={resetWidget}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  🔄 Réinitialiser ce Widget
                </button>
                
                <div className="text-xs text-gray-400 mt-3 space-y-1">
                  <p>💡 ID de ce widget :</p>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs block break-all">
                    {WIDGET_ID}
                  </code>
                  
                  <p className="mt-2 pt-2 border-t">
                    📊 Widgets actifs sur cette page : {(() => {
                      try {
                        const widgets = JSON.parse(localStorage.getItem('all_widgets') || '[]');
                        return widgets.length;
                      } catch (e) {
                        return '?';
                      }
                    })()}
                  </p>
                  
                  <p className="text-xs text-gray-500 italic">
                    ℹ️ Chaque widget dans Notion a son propre ID et ses propres données
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestion des Calendriers */}
      {isCalendarManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Gérer les calendriers</h3>
              <button onClick={() => setIsCalendarManager(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ajouter un nouveau calendrier
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCalendarName}
                    onChange={(e) => setNewCalendarName(e.target.value)}
                    placeholder="Nom du calendrier (ex: Planning Mars)"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={newCalendarDbId}
                    onChange={(e) => setNewCalendarDbId(e.target.value)}
                    placeholder="ID de la base Notion (32 caractères)"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addCalendar}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {calendars.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Calendriers existants
                  </label>
                  <div className="space-y-2">
                    {calendars.map((calendar) => (
                      <div key={calendar.id} className="bg-gray-50 p-3 rounded-lg">
                        {editingCalendar === calendar.name ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editCalendarName}
                              onChange={(e) => setEditCalendarName(e.target.value)}
                              className="w-full p-1 text-sm border rounded"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editCalendarDbId}
                              onChange={(e) => setEditCalendarDbId(e.target.value)}
                              className="w-full p-1 text-xs border rounded font-mono"
                              placeholder="ID de la base"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => renameCalendar(calendar.name, editCalendarName, editCalendarDbId)}
                                className="flex-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCalendar(null);
                                  setEditCalendarName('');
                                  setEditCalendarDbId('');
                                }}
                                className="flex-1 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{calendar.name}</span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setActiveCalendar(calendar.name);
                                    setLocalStorage('activeCalendar', calendar.name);
                                  }}
                                  className={`text-xs px-2 py-1 rounded ${
                                    activeCalendar === calendar.name
                                      ? 'bg-purple-600 text-white'
                                      : 'text-purple-600 hover:bg-purple-50'
                                  }`}
                                >
                                  {activeCalendar === calendar.name ? 'Actif' : 'Activer'}
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 font-mono mb-2 truncate">
                              {calendar.databaseId}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCalendar(calendar.name);
                                  setEditCalendarName(calendar.name);
                                  setEditCalendarDbId(calendar.databaseId);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => removeCalendar(calendar.name)}
                                className="text-xs text-red-600 hover:text-red-800 px-2"
                              >
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestion des Comptes */}
      {isAccountManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Gérer les comptes</h3>
              <button onClick={() => setIsAccountManager(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ajouter un nouveau compte
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ex: Freelance Créatif"
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addAccount()}
                  />
                  <button
                    onClick={addAccount}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {(accounts.length > 0 || shouldShowAllTab) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comptes existants
                  </label>
                  <div className="space-y-2">
                    
                    {shouldShowAllTab && (
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-sm">All (Tous les comptes)</span>
                        <button
                          onClick={hideAllTab}
                          className="text-xs text-gray-600 hover:text-gray-800 px-2"
                        >
                          Masquer
                        </button>
                      </div>
                    )}

                    {accounts.map((account) => (
                      <div key={account} className="bg-gray-50 p-3 rounded-lg">
                        {editingAccount === account ? (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={editAccountName}
                              onChange={(e) => setEditAccountName(e.target.value)}
                              className="flex-1 p-1 text-sm border rounded"
                              autoFocus
                            />
                            <button
                              onClick={() => renameAccount(account, editAccountName)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => {
                                setEditingAccount(null);
                                setEditAccountName('');
                              }}
                              className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{account}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingAccount(account);
                                  setEditAccountName(account);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2"
                              >
                                Renommer
                              </button>
                              <button
                                onClick={() => setActiveAccount(account)}
                                className={`text-xs px-2 py-1 rounded ${
                                  activeAccount === account
                                    ? 'bg-blue-600 text-white'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                {activeAccount === account ? 'Actif' : 'Activer'}
                              </button>
                              <button
                                onClick={() => removeAccount(account)}
                                className="text-xs text-red-600 hover:text-red-800 px-2"
                              >
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {accounts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={removeAllAccounts}
                        className="w-full text-sm text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-3 rounded-lg transition-colors"
                      >
                        Supprimer tous les comptes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edition de Profil */}
      {isProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Modifier le profil - {activeAccount}</h3>
              <button onClick={() => setIsProfileEdit(false)}>
                <X size={20} />
              </button>
            </div>

            <ProfileEditForm
              profile={currentProfile}
              onSave={(profileData) => {
                saveProfile(activeAccount, profileData);
                setIsProfileEdit(false);
              }}
              onCancel={() => setIsProfileEdit(false)}
            />
          </div>
        </div>
      )}

      <PostModal
        post={selectedPost}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPost(null);
        }}
        onNavigate={(direction) => {
          const currentIndex = filteredPosts.findIndex(p => p.id === selectedPost.id);
          let newIndex;
          if (direction === 'next') {
            newIndex = currentIndex < filteredPosts.length - 1 ? currentIndex + 1 : 0;
          } else {
            newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPosts.length - 1;
          }
          setSelectedPost(filteredPosts[newIndex]);
        }}
      />

      <div className="border-t bg-gray-50 py-3">
        <div className="text-center">
          <a
            href="https://www.instagram.com/freelance.creatif/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Créé par @Freelancecreatif
          </a>
        </div>
      </div>

      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          } text-white font-medium`}
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <span>✓</span>}
            {notification.type === 'error' && <span>✕</span>}
            {notification.type === 'info' && <span>ℹ</span>}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const ProfileEditForm = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState(profile);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nom complet</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          rows={3}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Photo de profil (URL)</label>
        <input
          type="url"
          value={formData.profilePhoto}
          onChange={(e) => setFormData({...formData, profilePhoto: e.target.value})}
          placeholder="https://..."
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Abonnés</label>
          <input
            type="text"
            value={formData.followers}
            onChange={(e) => setFormData({...formData, followers: e.target.value})}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Suivi(e)s</label>
          <input
            type="text"
            value={formData.following}
            onChange={(e) => setFormData({...formData, following: e.target.value})}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sauvegarder
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default InstagramNotionWidget;
