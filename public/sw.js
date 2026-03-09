// Service worker for offline support

/// <reference lib="webworker" />

const CACHE_NAME = 'savorai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const API_CACHE_NAME = 'savorai-api-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ error: 'Offline', cached: false }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached version and update in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      });
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_RECIPE') {
    // Cache a specific recipe for offline access
    const { recipe } = event.data;
    if (recipe) {
      caches.open(CACHE_NAME).then((cache) => {
        // Create a simple HTML page for the recipe
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${recipe.name} - SavorAI</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
              h1 { color: #FF6B35; }
              ul, ol { padding-left: 20px; }
              li { margin: 8px 0; }
            </style>
          </head>
          <body>
            <h1>${recipe.name}</h1>
            <p>${recipe.description}</p>
            <h2>Ingredients</h2>
            <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
            <h2>Instructions</h2>
            <ol>${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
          </body>
          </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        const response = new Response(blob);
        cache.put(`/offline-recipe-${recipe.id}`, response);
      });
    }
  }
});
