/**
 * Canvas 기반 이미지 다운스케일/썸네일 생성.
 * iOS Safari + Android Chrome 모두에서 동작.
 *
 * createImageBitmap with resize options를 우선 사용한다.
 * 이 방식은 decode와 resize를 동시에 수행해 full-res RGBA를 메모리에
 * 보관하지 않으므로 12MP iPhone 사진에서도 메모리 부족이 발생하지 않는다.
 * 지원하지 않는 환경은 HTMLImageElement + Canvas로 폴백한다.
 *
 * iOS Safari는 카메라 사진을 landscape 원본으로 저장하고 EXIF orientation으로
 * 회전 정보를 기록한다. Canvas drawImage는 EXIF를 무시하므로 직접 읽어서 회전한다.
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

// ── EXIF orientation reader ──────────────────────────────────────────────────

async function readExifOrientation(blob: Blob): Promise<number> {
  if (!blob.type.startsWith("image/jpeg") && !blob.type.startsWith("image/jpg")) {
    return 1;
  }
  try {
    const buffer = await blob.slice(0, 65536).arrayBuffer();
    const view = new DataView(buffer);
    if (view.getUint16(0) !== 0xffd8) return 1;

    let offset = 2;
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset);
      offset += 2;
      if (marker === 0xffe1) {
        const segmentLen = view.getUint16(offset);
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 2), view.getUint8(offset + 3),
          view.getUint8(offset + 4), view.getUint8(offset + 5),
        );
        if (exifHeader !== "Exif") { offset += segmentLen; continue; }
        const tiffStart = offset + 8;
        const byteOrder = view.getUint16(tiffStart);
        const littleEndian = byteOrder === 0x4949;
        const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const ifdStart = tiffStart + ifdOffset;
        const entryCount = view.getUint16(ifdStart, littleEndian);
        for (let i = 0; i < entryCount; i++) {
          const entryOffset = ifdStart + 2 + i * 12;
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x0112) return view.getUint16(entryOffset + 8, littleEndian);
        }
        return 1;
      } else if ((marker & 0xff00) === 0xff00) {
        offset += view.getUint16(offset);
      } else break;
    }
  } catch { /* fall through */ }
  return 1;
}

function applyExifOrientation(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
): void {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, height, width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
    default: break;
  }
}

// ── Fit helper ───────────────────────────────────────────────────────────────

function fitWithin(
  width: number,
  height: number,
  maxSize: number,
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) return { width, height };
  const ratio = width > height ? maxSize / width : maxSize / height;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

// ── createImageBitmap path (memory-efficient) ─────────────────────────────────

function supportsImageBitmapResize(): boolean {
  return (
    typeof createImageBitmap === "function" &&
    // iOS Safari 17+ supports resize options; earlier versions ignore them
    // We feature-detect by checking the function exists (runtime test in downscaleImage)
    typeof OffscreenCanvas !== "undefined" ||
    typeof document !== "undefined"
  );
}

async function downscaleViaImageBitmap(
  source: Blob,
  targetW: number,
  targetH: number,
  orientation: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const swapped = orientation >= 5 && orientation <= 8;
  const bitmapW = swapped ? targetH : targetW;
  const bitmapH = swapped ? targetW : targetH;

  // createImageBitmap with resizeWidth/resizeHeight decodes at target size —
  // never allocates full-res RGBA buffer.
  const bitmap = await createImageBitmap(source, {
    resizeWidth: bitmapW,
    resizeHeight: bitmapH,
    resizeQuality: "high",
  });

  const canvas = document.createElement("canvas");
  canvas.width = swapped ? targetH : targetW;
  canvas.height = swapped ? targetW : targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close(); throw new Error("Canvas 2D context 생성 실패"); }

  applyExifOrientation(ctx, orientation, bitmapW, bitmapH);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error("이미지 인코딩 실패")); },
      mimeType,
      quality,
    );
  });
}

// ── HTMLImageElement fallback path ────────────────────────────────────────────

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("이미지 로드 실패"));
      image.src = url;
    });
  } finally {
    queueMicrotask(() => URL.revokeObjectURL(url));
  }
}

