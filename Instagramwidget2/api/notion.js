// api/notion.js - Fichier à créer dans votre projet
export default async function handler(req, res) {
  // Permettre CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, databaseId, action } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({ error: 'apiKey and databaseId are required' });
    }

    // Valider le format de la clé API
    if (!apiKey.startsWith('secret_')) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Valider le format de l'ID
    if (databaseId.length !== 32) {
      return res.status(400).json({ error: 'Invalid database ID format' });
    }

    let notionUrl;
    let notionBody = {};

    if (action === 'query') {
      // Requête pour récupérer les posts
      notionUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;
      notionBody = {
        sorts: [
          {
            property: 'Date',
            direction: 'descending'
          }
        ]
      };
    } else if (action === 'test') {
      // Test de connexion simple
      notionUrl = `https://api.notion.com/v1/databases/${databaseId}`;
      notionBody = null;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Faire l'appel à l'API Notion
    const response = await fetch(notionUrl, {
      method: notionBody ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: notionBody ? JSON.stringify(notionBody) : null
    });

    const data = await response.json();

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
        details: data 
      });
    }

    // Traitement des données pour les posts
    if (action === 'query') {
      const formattedPosts = data.results.map(page => {
        const properties = page.properties;
        
        // Récupérer les fichiers depuis la propriété "Contenu"
        const files = properties.Contenu?.files || [];
        const urls = files.map(file => {
          return file.file?.url || file.external?.url || '';
        }).filter(url => url);

        // Auto-détection du type
        let autoType = 'image';
        if (files.length > 1) {
          autoType = 'carrousel';
        } else if (files.length === 1 && files[0].name) {
          const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
          const isVideo = videoExtensions.some(ext => 
            files[0].name.toLowerCase().includes(ext)
          );
          if (isVideo) autoType = 'video';
        }

        const manualType = properties.Type?.select?.name?.toLowerCase();
        const finalType = manualType || autoType;
        
        return {
          id: page.id,
          date: properties.Date?.date?.start || new Date().toISOString().split('T')[0],
          type: finalType,
          urls: urls.length > 0 ? urls : [],
          caption: properties.Caption?.rich_text?.[0]?.text?.content || '',
          title: properties.Titre?.title?.[0]?.text?.content || 'Post sans titre',
          fileNames: files.map(file => file.name || 'Fichier sans nom')
        };
      });

      return res.status(200).json({ 
        success: true, 
        posts: formattedPosts,
        count: formattedPosts.length 
      });
    }

    // Pour le test de connexion
    return res.status(200).json({ 
      success: true, 
      message: 'Connexion réussie !',
      database: {
        title: data.title?.[0]?.text?.content || 'Base sans nom',
        id: data.id
      }
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message 
    });
  }
}
