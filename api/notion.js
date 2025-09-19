export default async function handler(req, res) {
  // Configuration CORS pour éviter les erreurs cross-origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Répondre aux requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Répondre aux requêtes GET avec un message de test
  if (req.method === 'GET') {
    return res.status(405).json({ 
      error: "Method not allowed", 
      method: req.method,
      message: "Use POST to interact with Notion API"
    });
  }

  // Traiter seulement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed", method: req.method });
  }

  try {
    const { action, apiKey, databaseId, postId, newDate } = req.body;

    // Validation de la clé API - NOUVEAU FORMAT NTN_
    if (!apiKey || (!apiKey.startsWith('ntn_') && !apiKey.startsWith('secret_'))) {
      return res.status(400).json({ 
        error: "Clé API invalide", 
        hint: "La clé doit commencer par 'ntn_' (nouveau format) ou 'secret_' (ancien format)",
        received: apiKey ? `${apiKey.substring(0, 10)}...` : 'null'
      });
    }

    // Validation de l'ID de base
    if (!databaseId || databaseId.length !== 32) {
      return res.status(400).json({ 
        error: "ID de base invalide", 
        hint: "L'ID doit faire exactement 32 caractères",
        received: databaseId ? `${databaseId.length} caractères` : 'null'
      });
    }

    const notionApiUrl = 'https://api.notion.com/v1';
    
    switch (action) {
      case 'test':
        // Test de connexion simple
        try {
          const response = await fetch(`${notionApiUrl}/databases/${databaseId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('Notion API Error:', response.status, errorData);
            
            if (response.status === 401) {
              return res.status(401).json({ 
                error: "Clé API invalide ou expirée",
                hint: "Vérifiez votre clé API sur notion.so/my-integrations"
              });
            }
            if (response.status === 404) {
              return res.status(404).json({ 
                error: "Base de données introuvable",
                hint: "Vérifiez l'ID de la base et que l'intégration a accès à la base"
              });
            }
            
            return res.status(response.status).json({ 
              error: "Erreur API Notion", 
              status: response.status,
              details: errorData
            });
          }

          return res.status(200).json({ 
            success: true, 
            message: "Connexion réussie",
            apiFormat: apiKey.startsWith('ntn_') ? 'nouveau (ntn_)' : 'ancien (secret_)'
          });

        } catch (error) {
          console.error('Fetch Error:', error);
          return res.status(500).json({ 
            error: "Erreur de réseau", 
            message: error.message 
          });
        }

      case 'getPosts':
        // Récupérer les posts de la base Notion
        try {
          const response = await fetch(`${notionApiUrl}/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sorts: [
                {
                  property: "Date",
                  direction: "descending"
                }
              ]
            })
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('Database Query Error:', response.status, errorData);
            return res.status(response.status).json({ 
              error: "Impossible de récupérer les posts",
              details: errorData
            });
          }

          const data = await response.json();
          // Debug information
          console.log('Total rows in database:', data.results.length);
          console.log('Database properties:', Object.keys(data.results[0]?.properties || {}));
          
          // Log first row for debugging
          if (data.results[0]) {
            console.log('First row properties:', data.results[0].properties);
          }

          // Analyser les propriétés disponibles
          const sampleResult = data.results[0];
          const availableProperties = sampleResult ? Object.keys(sampleResult.properties) : [];
          
          // Mapping flexible des colonnes avec plus d'options
          const findProperty = (possibleNames) => {
            return availableProperties.find(prop => 
              possibleNames.some(name => 
                prop.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(prop.toLowerCase())
              )
            );
          };

          const titleProperty = findProperty(['titre', 'title', 'name', 'nom', 'post']);
          const dateProperty = findProperty(['date', 'publication', 'publish', 'created']);
          const contentProperty = findProperty(['contenu', 'content', 'media', 'fichiers', 'files', 'images']);
          const typeProperty = findProperty(['type', 'category', 'categorie', 'kind']);
          const captionProperty = findProperty(['caption', 'description', 'desc', 'texte', 'text']);
          const statusProperty = findProperty(['statut', 'status', 'état', 'state']);

          console.log('Property mapping:', {
            title: titleProperty,
            date: dateProperty,
            content: contentProperty,
            type: typeProperty,
            caption: captionProperty,
            status: statusProperty
          });

          // Debug spécifique pour la colonne Contenu
          const debugContenuColumn = data.results.map((result, index) => {
            const contentProp = result.properties['Contenu'];
            return {
              row: index + 1,
              title: result.properties['Titre']?.title?.[0]?.plain_text || `Ligne ${index + 1}`,
              contentType: contentProp?.type,
              hasFiles: contentProp?.files ? contentProp.files.length > 0 : false,
              filesCount: contentProp?.files?.length || 0,
              fileDetails: contentProp?.files?.map(f => ({
                name: f.name || 'unnamed',
                type: f.type,
                hasUrl: !!(f.file?.url || f.external?.url)
              })) || []
            };
          });

          console.log('DEBUG - Colonne Contenu détaillée:', debugContenuColumn);

          // Transformer les résultats en format utilisable
          const posts = data.results.map(result => {
            const properties = result.properties;
            
            // Extraire le titre
            const titleProp = titleProperty ? properties[titleProperty] : null;
            const title = titleProp?.title?.[0]?.plain_text || 'Post sans titre';

            // Extraire la date
            const dateProp = dateProperty ? properties[dateProperty] : null;
            const date = dateProp?.date?.start || new Date().toISOString().split('T')[0];

            // Extraire les fichiers média avec debug
            const contentProp = contentProperty ? properties[contentProperty] : null;
            const files = contentProp?.files || [];
            console.log(`Row ${title}: Content property:`, contentProp);
            console.log(`Row ${title}: Files found:`, files.length);
            
            const mediaUrls = files.map(file => file.file?.url || file.external?.url).filter(Boolean);
            console.log(`Row ${title}: Valid URLs:`, mediaUrls.length);

            // Extraire le type (ou détecter automatiquement)
            const typeProp = typeProperty ? properties[typeProperty] : null;
            let type = typeProp?.select?.name || 'Image';
            
            // Auto-détection du type si pas spécifié
            if (!typeProp && mediaUrls.length > 0) {
              if (mediaUrls.length > 1) {
                type = 'Carrousel';
              } else if (mediaUrls[0]?.includes('.mp4') || mediaUrls[0]?.includes('.mov')) {
                type = 'Vidéo';
              } else {
                type = 'Image';
              }
            }

            // Extraire la caption
            const captionProp = captionProperty ? properties[captionProperty] : null;
            const caption = captionProp?.rich_text?.[0]?.plain_text || '';

            // Extraire le statut
            const statusProp = statusProperty ? properties[statusProperty] : null;
            const status = statusProp?.select?.name || statusProp?.status?.name || '';

            return {
              id: result.id,
              title,
              date,
              urls: mediaUrls,
              type,
              caption,
              status,
              hasContent: mediaUrls.length > 0
            };
          }).filter(post => {
            // Filtrer les posts sans média ET les posts avec statut "Posté"
            return post.hasContent && 
                   post.status.toLowerCase() !== 'posté' && 
                   post.status.toLowerCase() !== 'posted';
          });

          return res.status(200).json({ 
            success: true, 
            posts,
            debug: {
              totalRows: data.results.length,
              postsWithMedia: posts.length,
              availableProperties,
              mappedProperties: {
                title: titleProperty,
                date: dateProperty,
                content: contentProperty,
                type: typeProperty,
                caption: captionProperty,
                status: statusProperty
              },
              filterInfo: {
                statusFiltering: statusProperty ? 'Active' : 'Disabled',
                excludedStatuses: ['Posté', 'Posted']
              }
            }
          });

        } catch (error) {
          console.error('GetPosts Error:', error);
          return res.status(500).json({ 
            error: "Erreur lors de la récupération des posts", 
            message: error.message 
          });
        }

      case 'updateDate':
        // Mettre à jour la date d'un post (pour le drag & drop)
        try {
          const response = await fetch(`${notionApiUrl}/pages/${postId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: {
                "Date": {
                  date: { start: newDate }
                }
              }
            })
          });

          if (!response.ok) {
            const errorData = await response.text();
            return res.status(response.status).json({ 
              error: "Impossible de mettre à jour la date", 
              details: errorData 
            });
          }

          return res.status(200).json({ 
            success: true, 
            message: "Date mise à jour avec succès" 
          });

        } catch (error) {
          console.error('UpdateDate Error:', error);
          return res.status(500).json({ 
            error: "Erreur lors de la mise à jour", 
            message: error.message 
          });
        }

      default:
        return res.status(400).json({ 
          error: "Action non reconnue", 
          validActions: ['test', 'getPosts', 'updateDate'] 
        });
    }

  } catch (error) {
    console.error('Handler Error:', error);
    return res.status(500).json({ 
      error: "Erreur interne du serveur", 
      message: error.message 
    });
  }
}
