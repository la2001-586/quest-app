// index の Service Worker(通知機能の土台)
// v3 / app V415: リマインド通知 + アプリ本体を常に最新版へ更新

const NOTIFY_SERVER_URL = 'https://wondrous-hotteok-44dee9.netlify.app';
const APP_VERSION = '415';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(clients.map((client) => {
      try {
        const url = new URL(client.url);
        if (url.origin !== self.location.origin || url.searchParams.get('appv') === APP_VERSION) return;
        url.searchParams.set('appv', APP_VERSION);
        return client.navigate(url.href);
      } catch (e) {
        return undefined;
      }
    }));
  })());
});

// 画面本体は端末やGitHub Pagesの古いキャッシュより、ネット上の最新版を優先する。
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});

// プッシュ通知を受け取った時の処理
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
    data: { url: data.url || './index.html', type: data.type, reminderPayload: data.reminderPayload },
  };
  // リマインド通知だけ、スヌーズボタンを付ける
  if (data.type === 'reminder') {
    options.actions = [
      { action: 'snooze', title: '10分後にもう一度' },
    ];
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知(またはボタン)をタップした時の処理
self.addEventListener('notificationclick', (event) => {
  const notifData = event.notification.data || {};
  if (event.action === 'snooze') {
    event.notification.close();
    event.waitUntil(
      self.registration.pushManager.getSubscription().then((sub) => {
        if (!sub) return;
        return fetch(`${NOTIFY_SERVER_URL}/.netlify/functions/snooze`, {
          method: 'POST',
          body: JSON.stringify({
            endpoint: sub.endpoint,
            title: event.notification.title,
            body: event.notification.body,
          }),
        });
      })
    );
    return;
  }
  event.notification.close();
  const targetUrl = notifData.url || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
