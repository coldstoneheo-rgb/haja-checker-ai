// 사진 촬영 — 토스 구현(스텁). 네이티브 카메라 경로 자리만 두고, 지금은 WebView <input type="file" capture>를 그대로 쓴다
// (true로 두면 스텁이 사진 기능을 막는다 — port-03 critic 결함 1). QR 10-29에서 input 동작을 실측한 뒤 SDK를 붙이고 true로.
// 시그니처는 lib/platform/camera.ts(Next 웹 구현)와 같다 — vite alias·tsconfig paths가 이 파일로 바꿔 끼운다.
import type { PhotoPickResult } from "@/lib/platform/types";

export const nativeCamera = false;

// TODO(QR-1029): @apps-in-toss/web-framework openCamera({ base64: true, maxWidth: 1024 }) / fetchAlbumPhotos
//   → ImageResponse{ id, dataUri } → File[] (addPhoto가 다운스케일). 권한 거부는 OpenCameraPermissionError.
export async function pickPhotos(): Promise<PhotoPickResult> {
  return { ok: false, message: "이 기능은 곧 지원됩니다." };
}
