/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 분석 API를 둔 배포 주소(https, 끝 경로 없이). 비면 토스 번들의 AI 분석은 «서버 주소 미설정»으로 실패한다. */
  readonly VITE_HAJA_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
