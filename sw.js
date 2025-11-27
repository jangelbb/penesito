const CACHE_NAME = 'fitsyle-pwa-final-v5';

// LISTA DE ARCHIVOS A GUARDAR (OFFLINE)
const urlsToCache = [
  './',
  './index.html',
  './FitSyle.html',
  './style.css',
  './manifest.webmanifest',
  './Img/logo.png',
  './img/pwa-01.png',
  './img/pwa2-01.png',
  './Img/teni_Mesa de trabajo 1_Mesa de trabajo 1_Mesa de trabajo 1.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Oswald:wght@500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(name => {
        if (name !== CACHE_NAME) return caches.delete(name);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    caches.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request).then(netRes => {
            if (netRes && netRes.status === 200 && netRes.type === 'basic') {
                const resClone = netRes.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
            }
            return netRes;
        });
    })
  );
});