// 하자체크 AI — Service Worker
// 이 파일 내용이 바뀌면 브라우저가 자동으로 새 SW를 설치합니다.
// 캐시 이름에 버전을 붙여 이전 캐시를 깨끗하게 정리합니다.

const STATIC_CACHE = 'haja-static-v1';
const DYNAMIC_CACHE = 'haja-dynamic-v1';

const KNOWN_CACHES = [STATIC_CACHE, DYNAMIC_CACHE];

// ── Install ──────────────────────────────────────────────────────────────────
// 설치 즉시 대기 없이 활성화합니다 (skipWaiting).
// 정적 자산 선 캐싱은 하지 않습니다 — Next.js 빌드 해시가 매번 바뀌기 때문에
// fetch 핸들러에서 방문 시점에 동적으로 캐싱합니다.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
// 구버전 캐시 삭제 후 즉시 모든 클라이언트를 제어합니다.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 요청만 처리합니다.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 동일 출처 요청만 캐싱합니다 (외부 CDN, Gemini API 등 제외).
  if (url.origin !== self.location.origin) return;

  // AI 분석 API는 항상 네트워크로 — 캐싱하지 않습니다.
  if (url.pathname.startsWith('/api/')) return;

  // Next.js 정적 자산 (/_next/static/): 콘텐츠 해시가 파일명에 포함되어 있어 불변.
  // → 캐시 우선 전략 (Cache-First).
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 아이콘·manifest 등 public 정적 파일: 캐시 우선.
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 페이지 내비게이션 및 기타 GET: 네트워크 우선, 실패 시 캐시 폴백.
  // 캐시된 HTML은 다음 네트워크 성공 때까지 오프라인 셸로 사용됩니다.
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ── 캐시 전략 헬퍼 ────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 캐시에도 없고 네트워크도 실패: 아무것도 반환하지 않음 (브라우저 기본 오류).
    return new Response('오프라인 — 자산을 불러올 수 없습니다.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // 페이지 내비게이션 실패 시 간단한 오프라인 안내를 반환합니다.
    if (request.mode === 'navigate') {
      return new Response(
        `<!doctype html><html lang="ko"><head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>오프라인 — 하자체크 AI</title>
          <style>
            body{font-family:system-ui,sans-serif;display:flex;align-items:center;
                 justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
            .box{text-align:center;padding:2rem;max-width:320px}
            h1{font-size:1.25rem;font-weight:700;color:#0f172a;margin-bottom:.5rem}
            p{color:#64748b;font-size:.875rem;line-height:1.6}
          </style>
        </head><body>
          <div class="box">
            <h1>오프라인입니다</h1>
            <p>인터넷에 연결되지 않았습니다.<br>
               점검 데이터는 기기에 저장되어 있으므로<br>
               Wi-Fi 연결 후 앱을 다시 열어 주세요.</p>
          </div>
        </body></html>`,
        {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    }

    return new Response('오프라인', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
