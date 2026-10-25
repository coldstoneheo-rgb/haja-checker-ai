import type { NextRequest } from "next/server";
import { createAnalyzer } from "@/lib/ai";
import {
  validateAnalyzeInput,
  validateAnalysisPayload,
} from "@/lib/ai/validation";
import { MemoryUsageStore, consumeAnalysis } from "@/lib/ai/usageLimit";

export const maxDuration = 60;

// 상한 카운터: 지금은 함수 인스턴스 메모리(인스턴스마다 따로 셈 — 느슨한 상한). KV 어댑터는 S3.
const usageStore = new MemoryUsageStore();
const costPerCallUsd = Number(process.env.AI_COST_PER_CALL_USD) || undefined;

/** 토스 식별키(익명 키)가 붙기 전에는 접속 주소로 센다. */
function userKeyOf(request: NextRequest): string {
  const anon = request.headers.get("x-haja-user");
  if (anon && /^[A-Za-z0-9_-]{8,128}$/.test(anon)) return "anon:" + anon;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return "ip:" + (ip || "unknown");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "올바른 JSON 형식이 아닙니다." }, { status: 400 });
  }

  const inputError = validateAnalyzeInput(body);
  if (inputError) {
    return Response.json(
      { error: inputError.message, field: inputError.field },
      { status: 400 },
    );
  }

  const decision = await consumeAnalysis({
    store: usageStore,
    userKey: userKeyOf(request),
    costPerCallUsd,
  });
  if (!decision.allowed) {
    const message =
      decision.reason === "MONTHLY_BUDGET"
        ? "이번 달 AI 분석 제공량이 모두 소진되었습니다. 다음 달에 다시 이용해 주세요."
        : "오늘 AI 분석 횟수를 모두 사용했습니다.";
    return Response.json(
      { error: message, reason: decision.reason, canReward: decision.canReward },
      { status: 429 },
    );
  }

  // Merge 30 s hard timeout with the request's own abort signal
  const timeoutSignal = AbortSignal.timeout(30_000);
  const signal = AbortSignal.any
    ? AbortSignal.any([request.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const analyzer = createAnalyzer();
    // body validated above; cast is safe
    const result = await analyzer.analyze(body as Parameters<typeof analyzer.analyze>[0], signal);

    const payloadError = validateAnalysisPayload(result);
    if (payloadError) {
      console.error("[api/analyze] 응답 스키마 오류:", payloadError);
      return Response.json(
        { error: "AI 분석 결과를 처리할 수 없습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    return Response.json(result);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");

    if (isTimeout) {
      return Response.json(
        { error: "분석 시간이 초과되었습니다 (30초). 사진 수를 줄이거나 잠시 후 다시 시도해 주세요." },
        { status: 504 },
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/analyze]", message);
    return Response.json(
      { error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
