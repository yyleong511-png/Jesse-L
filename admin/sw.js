// Caches only the app shell so the editor opens instantly / offline.
// It never caches content.json or GitHub API responses — those must
// always be fetched fresh so you're never editing stale data.
var CACHE = 'jl-admin-shell-v1';
var SHELL = [
  './',
  './index.html',
  './app.js',
  './fields.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  if (url.indexOf('api.github.com') !== -1 || url.indexOf('content.json') !== -1) {
    return; // always network, never cached
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).catch(function () { return cached; });
    })
  );
});
