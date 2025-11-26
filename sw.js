const CACHE_NAME = 'fitsyle-pwa-v1';

// LISTA CRÍTICA: Todo esto se guardará para que funcione SIN INTERNET
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './Img/logo.png',
  // Librerías externas (Bootstrap, Iconos, Fuentes) necesarias para el diseño
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Oswald:wght@500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js'
];

// 1. INSTALACIÓN: Guardamos los archivos estáticos
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando y cacheando recursos...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. ACTIVACIÓN: Limpiamos cachés viejos si actualizas la versión
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antiguo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Interceptamos las peticiones para servir desde caché si no hay red
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo manejamos peticiones HTTP/HTTPS (ignoramos extensiones, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, lo devolvemos (Velocidad máxima)
        if (response) {
          return response;
        }
        
        // Si no, vamos a internet
        return fetch(event.request)
          .then(response => {
            // Verificamos que la respuesta sea válida
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // Clonamos la respuesta para guardarla en caché para la próxima
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla internet y no está en caché (aquí podrías retornar una página offline.html si la tuvieras)
            // Por ahora, como es SPA, el index.html ya debería estar cacheado.
            console.log('Fallo de red y recurso no en caché:', event.request.url);
          });
      })
  );
});