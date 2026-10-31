// Service Worker for Zenve Vet Cross-Platform Notifications (Laptop, Desktop, Android, iOS)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Zenve Vet Alert', body: event.data.text() };
    }
  }

  const alertTitle = data.title || 'Zenve Vet Clinical Alert';
  const options = {
    body: data.body || data.message || 'New clinical update from peer veterinary practitioners.',
    icon: (data.icon && !data.icon.endsWith('.svg')) ? data.icon : '/zenve_logo.png',
    badge: '/zenve_logo.png',
    data: data.data || { url: '/' },
    vibrate: [200, 100, 200],
    tag: data.tag || `zenve-vet-${Date.now()}`,
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(alertTitle, options)
  );
});

// Handle clicking on desktop/Android/iOS native OS notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetData = event.notification.data || {};
  const targetUrl = targetData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If tab is already open (even minimized or in background), focus it and deliver payload
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_NOTIFICATION',
            data: targetData
          });
          return client.focus();
        }
      }
      // 2. If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
