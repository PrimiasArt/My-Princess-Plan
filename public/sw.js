const CACHE_NAME = 'princess-plan-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/crown-icon.svg',
  '/stickers/princess-prince.jpg',
  '/stickers/bunny-bear.jpg',
  '/stickers/expression-pout.jpg',
  '/stickers/expression-beg.jpg',
  '/stickers/expression-excited.jpg',
  '/stickers/expression-sleepy.jpg',
  '/stickers/date-foodie.jpg',
  '/stickers/date-scooter.jpg',
  '/stickers/royal-dressup.jpg',
  '/stickers/royal-flowers.jpg',
  '/stickers/pet-piggyback.jpg',
  '/stickers/pet-claw-machine.jpg',
  '/stickers/act-boba-cake.jpg',
  '/stickers/act-cinema-date.jpg',
  '/stickers/act-photobooth-fun.jpg',
  '/stickers/exp-sponsor-rich.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html')))
  );
});
