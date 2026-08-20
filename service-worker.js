
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || "0 KM 🚐";
  const options = {
    body: data.body || "Něco se změnilo v našem projektu… ♡",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: "zero-km-update",
    renotify: true,
    data: { url: data.url || "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type:"window", includeUncontrolled:true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.navigate(url);
        return client.focus();
      }
    }
    return clients.openWindow(url);
  })());
});
