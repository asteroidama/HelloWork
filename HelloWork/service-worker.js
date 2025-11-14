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
        body: 'A che ora hai attaccato?',
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

function showSetStartTimeNotification() {
    self.registration.showNotification('⏰ Inizio Turno', {
        body: 'Seleziona orario di inizio:',
        icon: './icons/icon-192.png',
        tag: 'set-start',
        requireInteraction: true,
        actions: [
            { action: 'start-19', title: '19:00' },
            { action: 'start-1930', title: '19:30' },
            { action: 'start-20', title: '20:00' },
            { action: 'start-other', title: 'Altro...' }
        ]
    });
}

function showSetEndTimeNotification(startTime) {
    self.registration.showNotification('⏰ Fine Turno', {
        body: `Inizio: ${startTime} - Seleziona fine:`,
        icon: './icons/icon-192.png',
        tag: 'set-end',
        requireInteraction: true,
        actions: [
            { action: 'end-23', title: '23:00' },
            { action: 'end-2330', title: '23:30' },
            { action: 'end-00', title: '00:00' },
            { action: 'end-other', title: 'Altro...' }
        ],
        data: { startTime: startTime }
    });
}

// Gestisci click su notifica
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notifica cliccata, azione:', event.action);
    event.notification.close();
    
    const action = event.action;
    
    if (action === 'rest') {
        sendActionToApp('rest');
    } else if (action === 'set-shift') {
        showSetStartTimeNotification();
    } else if (action.startsWith('start-')) {
        if (action === 'start-other') {
            openAppWithPicker();
        } else {
            const time = action === 'start-19' ? '19:00' : action === 'start-1930' ? '19:30' : '20:00';
            localStorage.setItem('temp_start', time);
            showSetEndTimeNotification(time);
        }
    } else if (action.startsWith('end-')) {
        if (action === 'end-other') {
            openAppWithPicker();
        } else {
            const startTime = localStorage.getItem('temp_start');
            const endTime = action === 'end-23' ? '23:00' : action === 'end-2330' ? '23:30' : '00:00';
            sendActionToApp('save-shift', { start: startTime, end: endTime });
            localStorage.removeItem('temp_start');
        }
    }
});

function sendActionToApp(actionType, data = null) {
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
            clientList[0].postMessage({ type: 'NOTIFICATION_ACTION', action: actionType, data: data });
            clientList[0].focus();
        } else {
            clients.openWindow('./').then((client) => {
                setTimeout(() => {
                    if (client) {
                        client.postMessage({ type: 'NOTIFICATION_ACTION', action: actionType, data: data });
                    }
                }, 1000);
            });
        }
    });
}

function openAppWithPicker() {
    const notificationDate = localStorage.getItem('notification_date');
    clients.openWindow('./?action=quick-add&date=' + notificationDate);
}
