// App.jsx (ou App.js)
import React, { useState, useEffect } from 'react';
import { Camera, Settings, RefreshCw, Edit3, X, ChevronLeft, ChevronRight, Play, Plus, ChevronDown, Calendar } from 'lucide-react';

/**
 * ✅ Nouveau domaine (embed public)
 * Exemple d’embed isolé : instagram-widget-claude.vercel.app/?wid=client-a
 */
const APP_BASE = 'https://freelance-creatif.vercel.app/';

/**
 * ✅ API backend (inchangé)
 */
const API_BASE = 'https://freelance-creatif.vercel.app/api';

/* -------------------------- Isolation par widget -------------------------- */

// 1) Récupère wid depuis query OU hash (ex: ?wid=client-a ou #wid=client-a)
const getWidFromUrl = () => {
  try {
    const searchWid = new URLSearchParams(window.location.search).get('wid');
    const hashWid = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('wid');
    return (searchWid || hashWid || '').trim() || null;
  } catch {
    return null;
  }
};

// 2) Fallback session si pas de wid explicite (persiste tant que l’onglet vit)
const getSessionId = () => {
  try {
    if (!window.name) {
      window.name = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    }
    return window.name;
  } catch {
    return Math.random().toString(36).slice(2);
  }
};

// 3) ID “effectif” : priorité à ?wid / #wid, puis nom manuel, puis session
const getEffectiveWidgetId = () => {
  const urlWid = getWidFromUrl();
  if (urlWid) return `wid_${urlWid}`;
  const named = localStorage.getItem('widget_custom_name');
  if (named && named.trim()) return named.trim();
  return `session_${getSessionId()}`;
};

const WIDGET_ID = getEffectiveWidgetId();

// Helpers de storage namespacés
const getStorageKey = (key) => `igw:${WIDGET_ID}:${key}`;

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

/* ------------------------------ Utilitaires ------------------------------ */

const detectMediaType = (urls) => {
  if (!urls || urls.length === 0) return 'Image';
  const hasVideo = urls.some(url =>
    url.match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) || url.includes('video') || url.includes('.mp4')
  );
  if (hasVideo) return 'Vidéo';
  if (urls.length > 1) return 'Carrousel';
  return 'Image';
};

/* --------------------------------- UI ----------------------------------- */

