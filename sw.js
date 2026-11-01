// BKN service worker: يخلي الموقع يشتغل كتطبيق، ويفتح حتى بدون إنترنت (آخر نسخة محفوظة)
const CACHE = 'bkn-v2';
const SHELL = ['./', 'index.html', 'saudi.html', 'mbs.html', 'news.html', 'articles.html', 'analytics.html', 'archive.html', 'report.html',
  'breaking.html', 'saved.html', 'source.html', 'story.html', 'video.html', 'screen.html',
  'assets/style.css', 'assets/i18n.js', 'assets/templates.js', 'assets/app.js', 'assets/analytics.js', 'assets/pages.js', 'assets/video.js', 'assets/screen.js',
  'assets/icon-192.png', 'manifest.webmanifest'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isData = url.pathname.includes('/data/');
  // البيانات: من الشبكة أولًا. الواجهة: من الشبكة مع نسخة احتياطية
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(isData ? url.pathname : e.request, copy)); }
    return res;
  }).catch(() => caches.match(isData ? url.pathname : e.request).then((r) => r || caches.match('index.html'))));
});
