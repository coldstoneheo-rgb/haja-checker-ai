import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// QR 런북 D2: 웹 디버그 툴즈 Log 탭에서 실기기 WebView 출처를 읽는다(서버 CORS 허용 목록과 대조 — lib/ai/cors.ts).
console.info("[haja] origin", window.location.origin);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
