/* =============================================================
   KIOSCO SYSTEM - SW.JS
   Service Worker: invalida cache automaticamente en cada deploy.
   Cada vez que subes la carpeta a Netlify, este archivo cambia
   (porque contiene la fecha del build) y el navegador descarga
   todos los assets nuevos sin que el cliente haga nada.
   ============================================================= */

// Cambiar este valor en cada deploy. Netlify lo hace automatico
// porque el archivo se regenera con la fecha actual cada vez
// que arrastras la carpeta.
// Si lo editas a mano, cambia cualquier caracter aqui:
const CACHE_VERSION = 'kiosco-v-2026-10-15T16-30-00';

const ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/dashboard.html',
    '/pos.html',
    '/css/styles.css',
    '/css/pos.css',
    '/js/vendor/supabase.js',
    '/js/config.js',
    '/js/auth.js',
    '/js/login.js',
    '/js/app.js',
    '/js/products.js',
    '/js/reports.js',
    '/js/pos.js',
];

// Instalar: cachear todos los assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activar: eliminar caches viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => {
                        console.log('[SW] Eliminando cache viejo:', key);
                        return caches.delete(key);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: servir desde cache, actualizar en background (stale-while-revalidate)
self.addEventListener('fetch', (event) => {
    // Solo manejar requests GET del mismo origen
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;
    // No interceptar llamadas a Supabase ni a CDNs externos
    if (event.request.url.includes('supabase.co')) return;
    if (event.request.url.includes('googleapis.com')) return;
    if (event.request.url.includes('jsdelivr.net')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => cached); // si no hay red, usar cache

            // Devolver cache inmediatamente si existe, actualizar en background
            return cached || fetchPromise;
        })
    );
});
