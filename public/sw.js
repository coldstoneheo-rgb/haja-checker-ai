// 하자체크 AI — Service Worker (자폭 버전, HO-2026-1026-haja-s2-port-03 PR B)
// 웹 화면을 내린 뒤(#19) 이미 설치된 SW가 옛 화면 캐시를 계속 내주지 않도록, 이 파일은 스스로를 지운다.
//   설치 즉시 활성화 → 캐시 전부 삭제 → 등록 해제 → 열린 창을 한 번 다시 연다(이제 SW 없이 네트워크로).
// 다시 등록하는 코드(SwRegister)는 #19에서 지웠으므로 다시 여는 것은 1회로 끝난다.
// /sw.js는 vercel.json에서 must-revalidate라 다음 방문의 업데이트 확인 때 이 버전이 깔린다.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => undefined)));
    })(),
  );
});
