/**
 * Canvas 기반 이미지 다운스케일/썸네일 생성.
 * iOS Safari + Android Chrome 모두에서 동작.
 *
 * 원본 사진은 IndexedDB 용량을 빨리 차오르게 하므로 1024px JPEG 0.85로 줄여
 * 저장한다. AI 분석 시에도 동일한 크기를 base64로 인코딩해서 전송하면 된다.
 */

export interface DownscaleResult {
  blob: Blob;
  width: number;
  height: number;
  fileSize: number;
}

interface DownscaleOptions {
  maxSize: number;
  mimeType?: string;
  quality?: number;
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("이미지 로드 실패"));
      image.src = url;
    });
    return img;
  } finally {
    // onload 후 즉시 revoke 하면 일부 브라우저에서 그리기 실패 → 다음 tick에서 해제
    queueMicrotask(() => URL.revokeObjectURL(url));
  }
}

function fitWithin(
  width: number,
  height: number,
  maxSize: number,
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  const ratio = width > height ? maxSize / width : maxSize / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function drawAndEncode(
  img: HTMLImageElement,
  width: number,
  height: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context 생성 실패");
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 인코딩 실패"));
      },
      mimeType,
      quality,
    );
  });
}

export async function downscaleImage(
  source: Blob | File,
  options: DownscaleOptions,
): Promise<DownscaleResult> {
  const mimeType = options.mimeType ?? "image/jpeg";
  const quality = options.quality ?? 0.85;
  const img = await blobToImage(source);
  const { width, height } = fitWithin(
    img.naturalWidth,
    img.naturalHeight,
    options.maxSize,
  );
  const blob = await drawAndEncode(img, width, height, mimeType, quality);
  return { blob, width, height, fileSize: blob.size };
}

export async function generateThumbnail(
  source: Blob,
  maxSize = 256,
): Promise<Blob> {
  const result = await downscaleImage(source, {
    maxSize,
    mimeType: "image/jpeg",
    quality: 0.7,
  });
  return result.blob;
}

/**
 * 사진 품질을 0–1 점수로 평가한다.
 * - 0.0–0.39: 재촬영 권장 (너무 어둡거나 해상도 부족)
 * - 0.4–0.69: 보통 (사용 가능하나 추가 촬영 권장)
 * - 0.7–1.0: 양호
 *
 * 32×32 샘플로 평균 밝기를 측정하고, 짧은 쪽 해상도도 함께 검사한다.
 */
export async function assessPhotoQuality(blob: Blob): Promise<number> {
  const img = await blobToImage(blob);

  const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
  if (shortSide < 150) return 0.15; // 극소형

  const SAMPLE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.7; // canvas 지원 없음이면 중립 점수

  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

  let totalLum = 0;
  const pixelCount = SAMPLE * SAMPLE;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 709 상대 밝기
    totalLum +=
      0.2126 * (data[i] / 255) +
      0.7152 * (data[i + 1] / 255) +
      0.0722 * (data[i + 2] / 255);
  }
  const avgLum = totalLum / pixelCount;

  if (avgLum < 0.07) return 0.15; // 거의 검정 — 렌즈 가림 또는 야간
  if (avgLum < 0.15) return 0.35; // 매우 어두움
  if (avgLum < 0.25) return 0.55; // 다소 어두움
  if (avgLum > 0.92) return 0.65; // 과노출 (흰색 세부 정보 손실)
  return 0.9; // 정상 범위
}
