/* B&F MES 서비스워커 — 앱이 꺼져 있어도 알림(웹푸시)을 받아 표시한다. */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    try { data = { body: event.data.text() }; } catch (e2) { data = {}; }
  }
  var title = data.title || 'B&F MES 알림';
  var body = data.body || '';
  var url = data.url || '/bnf-mes/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/bnf-mes/icon-192.png',
      badge: '/bnf-mes/icon-192.png',
      tag: data.tag || undefined,
      data: { url: url },
      vibrate: [80, 40, 80]
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/bnf-mes/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('/bnf-mes') >= 0 && 'focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
