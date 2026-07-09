const CACHE_ASSETS = 'restosmart-assets-v1'
const CACHE_IMAGES = 'restosmart-images-v1'
const CACHE_MENU_API = 'restosmart-menu-api-v1'

const TRENTE_JOURS = 30 * 24 * 60 * 60 * 1000

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API dashboard (données critiques) → Network Only
  if (url.pathname.startsWith('/api/dashboard')) {
    return // laisse passer, pas de cache
  }

  // API menu (client) → Network First avec fallback cache
  if (url.pathname.startsWith('/api/menu')) {
    event.respondWith(networkFirst(event.request, CACHE_MENU_API))
    return
  }

  // Images Supabase Storage / Unsplash → Cache First (30 jours)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('unsplash.com')) {
    event.respondWith(cacheFirst(event.request, CACHE_IMAGES))
    return
  }

  // Assets statiques (CSS, JS, fonts, _next/static) → Cache First
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(event.request, CACHE_ASSETS))
    return
  }
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const reponse = await fetch(request)
    if (reponse.ok) cache.put(request, reponse.clone())
    return reponse
  } catch {
    return cached || Response.error()
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const reponse = await fetch(request)
    if (reponse.ok) cache.put(request, reponse.clone())
    return reponse
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return Response.error()
  }
}
