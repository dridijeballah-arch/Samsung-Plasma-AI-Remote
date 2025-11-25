const CACHE_NAME = 'plasma-remote-v1';

// Liste des ressources externes à mettre en cache pour le mode hors ligne
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/@google/genai@^1.30.0',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  'https://assets.mixkit.co/active_storage/sfx/2580/2580-preview.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On essaie de mettre en cache les assets externes
      // Note: Pour une vraie prod, on mettrait aussi index.html et les fichiers JS locaux.
      // Dans cet environnement simulé, nous ciblons surtout les dépendances CDN.
      return Promise.all(
        EXTERNAL_ASSETS.map(url => {
          return fetch(url, { mode: 'no-cors' })
            .then(response => cache.put(url, response))
            .catch(e => console.log('Echec cache:', url));
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stratégie: Stale-While-Revalidate pour le contenu, ou Cache First pour les assets statiques
  
  // Pour l'IA Gemini (API), on ne cache pas, on laisse passer ou échouer
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si trouvé dans le cache, on le retourne
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon on fetch sur le réseau
      return fetch(event.request).then((networkResponse) => {
        // On ne met en cache que les réponses valides et les scripts externes
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            // Check si c'est un de nos assets CDN externes (type opaque)
            const isExternal = EXTERNAL_ASSETS.some(url => event.request.url.startsWith(url));
            if (!isExternal) return networkResponse;
        }

        // Mise en cache dynamique des nouvelles requêtes
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback si tout échoue (optionnel)
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});