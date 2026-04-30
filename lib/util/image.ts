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
