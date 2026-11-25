const CACHE_NAME = "ottoman-rez-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  let title = "Yeni Rezervasyon";
  let body = "Yeni bir rezervasyon kaydı oluşturuldu.";
  let url = "./";

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.url) url = data.url;
    } catch {
      const txt = event.data.text();
      if (txt) body = txt;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: "ottoman-rez-" + Date.now(),
      renotify: true,
      data: { url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
