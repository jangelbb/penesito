const CACHE_NAME = 'fitsyle-pwa-v3'; // Cambié la versión para forzar la actualización inmediata

// LISTA CRÍTICA: Todo esto se descargará apenas se instale la App
const urlsToCache = [
  './',
  './index.html',
  './FitSyle.html',         // ¡IMPORTANTE! Agregamos la tienda
  './admin.html',           // Agregamos el admin por si acaso
  './tienda.html',          // Agregamos la otra tienda
  './style.css',
  './manifest.webmanifest',
  './Img/logo.png',
  
  // IMÁGENES DEL CARRUSEL (Rutas exactas)
  './img/pwa-01.png',
  './img/pwa2-01.png',
  './Img/teni_Mesa de trabajo 1_Mesa de trabajo 1_Mesa de trabajo 1.jpg',

  // LIBRERÍAS DE DISEÑO
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Oswald:wght@500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',

  // LIBRERÍAS FIREBASE (Para que el JS cargue sin internet)
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
];

// 1. INSTALACIÓN
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  self.skipWaiting(); // Forza al SW a activarse de inmediato
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. ACTIVACIÓN (Limpieza de caché viejo)
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH (Estrategia: Caché primero, luego Red, y guarda lo nuevo)
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones http/https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // A) Si está en caché, lo devolvemos (Velocidad / Offline)
        if (response) {
          return response;
        }

        // B) Si no, vamos a internet
        return fetch(event.request).then(networkResponse => {
            // Verificamos que la respuesta sea válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // C) Guardamos la copia nueva en caché para la próxima
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // D) Si no hay internet y no está en caché
            console.log('Fallo de red y recurso no cacheado:', event.request.url);
            // Aquí podrías retornar una página "offline.html" genérica si quisieras
          });
      })
  );
});