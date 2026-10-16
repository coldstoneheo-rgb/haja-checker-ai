# S1 스파이크 재현용 설정 (레포 밖 `~/haja-spikes/` 정리 전 보존)

> 경로 표기: `~` = 사용자 홈. `<repo>` = 이 레포 체크아웃. 아래 파일만 있으면 ③·⑤·⑩·②를 다시 만들 수 있다.

## ③ Vite 이식 — `vite-port/`
설치: `npm i vite@7 @vitejs/plugin-react@^5 react@19 react-dom@19 dexie dexie-react-hooks tailwindcss@4 @tailwindcss/vite typescript` (plugin-react 6.x는 Vite 8 요구)

### `vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const REPO = "<repo>";
const shim = (p: string) => fileURLToPath(new URL(`./src/shims/${p}`, import.meta.url));

export default defineConfig({
  base: "./", // 정적 번들(토스 WebView) 가정: 상대 경로
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: shim("next-link.tsx") },
      { find: /^next\/navigation$/, replacement: shim("next-navigation.ts") },
      { find: /^@\//, replacement: REPO + "/" },
    ],
    // 레포 lib/* 가 레포 node_modules 의 dexie 를 잡지 않도록 단일 인스턴스 강제
    dedupe: ["dexie", "dexie-react-hooks", "react", "react-dom"],
  },
});
```

### `src/router.tsx`
```ts
// 최소 해시 라우터: #/sessions, #/sessions/:id. 정적 번들/WebView 가정(서버 rewrite 불필요).
import { useSyncExternalStore } from "react";

function getPath(): string {
  const h = window.location.hash.replace(/^#/, "");
  return h.startsWith("/") ? h : "/sessions";
}
function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, () => "/sessions");
}
export function navigate(to: string, replace = false) {
  const url = "#" + to;
  if (replace) window.location.replace(url);
  else window.location.hash = to;
}

export type Route =
  | { name: "sessions" }
  | { name: "session"; id: string }
  | { name: "notFound"; path: string };

export function matchRoute(path: string): Route {
  if (path === "/" || path === "/sessions") return { name: "sessions" };
  const m = path.match(/^\/sessions\/([^/]+)$/);
  if (m) return { name: "session", id: decodeURIComponent(m[1]) };
  return { name: "notFound", path };
}
```

### `src/shims/next-link.tsx`
```ts
// next/link 대체 shim: href 를 해시 링크로 변환. 레포 컴포넌트를 무수정으로 import 하기 위함.
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

export default function Link({ href, prefetch: _p, replace: _r, scroll: _s, ...rest }: Props) {
  const to = href.startsWith("/") ? "#" + href : href;
  return <a href={to} {...rest} />;
}
```

### `src/shims/next-navigation.ts`
```ts
// next/navigation 대체 shim (useRouter / useParams 최소 구현)
import { navigate, usePath } from "../router";

export function useRouter() {
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to, true),
    back: () => window.history.back(),
    // Dexie useLiveQuery 가 반응형이므로 refresh 는 no-op 으로 충분
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname(): string {
  return usePath();
}

export function useParams<T extends Record<string, string>>(): T {
  const path = usePath();
  const m = path.match(/^\/sessions\/([^/]+)(?:\/defects\/([^/]+))?/);
  const out: Record<string, string> = {};
  if (m?.[1]) out.sessionId = decodeURIComponent(m[1]);
  if (m?.[2]) out.defectId = decodeURIComponent(m[2]);
  return out as T;
}
```

## ② ait build — `ait-next/`
`npm i @apps-in-toss/web-framework@3.4.0` → Next export `out/` 복사 → `npx ait build` (업로드 금지)
```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'haja-check-spike',
  brand: { primaryColor: '#2563EB' },
  webView: {},
  permissions: [{ name: 'camera', access: 'access' }],
  webBundleDir: 'out',
});
```

## ⑤ PNG — `share-png/`
`npm i html-to-image@1.11.13 esbuild@0.25.10` → `npx esbuild entry.js --bundle --minify --format=esm --outfile=out.js` → export `out/__topng.js`로 복사 → 보고서 화면에서 `await import('/__topng.js'); await window.__toPng(document.querySelector('main'), {pixelRatio: 2, backgroundColor: '#ffffff'})`
```js
import { toPng } from 'html-to-image';
window.__toPng = toPng;
```

## ⑩ CORS 재현
```bash
# <repo>에서 npm run build 뒤 (Gemini 0)
AI_ANALYZER=mock GEMINI_API_KEY= npx next start -p 3100 -H 127.0.0.1
# 같은 출처 → 200 (Mock 페이로드)
curl -s -X POST http://127.0.0.1:3100/api/analyze -H 'Content-Type: application/json' -d '{"areaName":"현관","takenAtIso":"2026-10-17T00:00:00Z","photos":[{"mimeType":"image/jpeg","base64":"/9j/4AAQ"}]}'
# 프리플라이트 → 204, Access-Control-Allow-Origin 없음
curl -s -i -X OPTIONS http://127.0.0.1:3100/api/analyze -H 'Origin: http://127.0.0.1:8731' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'
# 브라우저: export out/을 python -m http.server 8731 로 띄운 페이지에서 fetch('http://127.0.0.1:3100/api/analyze', {method:'POST', ...}) → TypeError: Failed to fetch
```

## ① Next export
`git apply S1-next-export-query-routing.patch`(origin/main a320218~35319b5 기준, `git apply --check` OK) → `next.config.ts`에 `output: "export"`·`trailingSlash: true` 포함 → `npx next build` → `out/` → `cd out && python -m http.server 8731 --bind 127.0.0.1`
