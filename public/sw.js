// public/sw.js - Updated with sound asset caching and cache storage fix
const CACHE_NAME = 'tambola-game-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/assets/index.css',
  '/assets/index.js'
];

// Sound assets to be cached separately to avoid 206 partial response issues
const SOUND_ASSETS = [
  '/sounds/win.mp3',
  '/sounds/jackpot.mp3',
  '/sounds/fanfare.mp3',
  '/sounds/applause.mp3'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name !== CACHE_NAME;
        }).map((name) => {
          console.log('Service Worker: Clearing old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event with special handling for sound files
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip Firebase API requests
  if (event.request.url.includes('firebaseio.com')) {
    return;
  }

  // Check if this is a sound file request
  const isSoundFile = SOUND_ASSETS.some(soundPath => 
    event.request.url.includes(soundPath)
  );

  // If it's a sound file, use network-first strategy but don't cache
  // This avoids the 206 Partial Response caching issue
  if (isSoundFile) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('Service Worker: Network request for sound failed, checking cache');
          return caches.match(event.request);
        })
    );
    return;
  }

  // Normal network-first strategy for other resources
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only clone and store complete responses (status 200)
        if (response.status === 200) {
          const clonedResponse = response.clone();
          
          // Open cache and store the new response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, clonedResponse);
            })
            .catch(err => {
              console.error('Service Worker: Cache storage error:', err);
            });
        }
        
        return response;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If the request is for an HTML page, return the offline page
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
            
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New update from Tambola Game',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now()
      },
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Tambola Game', 
        options
      )
    );
  } catch (error) {
    console.error('Service Worker: Push notification error:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const url = event.notification.data?.url || '/';
        
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
