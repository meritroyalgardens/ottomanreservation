
const CACHE_NAME = "ottoman-rez-v6";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
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

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data = {
      title: "Yeni Rezervasyon",
      body: "Yeni bir rezervasyon kaydı oluşturuldu.",
      url: "./"
    };

    if (event.data) {
      try {
        const received = event.data.json();
        data = { ...data, ...received };
      } catch {
        data.body = event.data.text() || data.body;
      }
    }

    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: data.tag || "ottoman-new-reservation",
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "./"
      }
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const target = new URL(
      event.notification.data?.url || "./",
      self.location.origin
    );

    if (target.origin !== self.location.origin) return;

    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) {
          await client.navigate(target.href);
        }
        return;
      }
    }

    await self.clients.openWindow(target.href);
  })());
});
