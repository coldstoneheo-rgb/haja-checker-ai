import { GeminiAnalyzer } from "@/lib/ai/GeminiAnalyzer";
import { MockAnalyzer } from "@/lib/ai/MockAnalyzer";
import { AiAnalyzerError, type AiAnalyzer } from "@/lib/ai/types";

export type AnalyzerKind = "gemini" | "mock";

/**
 * 환경변수로 분석기를 선택해 인스턴스화한다.
 * - AI_ANALYZER=mock 이면 항상 Mock.
 * - 기본은 gemini. GEMINI_API_KEY 가 비어 있으면 Mock으로 폴백.
 *
 * 서버 라우트에서만 호출할 것 (apiKey 가 클라이언트로 새지 않도록).
 */
export function createAnalyzer(): AiAnalyzer {
  const kind = (process.env.AI_ANALYZER ?? "gemini") as AnalyzerKind;
  if (kind === "mock") {
    return new MockAnalyzer();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new AiAnalyzerError(
        "GEMINI_API_KEY is not set in production environment",
      );
    }
    console.warn(
      "[ai] GEMINI_API_KEY missing — falling back to MockAnalyzer (dev only)",
    );
    return new MockAnalyzer();
  }

  return new GeminiAnalyzer({
    apiKey,
    model: process.env.GEMINI_VISION_MODEL,
  });
}

export { MockAnalyzer } from "@/lib/ai/MockAnalyzer";
export { GeminiAnalyzer } from "@/lib/ai/GeminiAnalyzer";
export type {
  AiAnalyzer,
  AiAnalyzeInput,
  AiAnalysisPayload,
  AiPhotoInput,
} from "@/lib/ai/types";
export { AiAnalyzerError } from "@/lib/ai/types";
