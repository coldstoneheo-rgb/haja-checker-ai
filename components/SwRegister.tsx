"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // 백그라운드 업데이트 확인 (5분마다)
        setInterval(() => reg.update(), 5 * 60 * 1000);
      })
      .catch((err) => console.warn("[SW] 등록 실패:", err));
  }, []);

  return null;
}
