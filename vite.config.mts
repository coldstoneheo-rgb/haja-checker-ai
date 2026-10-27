// 토스 미니앱 번들(Vite). 전환기에는 Next(app/)와 공존하며, 같은 lib/·app/ 원본을 import한다.
// 산출물 dist/ → apps-in-toss.config.ts의 webBundleDir → `ait build`.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here("./toss"),
  base: "./", // 정적 번들(토스 WebView): 상대 경로
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: here("./toss/src/shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: here("./toss/src/shims/next-navigation.ts") },
      // 플랫폼 어댑터: 공유 화면이 쓰는 Next 웹 구현(lib/platform)을 토스 구현으로 바꿔 끼운다 — @/ 보다 먼저
      { find: /^@\/lib\/platform\/reportActions$/, replacement: here("./toss/src/platform/reportActions.ts") },
      { find: /^@\/lib\/platform\/camera$/, replacement: here("./toss/src/platform/camera.ts") },
      { find: /^@\/lib\/platform\/ads$/, replacement: here("./toss/src/platform/ads.ts") },
      { find: /^@\/lib\/platform\/identity$/, replacement: here("./toss/src/platform/identity.ts") },
      { find: /^@\//, replacement: here("./") },
    ],
    // Dexie 인스턴스가 둘이 되면 useLiveQuery 반응성이 깨진다(S1 ③ 실측) — 한 벌 강제
    dedupe: ["dexie", "dexie-react-hooks", "react", "react-dom"],
  },
  build: {
    outDir: here("./dist"),
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
});
