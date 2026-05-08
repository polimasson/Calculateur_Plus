const CACHE_NAME = 'calculateur-plus-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/script.js',
  '/src/icon/favicon.svg',
  '/src/style/style.css',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert, ajout des ressources initiales');
        // Ajoute chaque fichier individuellement pour ignorer les erreurs
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Impossible de mettre en cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker installé avec succès');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('Erreur lors de l\'installation du cache:', err);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activé');
      return self.clients.claim();
    })
  );
});

// Gestion des requêtes fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si c'est dans le cache, on le donne. Sinon, on va sur internet.
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // On ajoute au cache au fur et à mesure (pratique pour les modèles .onnx !)
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});