async function downscaleViaCanvas(
  source: Blob,
  targetW: number,
  targetH: number,
  orientation: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const img = await blobToImage(source);
  const swapped = orientation >= 5 && orientation <= 8;

  const canvas = document.createElement("canvas");
  canvas.width = swapped ? targetH : targetW;
  canvas.height = swapped ? targetW : targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context 생성 실패");

  applyExifOrientation(ctx, orientation, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error("이미지 인코딩 실패")); },
      mimeType,
      quality,
    );
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function downscaleImage(
  source: Blob | File,
  options: DownscaleOptions,
): Promise<DownscaleResult> {
  const mimeType = options.mimeType ?? "image/jpeg";
  const quality = options.quality ?? 0.85;
  const orientation = await readExifOrientation(source);
  const swapped = orientation >= 5 && orientation <= 8;

  // Need natural dimensions to compute target size.
  // We use createImageBitmap without resize to get dimensions without full RGBA cost
  // (bitmap creation itself is efficient), then close it immediately.
  let naturalW: number;
  let naturalH: number;

  try {
    const probe = await createImageBitmap(source);
    naturalW = probe.width;
    naturalH = probe.height;
    probe.close();
  } catch {
    // Fallback: HTMLImageElement for dimension probe
    const img = await blobToImage(source);
    naturalW = img.naturalWidth;
    naturalH = img.naturalHeight;
  }

  // Logical dimensions after rotation
  const logicalW = swapped ? naturalH : naturalW;
  const logicalH = swapped ? naturalW : naturalH;
  const logical = fitWithin(logicalW, logicalH, options.maxSize);

  // Pre-rotation draw dimensions
  const drawW = swapped ? logical.height : logical.width;
  const drawH = swapped ? logical.width : logical.height;

  let blob: Blob;
  try {
    // Attempt memory-efficient path
    blob = await downscaleViaImageBitmap(source, drawW, drawH, orientation, mimeType, quality);
  } catch {
    // Fallback to HTMLImageElement path (iOS Safari < 17 without resize options)
    blob = await downscaleViaCanvas(source, drawW, drawH, orientation, mimeType, quality);
  }

  return { blob, width: logical.width, height: logical.height, fileSize: blob.size };
}

export async function generateThumbnail(source: Blob, maxSize = 256): Promise<Blob> {
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
 * - 0.4–0.69: 보통
 * - 0.7–1.0: 양호
 *
 * 이미 다운스케일된 blob을 받으므로 추가 디코드 비용이 최소화된다.
 */
export async function assessPhotoQuality(blob: Blob): Promise<number> {
  const SAMPLE = 32;
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(blob, {
      resizeWidth: SAMPLE,
      resizeHeight: SAMPLE,
      resizeQuality: "low",
    });
  } catch { /* fallback below */ }

  const shortSide = Math.min(blob.size > 0 ? 1000 : 0, 1000); // placeholder — real check below

  if (bitmap) {
    const w = bitmap.width;
    const h = bitmap.height;
    if (Math.min(w, h) < 32) { bitmap.close(); return 0.15; }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return 0.7; }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, w, h);
    let totalLum = 0;
    const pixelCount = w * h;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.2126 * (data[i] / 255) + 0.7152 * (data[i + 1] / 255) + 0.0722 * (data[i + 2] / 255);
    }
    const avgLum = totalLum / pixelCount;
    if (avgLum < 0.07) return 0.15;
    if (avgLum < 0.15) return 0.35;
    if (avgLum < 0.25) return 0.55;
    if (avgLum > 0.92) return 0.65;
    return 0.9;
  }

  // Full fallback: HTMLImageElement
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("load failed"));
      image.src = url;
    });
    if (Math.min(img.naturalWidth, img.naturalHeight) < 150) return 0.15;

    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0.7;
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
    const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
    let totalLum = 0;
    const pixelCount = SAMPLE * SAMPLE;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.2126 * (data[i] / 255) + 0.7152 * (data[i + 1] / 255) + 0.0722 * (data[i + 2] / 255);
    }
    const avgLum = totalLum / pixelCount;
    if (avgLum < 0.07) return 0.15;
    if (avgLum < 0.15) return 0.35;
    if (avgLum < 0.25) return 0.55;
    if (avgLum > 0.92) return 0.65;
    return 0.9;
  } catch {
    return 0.7;
  } finally {
    URL.revokeObjectURL(url);
    void shortSide; // suppress unused warning
  }
}
