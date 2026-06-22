self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pas de mise en cache hors-ligne pour l'instant — un handler fetch minimal
// suffit aux critères d'installabilité des navigateurs (Chrome/Edge).
self.addEventListener("fetch", () => {});
