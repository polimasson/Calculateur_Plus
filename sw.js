const CACHE_NAME = 'calculateur-plus-v55';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/script.js',
  '/src/icon/favicon.svg',
  '/src/style/style.css',
];

if (typeof window !== 'undefined') {
  // --- CONTEXTE BROWSER (WINDOW) ---
  // Cette section s'exécute lorsque sw.js est inclus dans la page via <script src="sw.js"></script>
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");
    const coepDegrading = (reloadedBySelf === "coepdegrade");

    const coi = {
      shouldRegister: () => !reloadedBySelf && localStorage.getItem('serviceWorkerEnabled') !== 'false',
      shouldDeregister: () => localStorage.getItem('serviceWorkerEnabled') === 'false',
      coepCredentialless: () => true,
      coepDegrade: () => true,
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi
    };

    const n = navigator;
    const controlling = n.serviceWorker && n.serviceWorker.controller;

    if (controlling && !window.crossOriginIsolated) {
      window.sessionStorage.setItem("coiCoepHasFailed", "true");
    }
    const coepHasFailed = window.sessionStorage.getItem("coiCoepHasFailed");

    if (controlling) {
      const reloadToDegrade = coi.coepDegrade() && !(coepDegrading || window.crossOriginIsolated);
      n.serviceWorker.controller.postMessage({
        type: "coepCredentialless",
        value: (reloadToDegrade || coepHasFailed && coi.coepDegrade()) ? false : coi.coepCredentialless(),
      });
      if (reloadToDegrade) {
        !coi.quiet && console.log("Reloading page to degrade COEP.");
        window.sessionStorage.setItem("coiReloadedBySelf", "coepdegrade");
        coi.doReload("coepdegrade");
      }

      if (coi.shouldDeregister()) {
        n.serviceWorker.controller.postMessage({ type: "deregister" });
      }
    }

    if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return;

    if (!window.isSecureContext) {
      !coi.quiet && console.log("COOP/COEP Service Worker not registered, a secure context is required.");
      return;
    }

    if (!n.serviceWorker) {
      !coi.quiet && console.error("COOP/COEP Service Worker not registered, perhaps due to private mode.");
      return;
    }

    const scriptSrc = (window.document.currentScript && window.document.currentScript.src) || 'sw.js';

    n.serviceWorker.register(scriptSrc).then(
      (registration) => {
        !coi.quiet && console.log("Service Worker unifié (COOP/COEP + PWA) enregistré avec succès :", registration.scope);

        registration.addEventListener("updatefound", () => {
          !coi.quiet && console.log("Reloading page to make use of updated Service Worker.");
          window.sessionStorage.setItem("coiReloadedBySelf", "updatefound");
          coi.doReload();
        });

        if (registration.active && !n.serviceWorker.controller) {
          !coi.quiet && console.log("Reloading page to make use of Service Worker.");
          window.sessionStorage.setItem("coiReloadedBySelf", "notcontrolling");
          coi.doReload();
        }
      },
      (err) => {
        !coi.quiet && console.error("Unified Service Worker failed to register:", err);
      }
    );
  })();
} else {
  // --- CONTEXTE SERVICE WORKER ---
  // Cette section s'exécute en arrière-plan par le navigateur
  let coepCredentialless = false;

  // Installation : pré-mise en cache des assets statiques
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Cache ouvert, ajout des ressources initiales');
          return Promise.allSettled(
            ASSETS_TO_CACHE.map(url =>
              cache.add(url).catch(err => {
                console.warn(`[SW] Impossible de mettre en cache ${url}:`, err);
                return null;
              })
            )
          );
        })
        .then(() => {
          console.log('[SW] Service Worker installé avec succès');
          return self.skipWaiting();
        })
        .catch((err) => {
          console.error('[SW] Erreur lors de l\'installation du cache:', err);
        })
    );
  });

  // Activation : nettoyage des anciens caches
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        console.log('[SW] Service Worker activé');
        return self.clients.claim();
      })
    );
  });

  // Gestion des messages de communication depuis le contexte de la page
  self.addEventListener("message", (ev) => {
    if (!ev.data) {
      return;
    } else if (ev.data.type === "deregister") {
      self.registration
        .unregister()
        .then(() => {
          return self.clients.matchAll();
        })
        .then(clients => {
          clients.forEach((client) => client.navigate(client.url));
        });
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value;
    }
  });

  // Gestion et interception des requêtes fetch (Cache + COOP/COEP Headers)
  self.addEventListener("fetch", (event) => {
    const r = event.request;
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
      return;
    }

    event.respondWith(
      caches.match(r).then((cachedResponse) => {
        // Fonction utilitaire pour injecter les en-têtes COOP/COEP nécessaires
        const addCoiHeaders = (response) => {
          if (!response || response.status === 0) {
            return response;
          }

          const newHeaders = new Headers(response.headers);
          newHeaders.set("Cross-Origin-Embedder-Policy",
            coepCredentialless ? "credentialless" : "require-corp"
          );
          if (!coepCredentialless) {
            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
          }
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        };

        // Si la ressource est présente dans le cache, on la renvoie avec les en-têtes
        if (cachedResponse) {
          return addCoiHeaders(cachedResponse);
        }

        // Sinon, on va chercher sur le réseau (en gérant credentialless si requis)
        const request = (coepCredentialless && r.mode === "no-cors")
          ? new Request(r, { credentials: "omit" })
          : r;

        return fetch(request)
          .then((networkResponse) => {
            const modifiedResponse = addCoiHeaders(networkResponse);

            // Mise en cache dynamique des requêtes GET réussies (ex: modèles .onnx)
            if (r.method === 'GET' && networkResponse.status === 200) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(r, modifiedResponse.clone());
                return modifiedResponse;
              });
            }

            return modifiedResponse;
          })
          .catch((err) => {
            console.error('[SW] Erreur de récupération réseau:', err);
            // On renvoie la réponse d'erreur standard ou undefined pour laisser le navigateur lever son erreur
          });
      })
    );
  });
}