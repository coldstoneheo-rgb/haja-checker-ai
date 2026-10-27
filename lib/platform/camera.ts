// 사진 촬영 — Next 웹 구현. 웹은 PhotoCaptureButton의 <input type="file" capture>를 그대로 쓴다(기존 동작).
// 토스 빌드는 vite alias로 toss/src/platform/camera.ts(스텁)를 대신 쓴다.
import type { PhotoPickResult } from "@/lib/platform/types";

/** true면 PhotoCaptureButton이 <input type="file"> 대신 pickPhotos() 버튼을 그린다. */
export const nativeCamera = false;

export async function pickPhotos(): Promise<PhotoPickResult> {
  return { ok: false, message: "이 환경에서는 파일 선택을 사용합니다." };
}
