// Marlenia — minimaler Service Worker, nur um ServiceWorkerRegistration.showNotification()
// verfügbar zu machen (auf iOS erforderlich, da Notification-Konstruktor dort nicht erlaubt ist).
// Bewusst OHNE fetch-Handler/Caching, damit index.html nie aus einem SW-Cache statt frisch
// von GitHub Pages geladen wird.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
