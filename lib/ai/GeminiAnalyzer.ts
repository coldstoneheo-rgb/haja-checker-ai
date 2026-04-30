import { ANALYZER_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompts";
import {
  AiAnalyzerError,
  type AiAnalyzeInput,
  type AiAnalysisPayload,
  type AiAnalyzer,
} from "@/lib/ai/types";

/**
 * Gemini REST 응답 스키마 (subset).
 * Vision API는 multimodal 입력(텍스트 + inlineData 이미지)을 받는다.
 */
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "isSuspectedDefect",
    "defectType",
    "evidenceSummary",
    "suspectedCause",
    "riskScore",
    "riskLevel",
    "repairDifficultyScore",
    "repairDifficulty",
    "confidence",
    "additionalCheckRequired",
    "recommendedAdditionalPhotos",
    "contractorRequestText",
    "caution",
  ],
  properties: {
    isSuspectedDefect: { type: "BOOLEAN" },
    defectType: {
      type: "STRING",
      enum: [
        "CRACK",
        "LEAK",
        "WATER_STAIN",
        "ELECTRICAL_ISSUE",
        "GAS_SAFETY",
        "WINDOW_DOOR_ISSUE",
        "TILE_DAMAGE",
        "FLOORING_ISSUE",
        "WALLPAPER_PAINT_ISSUE",
        "SILICONE_SEALING_ISSUE",
        "DRAINAGE_ISSUE",
        "LEVEL_SLOPE_ISSUE",
        "CABINET_FURNITURE_ISSUE",
        "SANITARY_FIXTURE_ISSUE",
        "VENTILATION_ISSUE",
        "FINISHING_ISSUE",
        "MISSING_WORK",
        "CONTAMINATION",
        "DAMAGE",
        "NOISE_OR_OPERATION",
        "OTHER",
      ],
    },
    evidenceSummary: { type: "STRING" },
    suspectedCause: { type: "STRING" },
    riskScore: { type: "INTEGER", minimum: 0, maximum: 22 },
    riskLevel: {
      type: "STRING",
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    },
    repairDifficultyScore: { type: "INTEGER", minimum: 0, maximum: 12 },
    repairDifficulty: {
      type: "STRING",
      enum: [
        "SIMPLE",
        "MODERATE",
        "HARD",
        "PROFESSIONAL_REQUIRED",
        "UNKNOWN",
      ],
    },
    confidence: { type: "NUMBER", minimum: 0, maximum: 1 },
    additionalCheckRequired: { type: "BOOLEAN" },
    recommendedAdditionalPhotos: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    contractorRequestText: { type: "STRING" },
    caution: { type: "STRING" },
  },
};

interface GeminiAnalyzerOptions {
  apiKey: string;
  model?: string;
}

interface GeminiContentPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiCandidate {
  content?: { parts?: GeminiContentPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Gemini 3 Flash Preview 기반 하자 의심 분석기.
 * 서버 측에서만 인스턴스화. API 키는 절대 클라이언트로 노출 금지.
 *
 * 호출 예 (D-7 Route Handler):
 *   const analyzer = new GeminiAnalyzer({ apiKey: process.env.GEMINI_API_KEY! });
 *   const result = await analyzer.analyze(input, request.signal);
 */
export class GeminiAnalyzer implements AiAnalyzer {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: GeminiAnalyzerOptions) {
    if (!options.apiKey) {
      throw new AiAnalyzerError("GEMINI_API_KEY is required");
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? "gemini-3-flash-preview";
  }

  async analyze(
    input: AiAnalyzeInput,
    signal?: AbortSignal,
  ): Promise<AiAnalysisPayload> {
    if (input.photos.length === 0) {
      throw new AiAnalyzerError("at least one photo is required");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;

    const parts: GeminiContentPart[] = [
      { text: buildUserPrompt(input) },
      ...input.photos.map<GeminiContentPart>((photo) => ({
        inlineData: { mimeType: photo.mimeType, data: photo.base64 },
      })),
    ];

    const body = {
      systemInstruction: { parts: [{ text: ANALYZER_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      ],
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      throw new AiAnalyzerError("Gemini network error", cause);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AiAnalyzerError(
        `Gemini ${response.status} ${response.statusText}: ${detail.slice(0, 500)}`,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason) {
      throw new AiAnalyzerError(
        `Gemini blocked the request: ${data.promptFeedback.blockReason}`,
      );
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) {
      throw new AiAnalyzerError("Gemini returned empty content");
    }

    let parsed: AiAnalysisPayload;
    try {
      parsed = JSON.parse(text) as AiAnalysisPayload;
    } catch (cause) {
      throw new AiAnalyzerError(
        `Gemini response was not valid JSON: ${text.slice(0, 200)}`,
        cause,
      );
    }
    return parsed;
  }
}
