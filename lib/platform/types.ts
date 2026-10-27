/** 플랫폼 어댑터(Next 웹 / 토스) 공통 결과. 실패 message는 화면에 그대로 보인다. */
export type PlatformResult = { ok: true } | { ok: false; message: string };

/** 사진 고르기 결과(토스 네이티브 카메라·앨범). 웹은 <input type="file">을 그대로 쓰므로 이 경로를 타지 않는다. */
export type PhotoPickResult = { ok: true; files: File[] } | { ok: false; message: string };
