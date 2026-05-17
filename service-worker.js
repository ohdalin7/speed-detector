const CACHE_NAME = 'speed-detector-v1';
const urlsToCache = [
  '/',
  '/speed-detector/',
  '/speed-detector/index.html',
  '/speed-detector/speed_detector_v2.html',
  '/speed-detector/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('캐시 저장 중...');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('일부 파일 캐싱 실패 (오프라인에서 작동합니다):', err);
        return cache.add('/speed-detector/speed_detector_v2.html');
      });
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 페치 이벤트 - 캐시 우선 전략
self.addEventListener('fetch', event => {
  // GPS API, geolocation 요청은 건너뛰기
  if (event.request.url.includes('geolocation') || 
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // 캐시에 있으면 캐시 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크에서 가져오기
      return fetch(event.request).then(response => {
        // 유효한 응답이면 캐시에 저장
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // 오프라인 상태 - 캐시된 파일이 없으면 기본 페이지 반환
        return caches.match('/speed-detector/speed_detector_v2.html');
      });
    })
  );
});
