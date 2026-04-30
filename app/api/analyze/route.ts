import type { NextRequest } from "next/server";
import { createAnalyzer } from "@/lib/ai";
import type { AiAnalyzeInput } from "@/lib/ai/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: AiAnalyzeInput;
  try {
    body = (await request.json()) as AiAnalyzeInput;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.photos || body.photos.length === 0) {
    return Response.json({ error: "photos required" }, { status: 400 });
  }

  if (!body.areaName) {
    return Response.json({ error: "areaName required" }, { status: 400 });
  }

  try {
    const analyzer = createAnalyzer();
    const result = await analyzer.analyze(body, request.signal);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/analyze]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
