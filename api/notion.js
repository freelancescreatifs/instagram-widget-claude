// api/notion.js - Fichier à créer dans le dossier api/
export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Répondre aux requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Seules les requêtes POST sont acceptées
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  try {
    console.log('API Request received:', req.body);
    
    const { apiKey, databaseId, action } = req.body;

    // Validation des paramètres
    if (!apiKey || !databaseId || !action) {
      return res.status(400).json({ 
        error: 'Missing parameters', 
        received: { apiKey: !!apiKey, databaseId: !!databaseId, action: !!action }
      });
    }

    // Validation du format de la clé API
    if (!apiKey.startsWith('secret_')) {
      return res.status(400).json({ error: 'Invalid API key format. Must start with "secret_"' });
    }

    // Validation du format de l'ID
    if (databaseId.length !== 32) {
      return res.status(400).json({ error: 'Invalid database ID format. Must be 32 characters' });
    }

    let notionUrl;
    let notionOptions;

    if (action === 'test') {
      // Test de connexion - récupérer info de la base
      notionUrl = `https://api.notion.com/v1/databases/${databaseId}`;
      notionOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28'
        }
      };
    } else if (action === 'query') {
      // Récupération des posts
      notionUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;
      notionOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          sorts: [{ property: 'Date', direction: 'descending' }]
        })
      };
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "test" or "query"' });
    }

    console.log('Calling Notion API:', notionUrl);

    // Appel à l'API Notion
    const response = await fetch(notionUrl, notionOptions);
    const data = await response.json();

    console.log('Notion API Response:', response.status, response.ok);

    if (!response.ok) {
      console.error('Notion API Error:', data);
      
      // Messages d'erreur plus clairs
      let errorMessage = 'Erreur inconnue';
      
      if (response.status === 401) {
        errorMessage = 'Clé API invalide ou expirée';
      } else if (response.status === 404) {
        errorMessage = 'Base de données introuvable ou non partagée avec l\'intégration';
      } else if (response.status === 403) {
        errorMessage = 'Accès refusé - Vérifiez les permissions de l\'intégration';
      } else if (data.message) {
        errorMessage = data.message;
      }

      return res.status(response.status).json({ 
        error: errorMessage,
        notionError: data,
        status: response.status
      });
    }

    if (action === 'test') {
      // Réponse pour le test de connexion
      return res.status(200).json({ 
        success: true, 
        message: 'Connexion réussie !',
        database: {
          title: data.title?.[0]?.text?.content || 'Base sans nom',
          id: data.id
        }
      });
    }

    if (action === 'query') {
      // Traitement des posts
      console.log('Processing', data.results?.length || 0, 'results');

      const formattedPosts = data.results.map(page => {
        const properties = page.properties;
        
        // Fonction pour rechercher les propriétés de manière flexible
        const findProperty = (searchTerms, types = []) => {
          for (const [key, prop] of Object.entries(properties)) {
            // Recherche par nom (insensible à la casse)
            if (searchTerms.some(term => key.toLowerCase().includes(term.toLowerCase()))) {
              return prop;
            }
            // Recherche par type si spécifié
            if (types.length > 0 && types.includes(prop.type)) {
              return prop;
            }
          }
          return null;
        };

        // Recherche des propriétés
        const titleProp = findProperty(['titre', 'title', 'nom', 'name']) || 
                         Object.values(properties).find(p => p.type === 'title');
        const dateProp = findProperty(['date', 'publication', 'publish']) || 
                        Object.values(properties).find(p => p.type === 'date');
        const contentProp = findProperty(['contenu', 'content', 'media', 'fichier', 'file']) || 
                           Object.values(properties).find(p => p.type === 'files');
        const typeProp = findProperty(['type', 'format', 'categorie']) || 
                        Object.values(properties).find(p => p.type === 'select');
        const captionProp = findProperty(['caption', 'description', 'texte', 'text', 'legende']) || 
                           Object.values(properties).find(p => p.type === 'rich_text' && p !== titleProp);

        // Récupération des fichiers
        const files = contentProp?.files || [];
        const urls = files.map(file => file.file?.url || file.external?.url).filter(Boolean);

        // Auto-détection du type
        let autoType = 'image';
        if (files.length > 1) {
          autoType = 'carrousel';
        } else if (files.length === 1 && files[0].name) {
          const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
          const isVideo = videoExtensions.some(ext => 
            files[0].name.toLowerCase().includes(ext)
          );
          if (isVideo) autoType = 'video';
        }

        const manualType = typeProp?.select?.name?.toLowerCase();
        const finalType = manualType || autoType;

        const post = {
          id: page.id,
          date: dateProp?.date?.start || new Date().toISOString().split('T')[0],
          type: finalType,
          urls: urls,
          caption: captionProp?.rich_text?.[0]?.text?.content || '',
          title: titleProp?.title?.[0]?.text?.content || 
                 titleProp?.rich_text?.[0]?.text?.content || 
                 'Post sans titre',
          fileNames: files.map(file => file.name || 'Fichier sans nom'),
          debug: {
            propertiesFound: {
              title: !!titleProp,
              date: !!dateProp,
              content: !!contentProp,
              type: !!typeProp,
              caption: !!captionProp
            },
            filesCount: files.length,
            allProperties: Object.keys(properties)
          }
        };

        console.log(`Post processed: ${post.title}, files: ${files.length}, urls: ${urls.length}`);
        return post;
      });

      console.log('Formatted posts:', formattedPosts.length);

      return res.status(200).json({ 
        success: true, 
        posts: formattedPosts,
        count: formattedPosts.length,
        debug: {
          totalResults: data.results?.length || 0,
          processedPosts: formattedPosts.length
        }
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message,
      stack: error.stack
    });
  }
}
