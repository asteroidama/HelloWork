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
// ============================ 
// ✅ GESTIONE NOTIFICHE INTERATTIVE
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

// Gestisci click su notifica
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click notifica - Azione:', event.action);
    
    const notificationDate = event.notification.data?.notificationDate || new Date().toISOString().split('T')[0];
    const action = event.action || 'open';
    
    // ✅ CHIUDI SEMPRE la notifica
    event.notification.close();
    
    // ✅ Per "Riposo" - gestisci immediatamente senza aprire app
    if (action === 'rest') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                if (clientList.length > 0) {
                    // App aperta - invia messaggio
                    clientList[0].postMessage({ 
                        type: 'NOTIFICATION_ACTION', 
                        action: 'rest',
                        date: notificationDate
                    });
                    return clientList[0].focus();
                } else {
                    // App chiusa - salva per dopo
                    return caches.open('temp-actions').then(cache => {
                        return cache.put(
                            new Request('/pending-action'),
                            new Response(JSON.stringify({
                                action: 'rest',
                                date: notificationDate,
                                timestamp: Date.now()
                            }))
                        );
                    });
                }
            })
        );
        return; // ← IMPORTANTE: esci qui, NON aprire app
    }
    
    // ✅ Per "Imposta" o click notifica - FORZA APERTURA APP
    event.waitUntil(
        // Prima salva l'azione
        caches.open('temp-actions').then(cache => {
            return cache.put(
                new Request('/pending-action'),
                new Response(JSON.stringify({
                    action: action,
                    date: notificationDate,
                    timestamp: Date.now()
                }))
            );
        }).then(() => {
            // Poi cerca client esistenti
            return clients.matchAll({ type: 'window', includeUncontrolled: true });
        }).then((clientList) => {
            if (clientList.length > 0) {
                // App già aperta - focus e invia messaggio
                const client = clientList[0];
                client.postMessage({ 
                    type: 'NOTIFICATION_ACTION', 
                    action: action,
                    date: notificationDate
                });
                return client.focus();
            } else {
                // ✅ APRI APP (funziona sempre perché siamo nel context della notifica)
                console.log('[SW] Apertura forzata app');
                return clients.openWindow('./');
            }
        })
    );
});

// Mostra notifica inizio turno
//function showStartNotification() {
 //   console.log('[SW] showStartNotification chiamata');
 //   self.registration.showNotification('🍕 Hello Work!', {
  //      body: 'Hai lavorato oggi?',
  //      icon: './icons/icon-192.png',
   //     badge: './icons/icon-192.png',
   //     tag: 'shift-start',
   //     requireInteraction: true,
   //     actions: [
  //          { action: 'rest', title: '😴 Riposo' },
   //         { action: 'set-shift', title: '⏰ Imposta' }
   //     ]
   // }).then(() => {
   //     console.log('[SW] Notifica inizio mostrata con successo');
  //  }).catch(err => {
  //      console.error('[SW] Errore mostrando notifica:', err);
 //   });
//}


