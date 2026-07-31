// index の Service Worker(通知機能の土台)
// v1: 今はまだ「受け取る準備」だけ。実際に通知を送るサーバー側は、これから別途用意する。

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// プッシュ通知を受け取った時の処理(サーバー側の準備ができ次第、実際に機能する)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'index', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'index';
  const options = {
    body: data.body || '',
    icon: 'apple-touch-icon.png',
    badge: 'apple-touch-icon.png',
    data: { url: data.url || './index.html' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知をタップした時、アプリを開く(または既に開いているタブに戻す)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
