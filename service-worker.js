// index の Service Worker(通知機能の土台)
// v2: リマインド通知に「10分後にもう一度」ボタン(スヌーズ)を追加

const NOTIFY_SERVER_URL = 'https://wondrous-hotteok-44dee9.netlify.app';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
