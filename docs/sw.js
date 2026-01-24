const CACHE_VERSION = 'v1';
const CACHE_NAME = `hugo-pure-${CACHE_VERSION}`;

// files to cache on install
const PRECACHE_URLS = [
  '/',
  '/offline/',
];

// cache strategies
const CACHE_STRATEGIES = {
  // cache first, fallback to network
  cacheFirst: [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /\.(?:woff|woff2|ttf|eot)$/,
    /\.(?:css|js)$/
  ],
  // network first, fallback to cache
  networkFirst: [
    /\/posts\//,
    /\/page\//
  ]
};

// install event - precache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('hugo-pure-') && cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // determine strategy based on URL
  const strategy = getStrategy(url.pathname);

  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'network-first') {
    event.respondWith(networkFirst(request));
  } else {
    // default: network only
    return;
  }
});

// helper function to determine caching strategy
function getStrategy(pathname) {
  // check cache-first patterns
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(pathname)) {
      return 'cache-first';
    }
  }

  // check network-first patterns
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(pathname)) {
      return 'network-first';
    }
  }

  return null;
}

// cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // return offline page if available
    return cache.match('/offline/') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// network-first strategy
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // return offline page if available
    return cache.match('/offline/') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}
