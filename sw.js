
const CACHE_NAME = "ottoman-kebap-v7";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Güncel dosyaları önce sunucudan al, bağlantı yoksa önbelleği kullan.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase ve diğer harici servis isteklerine müdahale etme.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(new Request(request, { cache: "no-store" }))
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }

        return Response.error();
      })
  );
});

// Anlık bildirimler
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
      data: { url },
      icon: "./icon-192.png"
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
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