const MediaDisplay = ({ urls, caption }) => {
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
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : urls.length - 1); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            style={{ width: '28px', height: '28px' }}
          >
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < urls.length - 1 ? prev + 1 : 0); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            style={{ width: '28px', height: '28px' }}
          >
            <ChevronRight size={16} className="mx-auto" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
            {urls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ height: '40px' }}>
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
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-2xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black/50 rounded-full p-2">
          <X size={24} />
        </button>

        {onNavigate && (
          <>
            <button onClick={() => onNavigate('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black/50 rounded-full p-2">
              <ChevronLeft size={32} />
            </button>
            <button onClick={() => onNavigate('next')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black/50 rounded-full p-2">
              <ChevronRight size={32} />
            </button>
          </>
        )}

        <div className="flex flex-col items-center max-w-lg">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {urls[currentIndex] && (
              <>
                {urls[currentIndex].match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) ? (
                  <video src={urls[currentIndex]} className="max-w-sm max-h-[60vh] object-contain" controls autoPlay />
                ) : (
                  <img src={urls[currentIndex]} alt={post.title} className="max-w-sm max-h-[60vh] object-contain" />
                )}

                {urls.length > 1 && (
                  <>
                    <button onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : urls.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-2">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentIndex(prev => prev < urls.length - 1 ? prev + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-2">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {urls.map((_, index) => (
                        <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2.5 h-2.5 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="text-white text-center mt-6 px-4">
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            {post.caption && <p className="text-sm text-gray-300 mb-3 leading-relaxed">{post.caption}</p>}
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

/* ------------------------------ Composant App ----------------------------- */

const InstagramNotionWidget = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProfileEdit, setIsProfileEdit] = useState(false);
  const [notionApiKey, setNotionApiKey] = useState('');
  const [widgetName, setWidgetName] = useState(''); // Nom personnalisé (option)

  // Multi-calendriers
  const [calendars, setCalendars] = useState([]);
  const [activeCalendar, setActiveCalendar] = useState('default');
  const [isCalendarManager, setIsCalendarManager] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarDbId, setNewCalendarDbId] = useState('');
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [editCalendarName, setEditCalendarName] = useState('');
  const [editCalendarDbId, setEditCalendarDbId] = useState('');

  const [allPosts, setAllPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);

  // Drag & drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Comptes Instagram
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
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const savedApiKey = getLocalStorage('notionApiKey', '');
    const savedCalendars = getLocalStorage('calendars', []);
    const savedActiveCalendar = getLocalStorage('activeCalendar', 'default');
    const savedProfiles = getLocalStorage('instagramProfiles', null);
    const savedAccounts = getLocalStorage('instagramAccounts', []);
    const savedShowAllTab = getLocalStorage('showAllTab', true);
    const savedWidgetName = localStorage.getItem('widget_custom_name') || '';

    if (savedWidgetName) setWidgetName(savedWidgetName);
    if (savedApiKey) setNotionApiKey(savedApiKey);

    if (savedCalendars && savedCalendars.length > 0) {
      setCalendars(savedCalendars);
      setActiveCalendar(savedActiveCalendar);
      loadAllCalendarsPosts(savedApiKey, savedCalendars);
      setTimeout(() => showNotification(`✅ Widget chargé - ${savedCalendars.length} calendrier(s)`, 'success'), 500);
    } else if (savedApiKey) {
      setTimeout(() => showNotification('⚙️ Ajoutez un calendrier pour commencer', 'info'), 500);
    }

    if (savedProfiles) setProfiles(savedProfiles);
    if (savedShowAllTab !== null) setShowAllTab(savedShowAllTab);
    if (savedAccounts) {
      setAccounts(savedAccounts);
      if (savedAccounts.length > 0 && activeAccount === 'All') setActiveAccount(savedAccounts[0]);
    }

    console.log('📊 Widget Stats:', {
      widgetId: WIDGET_ID,
      widFromUrl: getWidFromUrl(),
      calendars: savedCalendars.length,
      accounts: savedAccounts.length,
    });
  }, []);

  /* ------------------------- Chargement des posts ------------------------- */

  const fetchJsonNoStore = async (url, options = {}) => {
    const resp = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store', ...(options.headers || {}) },
      ...options,
    });
    return resp;
  };

  const loadAllCalendarsPosts = async (apiKey = notionApiKey, calendarsList = calendars) => {
    if (!apiKey || !calendarsList || calendarsList.length === 0) return;
    setIsRefreshing(true);
    try {
      const postsPromises = calendarsList.map(c => fetchPostsFromCalendar(apiKey, c.databaseId, c.name));
      const results = await Promise.all(postsPromises);
      const combined = results.flat();
      setAllPosts(combined);
      if (combined.length > 0) showNotification(`${combined.length} posts chargés`, 'success');
    } catch (e) {
      console.error('Erreur chargement calendriers:', e);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const fetchPostsFromCalendar = async (apiKey, databaseId, calendarName) => {
    try {
      const response = await fetchJsonNoStore(`${API_BASE}/notion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, databaseId }),
      });
      const data = await response.json();
      if (data.success) {
        return data.posts.map(p => ({ ...p, calendarName }));
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

  /* --------------------------- Drag & Drop dates -------------------------- */

  const calculateNewDate = (prevPost, nextPost) => {
    const now = new Date();
    if (!prevPost && !nextPost) return now.toISOString().split('T')[0];
    if (!prevPost) {
      const nextDate = new Date(nextPost.date);
      return new Date(nextDate.getTime() + 86400000).toISOString().split('T')[0];
    }
    if (!nextPost) {
      const prevDate = new Date(prevPost.date);
      return new Date(prevDate.getTime() - 86400000).toISOString().split('T')[0];
    }
    const prevTime = new Date(prevPost.date).getTime();
    const nextTime = new Date(nextPost.date).getTime();
    return new Date((prevTime + nextTime) / 2).toISOString().split('T')[0];
    };

  const syncDateToNotion = async (post, newDate) => {
    if (isSyncing) return;
    setIsSyncing(true);

    const calendar = calendars.find(cal => cal.name === post.calendarName);
    if (!calendar) {
      showNotification('Calendrier introuvable', 'error');
      setIsSyncing(false);
      return;
    }

    try {
      const response = await fetchJsonNoStore(`${API_BASE}/notion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: notionApiKey,
          databaseId: calendar.databaseId,
          action: 'updateDate',
          postId: post.id,
          newDate,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showNotification(`Date mise à jour: ${new Date(newDate).toLocaleDateString('fr-FR')}`, 'success');
        setTimeout(() => { fetchPosts(); }, 800);
      } else {
        console.error('Erreur:', result.error);
        showNotification('Erreur lors de la mise à jour', 'error');
      }
    } catch (e) {
      console.error('Erreur synchronisation:', e);
      showNotification('Erreur de connexion', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  /* -------------------------- Connexion & réglages ------------------------ */

  const connectToNotion = async () => {
    if (!notionApiKey) return showNotification('Veuillez saisir la clé API', 'error');
    if (calendars.length === 0) return showNotification('Veuillez ajouter au moins un calendrier', 'error');
    setLocalStorage('notionApiKey', notionApiKey);
    await loadAllCalendarsPosts();
    setIsConfigOpen(false);
  };

  // Sauvegarde/rename du nom de widget (optionnel si pas de ?wid)
  const saveWidgetName = () => {
    if (!widgetName.trim()) return showNotification('⚠️ Veuillez entrer un nom pour le widget', 'error');

    // Vérif soft d’unicité (dans ce même navigateur)
    const allKeys = Object.keys(localStorage);
    const conflict = allKeys.some(k => k.startsWith(`${widgetName}_`) || k.startsWith(`igw:${widgetName}:`));
    if (conflict && widgetName !== WIDGET_ID) {
      return showNotification('❌ Ce nom est déjà utilisé par un autre widget', 'error');
    }

    // Migration des clés locales si on renomme
    const oldPrefix1 = `${WIDGET_ID}_`;
    const oldPrefix2 = `igw:${WIDGET_ID}:`;
    const toMigrate = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(oldPrefix1) || key.startsWith(oldPrefix2)) toMigrate.push(key);
    }
    toMigrate.forEach(oldKey => {
      const val = localStorage.getItem(oldKey);
      const newKey = oldKey.startsWith(oldPrefix1)
        ? `${widgetName}_${oldKey.slice(oldPrefix1.length)}`
        : `igw:${widgetName}:${oldKey.slice(oldPrefix2.length)}`;
      localStorage.setItem(newKey, val);
    });

    localStorage.setItem('widget_custom_name', widgetName);

    // Nettoyage des anciennes clés si WIDGET_ID était généré
    if (WIDGET_ID.startsWith('session_') || WIDGET_ID.startsWith('wid_')) {
      toMigrate.forEach(k => localStorage.removeItem(k));
    }

    showNotification(`✅ Widget renommé en "${widgetName}"`, 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  const resetWidget = () => {
    if (!window.confirm('⚠️ Réinitialiser ce widget ? (n’affecte pas Notion)')) return;
    try {
      const prefix1 = `${WIDGET_ID}_`;
      const prefix2 = `igw:${WIDGET_ID}:`;
      const delKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(prefix1) || k.startsWith(prefix2))) delKeys.push(k);
      }
      delKeys.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('widget_custom_name');
      showNotification('Widget réinitialisé', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
      showNotification('Erreur lors de la réinitialisation', 'error');
    }
  };

  const createNewWidget = () => {
    if (!window.confirm('🆕 Créer un nouveau widget indépendant ?')) return;
    try {
      localStorage.removeItem('widget_custom_name'); // force un nouvel ID effectif
      showNotification('Nouveau widget créé ! Donne-lui un nom…', 'success');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      console.error(e);
      showNotification('Erreur lors de la création', 'error');
    }
  };

  /* ------------------------------ Profils/Comptes ------------------------- */

  const getProfile = (account) =>
    profiles[account] || profiles['All'] || {
      username: 'mon_compte',
      fullName: 'Mon Compte',
      bio: '🚀 Créateur de contenu\n📸 Planning Instagram\n📍 Paris, France',
      profilePhoto: '',
      followers: '1,234',
      following: '567'
    };

  const saveProfile = (account, profileData) => {
    const newProfiles = { ...profiles, [account]: profileData };
    setProfiles(newProfiles);
    setLocalStorage('instagramProfiles', newProfiles);
  };

  const hideAllTab = () => {
    setShowAllTab(false);
    setLocalStorage('showAllTab', false);
    if (activeAccount === 'All' && accounts.length > 0) setActiveAccount(accounts[0]);
  };

  const addAccount = () => {
    if (!newAccountName.trim() || accounts.includes(newAccountName.trim())) return;
    const newAcc = newAccountName.trim();
    const newAccounts = [...accounts, newAcc];
    setAccounts(newAccounts);

    const newProf = {
      username: newAcc.toLowerCase().replace(/\s+/g, '_'),
      fullName: newAcc,
      bio: `🚀 ${newAcc}\n📸 Créateur de contenu\n📍 Paris, France`,
      profilePhoto: '',
      followers: '1,234',
      following: '567'
    };

    const newProfiles = { ...profiles, [newAcc]: newProf };
    setProfiles(newProfiles);

    setLocalStorage('instagramAccounts', newAccounts);
    setLocalStorage('instagramProfiles', newProfiles);

    setActiveAccount(newAcc);
    setNewAccountName('');
    setIsAccountManager(false);
  };

  const removeAccount = (accountToRemove) => {
    const newAccounts = accounts.filter(acc => acc !== accountToRemove);
    setAccounts(newAccounts);

    if (activeAccount === accountToRemove) {
      if (newAccounts.length > 0) setActiveAccount(newAccounts[0]);
      else {
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
      setEditingAccount(null); setEditAccountName(''); return;
    }
    const trimmed = newName.trim();
    const newAccounts = accounts.map(acc => acc === oldName ? trimmed : acc);
    setAccounts(newAccounts);

    if (activeAccount === oldName) setActiveAccount(trimmed);

    const newProfiles = { ...profiles };
    if (profiles[oldName]) {
      newProfiles[trimmed] = { ...profiles[oldName] };
      delete newProfiles[oldName];
      setProfiles(newProfiles);
    }

    setLocalStorage('instagramAccounts', newAccounts);
    setLocalStorage('instagramProfiles', newProfiles);

    setEditingAccount(null);
    setEditAccountName('');
  };

  /* ------------------------------ Filtrage/tri ---------------------------- */

  const getOrderedFilteredPosts = () => {
    let posts = allPosts;
    if (activeCalendar !== 'all' && activeCalendar !== 'default') {
      posts = posts.filter(p => p.calendarName === activeCalendar);
    }
    if (activeAccount !== 'All' && accounts.length > 0) {
      posts = posts.filter(p => p.account === activeAccount);
    }
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredPosts = getOrderedFilteredPosts();

  /* --------------------------------- DnD ---------------------------------- */

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };
  const handleDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };
  const handleDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index); };
  const handleDragEnter = (e, index) => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index); };
  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverIndex(null);
    }
  };
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault(); setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) { setDraggedIndex(null); return; }
    const sourcePost = filteredPosts[draggedIndex];
    if (!sourcePost) { setDraggedIndex(null); return; }
    const prevPost = dropIndex > 0 ? filteredPosts[dropIndex - 1] : null;
    const nextPost = dropIndex < filteredPosts.length ? filteredPosts[dropIndex] : null;
    const newDate = calculateNewDate(prevPost, nextPost);
    await syncDateToNotion(sourcePost, newDate);
    setDraggedIndex(null);
  };

  const gridItems = Array.from({ length: 60 }, (_, i) => filteredPosts[i] || null);

  /* --------------------------------- Render -------------------------------- */

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
              <span className="text-xs text-blue-600">{isSyncing ? 'Sync...' : 'Chargement...'}</span>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowRefreshMenu(!showRefreshMenu)}
              disabled={isRefreshing || isSyncing}
              className={`flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-full transition-all ${(isRefreshing || isSyncing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Options d'actualisation"
            >
              <RefreshCw size={20} className={`text-gray-700 ${ (isRefreshing || isSyncing) ? 'animate-spin' : '' }`} />
              <ChevronDown size={14} className="text-gray-700" />
            </button>

            {showRefreshMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button onClick={() => fetchPosts()} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
                  <RefreshCw size={16} className="text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Actualiser</div>
                    <div className="text-xs text-gray-500">Récupérer nouveaux posts</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setIsConfigOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Paramètres">
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {showRefreshMenu && <div className="fixed inset-0 z-40" onClick={() => setShowRefreshMenu(false)} />}

      <div className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative cursor-pointer group" onClick={() => setIsProfileEdit(true)}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                {currentProfile.profilePhoto ? (
                  <img src={currentProfile.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <Camera size={24} className="text-gray-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit3 size={16} className="text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{filteredPosts.length}</div>
                <div className="text-xs text-gray-500">publications</div>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded" onClick={() => setIsProfileEdit(true)}>
                <div className="font-semibold text-gray-900">{currentProfile.followers}</div>
                <div className="text-xs text-gray-500">abonnés</div>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded" onClick={() => setIsProfileEdit(true)}>
                <div className="font-semibold text-gray-900">{currentProfile.following}</div>
                <div className="text-xs text-gray-500">suivi(e)s
