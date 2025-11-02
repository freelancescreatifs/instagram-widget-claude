import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Camera, Settings, RefreshCw, Edit3, X, ChevronLeft, ChevronRight, Play, Plus, ChevronDown } from 'lucide-react';

const API_BASE = 'https://instagram-widget-claude.vercel.app/api';

// -------- Utils --------
const detectMediaType = (urls) => {
  if (!urls || urls.length === 0) return 'Image';
  const hasVideo = urls.some(url =>
    url.match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) || url.includes('video') || url.includes('.mp4')
  );
  if (hasVideo) return 'Vidéo';
  if (urls.length > 1) return 'Carrousel';
  return 'Image';
};

// ID d’instance par iframe (survit tant que Notion ne recrée pas l’iframe)
const ensureInstanceId = () => {
  try {
    if (!window.name) window.name = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    return window.name;
  } catch {
    return Math.random().toString(36).slice(2);
  }
};
const makePrefixTemp = (instanceId) => `igw-inst:${instanceId}`; // avant DB connue
const makePrefixDb   = (databaseId) => `igw-db:${databaseId}`;   // définitif par DB

// -------- UI Media --------
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
        <video src={currentUrl} className="w-full h-full object-cover" style={{ aspectRatio: '1080/1350' }} muted loop />
      ) : (
        <img
          src={currentUrl}
          alt="Post"
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1080/1350' }}
          onError={(e) => { e.target.src = `https://picsum.photos/1080/1350?random=${Date.now()}`; }}
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

      {isCarousel && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : urls.length - 1); }}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
            style={{ width: 28, height: 28 }}
          >
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < urls.length - 1 ? prev + 1 : 0); }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
            style={{ width: 28, height: 28 }}
          >
            <ChevronRight size={16} className="mx-auto" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
            {urls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`w-2 h-2 rounded-full transition ${index === currentIndex ? 'bg-white' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent opacity-0 group-hover:opacity-100 transition" style={{ height: 40 }}>
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
              urls[currentIndex].match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i) ? (
                <video src={urls[currentIndex]} className="max-w-sm max-h-[60vh] object-contain" controls autoPlay />
              ) : (
                <img src={urls[currentIndex]} alt={post.title} className="max-w-sm max-h-[60vh] object-contain" />
              )
            )}
          </div>

          <div className="text-white text-center mt-6 px-4">
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            {post.caption && <p className="text-sm text-gray-300 mb-3 leading-relaxed">{post.caption}</p>}
            <div className="text-xs text-gray-400 space-y-1">
              <p>📅 {post.date && new Date(post.date).toLocaleDateString('fr-FR')}</p>
              <p>📷 {detectedType} {urls.length > 1 && `(${urls.length} médias)`}</p>
              {post.account && <p>👤 {post.account}</p>}
              {post.calendar && <p>🗂️ {post.calendar}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------- Widget --------
const InstagramNotionWidget = () => {
  // Namespace auto-isolé
  const instanceIdRef = useRef(null);
  if (!instanceIdRef.current) instanceIdRef.current = ensureInstanceId();
  const tempPrefix = makePrefixTemp(instanceIdRef.current);

  const prefixRef = useRef(tempPrefix);
  const setPrefix = (p) => { prefixRef.current = p; };

  // Helpers storage namespacé
  const ns = useCallback((k) => `${prefixRef.current}:${k}`, []);
  const getItem = (k) => { try { return localStorage.getItem(ns(k)); } catch { return null; } };
  const setItem = (k, v) => { try { localStorage.setItem(ns(k), v); } catch {} };

  // UI/data state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProfileEdit, setIsProfileEdit] = useState(false);
  const [notionApiKey, setNotionApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [posts, setPosts] = useState([]);
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

  // ---- NOUVEAU : registres multi-calendriers + tableau de bord
  const [calendars, setCalendars] = useState([]); // {id, name, apiKey?}
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [dashboardMode, setDashboardMode] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2800);
  };

  // Chargement initial (namespace courant)
  useEffect(() => {
    const savedApiKey = getItem('notionApiKey');
    const savedDbId = getItem('databaseId');
    const savedProfiles = getItem('instagramProfiles');
    const savedAccounts = getItem('instagramAccounts');
    const savedShowAllTab = getItem('showAllTab');

    const savedCalendars = getItem('calendars');
    const savedSelCal = getItem('selectedCalendarId');
    const savedDash = getItem('dashboardMode');

    if (savedApiKey) setNotionApiKey(savedApiKey);
    if (savedDbId) setDatabaseId(savedDbId);
    if (savedProfiles) { try { setProfiles(JSON.parse(savedProfiles)); } catch {} }
    if (savedShowAllTab !== null) setShowAllTab(savedShowAllTab === 'true');
    if (savedAccounts) { try {
      const accs = JSON.parse(savedAccounts); setAccounts(accs); if (accs.length > 0) setActiveAccount(accs[0]);
    } catch {} }

    if (savedCalendars) { try { setCalendars(JSON.parse(savedCalendars)); } catch {} }
    if (savedSelCal) setSelectedCalendarId(savedSelCal);
    if (savedDash) setDashboardMode(savedDash === 'true');

    // Si DB déjà connue → basculer le namespace définitif
    if (savedDbId) setPrefix(makePrefixDb(savedDbId));

    // Charger les posts si config déjà présente
    if (savedApiKey && savedDbId) fetchPosts(savedApiKey, savedDbId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persisters
  const persistCalendars = (next) => setItem('calendars', JSON.stringify(next));
  const upsertCalendar = (cal) => {
    setCalendars(prev => {
      const idx = prev.findIndex(c => c.id === cal.id);
      const next = idx === -1 ? [...prev, cal] : prev.map((c,i)=> i===idx?{...c, ...cal}:c);
      persistCalendars(next);
      return next;
    });
  };
  const removeCalendar = (id) => {
    setCalendars(prev => {
      const next = prev.filter(c => c.id !== id);
      persistCalendars(next);
      if (selectedCalendarId === id) setSelectedCalendarId('');
      return next;
    });
  };

  // API calls
  const fetchPosts = async (apiKey = notionApiKey, dbId = databaseId) => {
    setIsRefreshing(true);
    setShowRefreshMenu(false);
    try {
      const response = await fetch(`${API_BASE}/notion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ apiKey, databaseId: dbId }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (data.success) {
        const oldPostIds = new Set(posts.map(p => p.id));
        const newPosts = data.posts.filter(p => !oldPostIds.has(p.id));
        setPosts(data.posts);
        if (posts.length === 0 && data.posts.length > 0) showNotification(`${data.posts.length} posts chargés`, 'success');
        else if (newPosts.length > 0) showNotification(`${newPosts.length} nouveau(x) post(s)`, 'success');
        else showNotification('Feed à jour', 'info');
        setIsConfigOpen(false);
      } else {
        showNotification(`Erreur: ${data.error}`, 'error');
      }
    } catch (err
