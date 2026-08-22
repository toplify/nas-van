
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const fullMessage = data.noticeBody || data.body || "Něco se změnilo… ♡";
  event.waitUntil(self.registration.showNotification(data.title || "\u2063", {
    body: data.body || fullMessage,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: "vanlife-update-" + Date.now(),
    renotify: true,
    data: { url: data.url || "/", noticeBody: fullMessage, noticeId: data.noticeId || "" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const message = event.notification.data?.noticeBody || "";
  const noticeId = event.notification.data?.noticeId || "";
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  if (message) target.searchParams.set("vanlife_notice", message);
  if (noticeId) target.searchParams.set("vanlife_notice_id", noticeId);

  event.waitUntil((async () => {
    const wins = await clients.matchAll({type:"window",includeUncontrolled:true});
    for (const client of wins) {
      if ("navigate" in client) await client.navigate(target.href);
      if ("focus" in client) return client.focus();
    }
    return clients.openWindow(target.href);
  })());
});
