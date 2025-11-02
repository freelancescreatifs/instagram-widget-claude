// api/notion.js
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Anti-cache (important pour que 2 widgets ne partagent rien via cache réseau)
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      status: "OK",
      message: "API Notion active",
      version: "8.0-batch+no-store"
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      error: "Method not allowed",
      method: req.method,
      message: "Use POST to interact with Notion API"
    });
    return;
  }

  // ------- Helpers -------
  const extractPostsFromQuery = (data) => {
    return (data.results || [])
      .filter(row => {
        // Exclure les posts marqués "Posté/Posted"
        const status =
          row.properties.Statut?.select?.name ||
          row.properties.Status?.select?.name || '';
        return status.toLowerCase() !== 'posté' && status.toLowerCase() !== 'posted';
      })
      .map(row => {
        const properties = row.properties || {};

        // Titre
        const title =
          properties.Titre?.title?.[0]?.text?.content ||
          properties.Title?.title?.[0]?.text?.content ||
          properties.Name?.title?.[0]?.text?.content ||
          `Post ${row.id.slice(-6)}`;

        // Médias (priorité à Couverture)
        const contentProperty =
          properties.Couverture?.files ||
          properties.Contenu?.files ||
          properties.Content?.files ||
          properties.Media?.files ||
          properties['Files & media']?.files ||
          properties.Fichiers?.files ||
          properties.Images?.files || [];

        const urls = contentProperty
          .map(file => {
            if (file.type === 'file') return file.file.url;
            if (file.type === 'external') return file.external.url;
            return null;
          })
          .filter(Boolean);

        // Date
        const dateProperty =
          properties.Date?.date?.start ||
          properties.Published?.date?.start ||
          properties.Publish?.date?.start ||
          new Date().toISOString().split('T')[0];

        // Caption
        const caption =
          properties.Caption?.rich_text?.[0]?.text?.content ||
          properties.Description?.rich_text?.[0]?.text?.content ||
          properties.Text?.rich_text?.[0]?.text?.content ||
          properties.Texte?.rich_text?.[0]?.text?.content ||
          '';

        // Type
        const type =
          properties.Type?.select?.name ||
          properties.Category?.select?.name ||
          properties.Catégorie?.select?.name ||
          (urls.length > 1
            ? 'Carrousel'
            : urls.some(url => /\.(mp4|mov|webm|avi|m4v)(\?|$)/i.test(url))
            ? 'Vidéo'
            : 'Image');

        // Compte
        const account =
          properties['Compte Instagram']?.select?.name ||
          properties['Account Instagram']?.select?.name ||
          properties.Account?.select?.name ||
          properties.Compte?.select?.name ||
          properties.Instagram?.select?.name ||
          '';

        return {
          id: row.id,
          title,
          urls,
          date: dateProperty,
          caption,
          type,
          account
        };
      })
      .filter(post => post.urls.length > 0);
  };

  const queryOneDatabase = async (apiKey, databaseId) => {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        sorts: [{ property: 'Date', direction: 'descending' }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`Erreur Notion API: ${response.status} - ${errorText}`);
      err.httpStatus = response.status;
      throw err;
    }

    const data = await response.json();
    return extractPostsFromQuery(data);
  };

  try {
    const body = req.body || {};
    const { apiKey, databaseId, action, postId, newDate, pageId } = body;

    // --------- ACTION: BATCH (nouveau) ---------
    // Permet de centraliser plusieurs DB dans une seule réponse
    if (action === 'batch') {
      const { sources } = body; // [{ databaseId, apiKey?, label? }]
      if (!Array.isArray(sources) || sources.length === 0) {
        res.status(400).json({ success: false, error: "sources[] (array) requis" });
        return;
      }

      // Validation légère + exécution en parallèle
      const jobs = sources.map(async (src, idx) => {
        const sApiKey = src.apiKey || apiKey; // fallback sur apiKey globale si fournie
        const sDbId = src.databaseId || databaseId;
        if (!sApiKey || !sDbId) {
          throw new Error(`Source ${idx}: apiKey et databaseId requis`);
        }
        if (!String(sApiKey).startsWith('ntn_')) {
          throw new Error(`Source ${idx}: format de clé API invalide (attendu ntn_...)`);
        }
        const posts = await queryOneDatabase(sApiKey, sDbId);
        // Tag pour afficher la provenance en front (badge)
        const label = src.label || sDbId;
        return posts.map(p => ({ ...p, calendar: label, _db: sDbId }));
      });

      let combined = [];
      try {
        const results = await Promise.all(jobs);
        combined = results.flat();
      } catch (e) {
        res.status(400).json({ success: false, error: e.message || 'Erreur sur une des sources' });
        return;
      }

      // Tri global (plus récent d'abord)
      combined.sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db - da;
      });

      // Meta utile : comptes et calendriers distincts
      const accounts = [...new Set(combined.map(p => p.account).filter(Boolean))];
      const calendars = [...new Set(combined.map(p => p.calendar).filter(Boolean))];

      res.status(200).json({
        success: true,
        posts: combined,
        meta: {
          total: combined.length,
          accounts,
          calendars
        }
      });
      return;
    }

    // --------- Validation standard (single DB ou updateDate) ---------
    if (!apiKey || !databaseId) {
      res.status(400).json({ success: false, error: "Clé API et ID de base requis" });
      return;
    }
    if (!String(apiKey).startsWith('ntn_')) {
      res.status(400).json({
        success: false,
        error: "Format de clé API invalide. Utilisez le nouveau format ntn_..."
      });
      return;
    }

    // --------- ACTION: updateDate (inchangé) ---------
    if (action === 'updateDate' && (postId || pageId) && newDate) {
      try {
        const updateResponse = await fetch(`https://api.notion.com/v1/pages/${postId || pageId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            properties: { "Date": { date: { start: newDate } } }
          })
        });

        const updateResult = await updateResponse.json();

        if (updateResponse.ok) {
          res.status(200).json({
            success: true,
            message: `Date mise à jour: ${newDate}`,
            data: updateResult
          });
        } else {
          res.status(400).json({
            success: false,
            error: `Erreur mise à jour date: ${updateResponse.status}`,
            details: updateResult
          });
        }
        return;
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Erreur lors de la mise à jour de la date",
          details: error.message
        });
        return;
      }
    }

    // --------- ACTION par défaut: lecture d’une seule DB (inchangé) ---------
    try {
      const posts = await queryOneDatabase(apiKey, databaseId);
      const accounts = [...new Set(posts.map(p => p.account).filter(Boolean))];

      res.status(200).json({
        success: true,
        posts,
        meta: {
          total: posts.length,
          accounts
        }
      });
    } catch (err) {
      res.status(err.httpStatus || 500).json({
        success: false,
        error: err.message || "Erreur Notion"
      });
    }
  } catch (error) {
    console.error('Erreur API Notion:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Erreur serveur interne"
    });
  }
};
