const CACHE_NAME = 'gastos-app-cache-v3'; // Incrementamos la versión del caché
// Lista de archivos para guardar en caché
// ****** INICIO DE LA CORRECCIÓN ******
// Se cambiaron todas las rutas de /ruta a ./ruta o solo ruta
const urlsToCache = [
  './', // Representa el directorio raíz (donde está index.html)
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js', // Biblioteca de gráficos
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' // REQ 1: Biblioteca de Excel
  // Deberías agregar aquí las URLs de tus iconos (ej: 'images/icon-192x192.png')
  // Nota: asegúrate de que la ruta 'images/...' sea correcta.
];
// ****** FIN DE LA CORRECCIÓN ******

// Evento "install": Se dispara cuando el SW se instala
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache abierto');
        // Agrega todos los archivos definidos a la caché
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Archivos cacheados exitosamente');
        // Forza al nuevo SW a activarse inmediatamente
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: Falló el cacheo de archivos', err);
      })
  );
});

// Evento "activate": Se dispara cuando el SW se activa (limpia cachés antiguos)
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  const cacheWhitelist = [CACHE_NAME]; // Solo queremos mantener el caché actual

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si el caché no está en nuestra "whitelist", se borra
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Le dice al SW que tome control de la página inmediatamente
      return self.clients.claim();
    })
  );
});

// Evento "fetch": Se dispara cada vez que la página pide un recurso (CSS, JS, imagen, etc.)
self.addEventListener('fetch', event => {
  // Estrategia "Cache First" (Primero caché, si falla, va a la red)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en el caché, la devolvemos
        if (response) {
          return response;
        }
        
        // Si no, vamos a la red a buscarlo
        return fetch(event.request)
          .then(networkResponse => {
            // Opcional: Podríamos cachear la nueva respuesta aquí si quisiéramos
            // una estrategia "Network First" o "Stale While Revalidate"
            // Pero para esta app, "Cache First" con caché en "install" es suficiente.
            return networkResponse;
          })
          .catch(err => {
            console.error('Service Worker: Error de Fetch', err);
            // Opcional: Devolver una página "offline" personalizada
          });
      })
  );
});




