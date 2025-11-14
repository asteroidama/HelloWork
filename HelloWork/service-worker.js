const CACHE_NAME = 'hello-work-v2';  // ✅ Cambiato da v1 a v2
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
  self.skipWaiting();  // ✅ Forza attivazione immediata
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
  self.clients.claim();  // ✅ Prendi controllo immediato
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// ============================ 
// ✅ GESTIONE NOTIFICHE INTERATTIVE
// ============================

// Ricevi messaggi dall'app
self.addEventListener('message', (event) => {
  console.log('[SW] Messaggio ricevuto:', event.data);
  
  if (event.data.type === 'SHOW_START_NOTIFICATION') {
    console.log('[SW] Mostrando notifica inizio turno');
    showStartNotification();
  } else if (event.data.type === 'SHOW_END_NOTIFICATION') {
    console.log('[SW] Mostrando notifica fine turno');
    showEndNotification(event.data.startTime);
  }
});

// Mostra notifica inizio turno
function showStartNotification() {
    console.log('[SW] showStartNotification chiamata');
    self.registration.showNotification('🍕 Hello Work!', {
        body: 'Hai lavorato oggi?',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: 'shift-start',
        requireInteraction: true,
        actions: [
            { action: 'rest', title: '😴 Riposo' },
            { action: 'set-shift', title: '⏰ Imposta' }
        ]
    }).then(() => {
        console.log('[SW] Notifica inizio mostrata con successo');
    }).catch(err => {
        console.error('[SW] Errore mostrando notifica:', err);
    });
}


// Gestisci click su notifica
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notifica cliccata, azione:', event.action);
    event.notification.close();
    
    const action = event.action;
    const notificationDate = localStorage.getItem('notification_date');
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                clientList[0].postMessage({ 
                    type: 'NOTIFICATION_ACTION', 
                    action: action,
                    date: notificationDate
                });
                clientList[0].focus();
            } else {
                // App chiusa - apri e passa i dati via URL
                const url = action === 'set-shift' 
                    ? `./?quickadd=${notificationDate}` 
                    : './';
                clients.openWindow(url).then((client) => {
                    setTimeout(() => {
                        if (client) {
                            client.postMessage({ 
                                type: 'NOTIFICATION_ACTION', 
                                action: action,
                                date: notificationDate
                            });
                        }
                    }, 1000);
                });
            }
        })
    );
});
