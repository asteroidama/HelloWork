const CACHE_NAME = 'hello-work-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Installazione
self.addEventListener('install', (event) => {
  console.log('[SW] Installazione service worker v2');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Attivazione
self.addEventListener('activate', (event) => {
  console.log('[SW] Attivazione service worker v2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// ============================ 
// GESTIONE NOTIFICHE
// ============================

// Ricevi messaggi dall'app
self.addEventListener('message', (event) => {
    console.log('[SW] Messaggio ricevuto:', event.data);

    if (event.data.type === 'SHOW_START_NOTIFICATION') {
        console.log('[SW] Mostrando notifica inizio turno');
        const notificationDate = event.data.date || new Date().toISOString().split('T')[0];

        self.registration.showNotification('🍕 Hello Work!', {
            body: 'Hai lavorato oggi?',
            icon: './icons/icon-192.png',
            badge: './icons/icon-192.png',
            tag: 'shift-notification',
            requireInteraction: true,
            actions: [
                { action: 'rest', title: '😴 Riposo' },
                { action: 'set-shift', title: '⏰ Imposta' }
            ],
            data: { notificationDate: notificationDate }
        }).then(() => {
            console.log('[SW] Notifica mostrata');
        }).catch(err => {
            console.error('[SW] Errore notifica:', err);
        });
    }
});

// ✅ STRATEGIA NUOVA: Apri SEMPRE l'app, salva azione per dopo
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click notifica - Azione:', event.action);

    const notificationDate = event.notification.data?.notificationDate || new Date().toISOString().split('T')[0];
    const action = event.action || 'open';

    event.notification.close();

    // ✅ SALVA L'AZIONE - sempre, per tutte le azioni
    event.waitUntil(
        caches.open('temp-actions').then(cache => {
            console.log('[SW] Salvo azione:', action);
            return cache.put(
                new Request('/pending-action'),
                new Response(JSON.stringify({
                    action: action,
                    date: notificationDate,
                    timestamp: Date.now()
                }))
            );
        }).then(() => {
            // Controlla se app è già aperta
            return clients.matchAll({ type: 'window', includeUncontrolled: true });
        }).then((clientList) => {
            if (clientList.length > 0) {
                // App aperta - invia messaggio diretto
                console.log('[SW] App aperta - invio messaggio');
                clientList[0].postMessage({ 
                    type: 'NOTIFICATION_ACTION', 
                    action: action,
                    date: notificationDate
                });
                return clientList[0].focus();
            } else {
                // App chiusa - APRI
                console.log('[SW] App chiusa - apertura');
                return clients.openWindow('./');
            }
        }).catch(err => {
            console.error('[SW] Errore gestione click:', err);
            // Fallback - prova ad aprire comunque
            return clients.openWindow('./');
        })
    );
});