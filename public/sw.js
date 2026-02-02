// public/sw.js
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json(); // Assumes your server sends JSON
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png', // Path to your app icon
      badge: '/icons/badge-96x96.png', // Small white icon for status bar
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/protected/posts', // Where to go when clicked
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});