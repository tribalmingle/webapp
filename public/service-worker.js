const CACHE_NAME = 'tribalmingle-v1'
const RUNTIME_CACHE = 'tribalmingle-runtime'

const PRECACHE_URLS = [
  '/',
  '/dashboard-spa',
  '/discover',
  '/chat',
  '/profile',
  '/triballogo.png',
  '/offline.html'
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // API requests - network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  // Image requests - cache first
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        
        return fetch(request).then((response) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone())
            return response
          })
        })
      })
    )
    return
  }

  // HTML requests - network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone())
            return response
          })
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html')
          })
        })
    )
    return
  }

  // All other requests - cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        return caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, response.clone())
          return response
        })
      })
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  }
  if (event.tag === 'sync-likes') {
    event.waitUntil(syncLikes())
  }
})

async function syncMessages() {
  // Sync pending messages when back online
  const cache = await caches.open('pending-messages')
  const requests = await cache.keys()
  
  return Promise.all(
    requests.map(async (request) => {
      const response = await fetch(request.clone())
      if (response.ok) {
        await cache.delete(request)
      }
      return response
    })
  )
}

async function syncLikes() {
  // Sync pending likes when back online
  const cache = await caches.open('pending-likes')
  const requests = await cache.keys()
  
  return Promise.all(
    requests.map(async (request) => {
      const response = await fetch(request.clone())
      if (response.ok) {
        await cache.delete(request)
      }
      return response
    })
  )
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Tribal Mingle'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'notification',
    data: data.url || '/dashboard-spa',
    actions: [
      {
        action: 'open',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  event.waitUntil(
    clients.openWindow(event.notification.data || '/dashboard-spa')
  )
})
