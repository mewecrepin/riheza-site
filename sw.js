// Riheza : mise en mémoire pour l'application installée.
// Pages : réseau d'abord (prix toujours à jour), mémoire si la connexion coupe.
// Images, styles, polices : mémoire d'abord (ouverture rapide), mises à jour en arrière-plan.
var VERSION = 'riheza-v1';
var BASE = ['index.html', 'produits.html', 'contact.html', 'style.css', 'tokens.css', 'menu.js',
  'images/riheza-logo.png', 'images/riheza-logo-blanc.png', 'images/favicon.png', 'images/app/icone-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var memeSite = url.origin === self.location.origin;
  var polices = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!memeSite && !polices) return; // WhatsApp, Facebook… passent directement

  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(fetch(req).then(function (r) {
      var copie = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copie); });
      return r;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
    }));
    return;
  }

  e.respondWith(caches.match(req).then(function (enMemoire) {
    var reseau = fetch(req).then(function (r) {
      if (r && (r.ok || r.type === 'opaque')) { var copie = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copie); }); }
      return r;
    }).catch(function () { return enMemoire; });
    return enMemoire || reseau;
  }));
});
