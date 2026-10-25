// 앱인토스 WebView SDK 3.x 설정(face-fate 선례: 2.x granite.config.ts 대신 이 파일).
// appName은 콘솔 등록(S3, 사용자) 뒤 콘솔 값과 같게 맞춘다. 산출물 = vite build의 dist/.
import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "haja-check",
  brand: {
    primaryColor: "#0F172A",
  },
  webView: {},
  permissions: [
    { name: "camera", access: "access" },
    { name: "photos", access: "read" },
  ],
  webBundleDir: "dist",
});
