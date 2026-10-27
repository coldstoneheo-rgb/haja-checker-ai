"use client";

import { getDB } from "@/lib/db/db";
import { newId, newDefectDisplayId, computeNextDefectSequence } from "@/lib/db/id";
import type { AiAnalysisPayload } from "@/lib/ai/types";
import type { AiAnalysisResult, DefectCandidate, InspectionMode } from "@/lib/domain/types";
import { isAiEnabled, sessionMode } from "@/lib/seed/modes";
// 플랫폼 어댑터: Next 웹 = null(헤더 없음) · 토스 = 익명 식별키 자리(TODO(QR-1029), toss/src/platform/identity.ts)
import { getAnonymousKey } from "@/lib/platform/identity";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

async function callAnalyzeApi(
  input: {
    areaName: string;
    detailLocation?: string;
    checklistTitle?: string;
    checklistDescription?: string;
    userMemo?: string;
    takenAtIso: string;
    photos: Array<{ mimeType: string; base64: string }>;
    mode: InspectionMode;
  },
  signal?: AbortSignal,
): Promise<AiAnalysisPayload> {
  // 상한 카운터 키 자리 — 서버는 아직 이 헤더를 믿지 않는다(app/api/analyze/route.ts userKeyOf, KV는 S3).
  const anonKey = await getAnonymousKey();
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(anonKey ? { "x-haja-anon-key": anonKey } : {}) },
    body: JSON.stringify(input),
    signal,
  });
  const data = (await response.json()) as AiAnalysisPayload & {
    error?: string;
    reason?: string;
    canReward?: boolean;
  };
  if (!response.ok) {
    // reason·canReward = 상한(429) 응답만 담는다(lib/ai/limitError.ts가 읽음)
    throw Object.assign(new Error((data as { error?: string }).error ?? `HTTP ${response.status}`), {
      status: response.status,
      reason: data.reason,
      canReward: data.canReward,
    });
  }
  return data;
}


/** 입주·퇴거 모드(v1)는 AI 분석을 끈다 — 화면(분석·하자 상세)이 버튼을 숨기고, 저장소에서 한 번 더 막는다.
 * 세션을 못 찾으면 신축으로 보고 통과시킨다(기존 흐름 유지). 서버도 payload mode로 한 번 더 거부한다. */
async function assertAiEnabled(sessionId: string): Promise<InspectionMode> {
  const session = await getDB().sessions.get(sessionId);
  const mode = session ? sessionMode(session) : "NEW_BUILD";
  if (!isAiEnabled(mode)) {
    throw new Error("이 점검 모드에서는 AI 분석을 사용하지 않습니다.");
  }
  return mode;
}

/** Analyze a checklist item (SUSPECTED/DEFECT). Creates or updates a linked DefectCandidate. */
export async function analyzeChecklistItem(
  itemId: string,
  signal?: AbortSignal,
): Promise<{ defect: DefectCandidate; analysis: AiAnalysisResult }> {
  const db = getDB();

  const [item, photos] = await Promise.all([
    db.checklistItems.get(itemId),
    db.photos.where("checklistItemId").equals(itemId).toArray(),
  ]);
  if (!item) throw new Error(`체크리스트 항목을 찾을 수 없습니다 (${itemId})`);
  const mode = await assertAiEnabled(item.sessionId);
  if (photos.length === 0)
    throw new Error("사진이 없습니다. 먼저 사진을 촬영해 주세요.");

  const area = await db.areas.get(item.areaId);
  const areaName = area?.name ?? item.areaId;

  const photoInputs = await Promise.all(
    photos.map(async (p) => ({
      mimeType: "image/jpeg",
      base64: await blobToBase64(p.blob),
    })),
  );

  const payload = await callAnalyzeApi(
    {
      areaName,
      checklistTitle: item.title,
      checklistDescription: item.description,
      userMemo: item.userMemo,
      takenAtIso: new Date(photos[0].takenAt).toISOString(),
      photos: photoInputs,
      mode,
    },
    signal,
  );

  let defect!: DefectCandidate;
  let analysis!: AiAnalysisResult;

  await db.transaction("rw", [db.defects, db.analyses], async () => {
    const now = Date.now();

    // Find existing linked defect or create one
    const existingDefects = await db.defects
      .where("sessionId")
      .equals(item.sessionId)
      .toArray();
    let linked = existingDefects.find((d) => d.checklistItemId === itemId);

    if (!linked) {
      const sequence = computeNextDefectSequence(existingDefects.map((d) => d.displayId));
      linked = {
        id: newId(),
        displayId: newDefectDisplayId(sequence),
        sessionId: item.sessionId,
        checklistItemId: itemId,
        areaName,
        defectType: payload.defectType,
        userMemo: item.userMemo,
        aiSummary: payload.evidenceSummary,
        suspectedCause: payload.suspectedCause,
        riskLevel: payload.riskLevel,
        riskScore: payload.riskScore,
        repairDifficulty: payload.repairDifficulty,
        repairDifficultyScore: payload.repairDifficultyScore,
        confidence: payload.confidence,
        requestedAction: payload.contractorRequestText,
        additionalCheckRequired: payload.additionalCheckRequired,
        status: "ANALYZED",
        createdAt: now,
        updatedAt: now,
      };
      await db.defects.add(linked);
    } else {
      const patch: Partial<DefectCandidate> = {
        defectType: payload.defectType,
        aiSummary: payload.evidenceSummary,
        suspectedCause: payload.suspectedCause,
        riskLevel: payload.riskLevel,
        riskScore: payload.riskScore,
        repairDifficulty: payload.repairDifficulty,
        repairDifficultyScore: payload.repairDifficultyScore,
        confidence: payload.confidence,
        requestedAction: payload.contractorRequestText,
        additionalCheckRequired: payload.additionalCheckRequired,
        status: "ANALYZED",
        updatedAt: now,
      };
      await db.defects.update(linked.id, patch);
      linked = { ...linked, ...patch };
    }

    defect = linked;

    // 1 defect = 1 analysis policy: delete existing analyses before inserting new
    await db.analyses
      .where("defectCandidateId")
      .equals(defect.id)
      .delete();

    const analysisRecord: AiAnalysisResult = {
      id: newId(),
      defectCandidateId: defect.id,
      isSuspectedDefect: payload.isSuspectedDefect,
      defectType: payload.defectType,
      evidenceSummary: payload.evidenceSummary,
      suspectedCause: payload.suspectedCause,
      riskScore: payload.riskScore,
      riskLevel: payload.riskLevel,
      repairDifficultyScore: payload.repairDifficultyScore,
      repairDifficulty: payload.repairDifficulty,
      confidence: payload.confidence,
      additionalCheckRequired: payload.additionalCheckRequired,
      recommendedAdditionalPhotos: payload.recommendedAdditionalPhotos,
      contractorRequestText: payload.contractorRequestText,
      caution: payload.caution,
      createdAt: now,
    };
    await db.analyses.add(analysisRecord);
    analysis = analysisRecord;
  });

  return { defect, analysis };
}

/** Analyze a directly-added defect (DefectCandidate already exists). */
export async function analyzeDirectDefect(
  defectId: string,
  signal?: AbortSignal,
): Promise<AiAnalysisResult> {
  const db = getDB();

  const [defect, photos] = await Promise.all([
    db.defects.get(defectId),
    db.photos.where("defectCandidateId").equals(defectId).toArray(),
  ]);
  if (!defect) throw new Error(`하자를 찾을 수 없습니다 (${defectId})`);
  const mode = await assertAiEnabled(defect.sessionId);

  // Direct defects may have no photos — still try with text-only context
  const photoInputs = await Promise.all(
    photos.map(async (p) => ({
      mimeType: "image/jpeg",
      base64: await blobToBase64(p.blob),
    })),
  );

  if (photoInputs.length === 0)
    throw new Error("사진이 없습니다. 먼저 사진을 촬영해 주세요.");

  const payload = await callAnalyzeApi(
    {
      areaName: defect.areaName,
      detailLocation: defect.detailLocation,
      userMemo: defect.userMemo,
      takenAtIso: new Date(photos[0].takenAt).toISOString(),
      photos: photoInputs,
      mode,
    },
    signal,
  );

  let analysis!: AiAnalysisResult;

  await db.transaction("rw", [db.defects, db.analyses], async () => {
    const now = Date.now();
    const patch: Partial<DefectCandidate> = {
      defectType: payload.defectType,
      aiSummary: payload.evidenceSummary,
      suspectedCause: payload.suspectedCause,
      riskLevel: payload.riskLevel,
      riskScore: payload.riskScore,
      repairDifficulty: payload.repairDifficulty,
      repairDifficultyScore: payload.repairDifficultyScore,
      confidence: payload.confidence,
      requestedAction: payload.contractorRequestText,
      additionalCheckRequired: payload.additionalCheckRequired,
      status: "ANALYZED",
      updatedAt: now,
    };
    await db.defects.update(defectId, patch);

    // 1 defect = 1 analysis policy: delete existing analyses before inserting new
    await db.analyses
      .where("defectCandidateId")
      .equals(defectId)
      .delete();

    const analysisRecord: AiAnalysisResult = {
      id: newId(),
      defectCandidateId: defectId,
      isSuspectedDefect: payload.isSuspectedDefect,
      defectType: payload.defectType,
      evidenceSummary: payload.evidenceSummary,
      suspectedCause: payload.suspectedCause,
      riskScore: payload.riskScore,
      riskLevel: payload.riskLevel,
      repairDifficultyScore: payload.repairDifficultyScore,
      repairDifficulty: payload.repairDifficulty,
      confidence: payload.confidence,
      additionalCheckRequired: payload.additionalCheckRequired,
      recommendedAdditionalPhotos: payload.recommendedAdditionalPhotos,
      contractorRequestText: payload.contractorRequestText,
      caution: payload.caution,
      createdAt: now,
    };
    await db.analyses.add(analysisRecord);
    analysis = analysisRecord;
  });

  return analysis;
}

export interface ChecklistAnalyzable {
  itemId: string;
  areaName: string;
  title: string;
  photoCount: number;
  defect?: DefectCandidate;
  analysis?: AiAnalysisResult;
}

export interface DirectAnalyzable {
  defect: DefectCandidate;
  photoCount: number;
  analysis?: AiAnalysisResult;
}

export interface AnalysisPageData {
  checklist: ChecklistAnalyzable[];
  direct: DirectAnalyzable[];
}

export async function loadAnalysisPageData(
  sessionId: string,
): Promise<AnalysisPageData> {
  const db = getDB();

  const [items, areas, allDefects, allPhotos, allAnalyses] = await Promise.all([
    db.checklistItems
      .where("sessionId")
      .equals(sessionId)
      .filter((i) => i.status === "SUSPECTED" || i.status === "DEFECT")
      .toArray(),
    db.areas.where("sessionId").equals(sessionId).toArray(),
    db.defects.where("sessionId").equals(sessionId).toArray(),
    db.photos.where("sessionId").equals(sessionId).toArray(),
    db.analyses.toArray(),
  ]);

  const areaMap = new Map(areas.map((a) => [a.id, a.name]));

  // Map defects keyed by checklistItemId and by defect.id
  const defectByItem = new Map<string, DefectCandidate>();
  const defectById = new Map<string, DefectCandidate>();
  for (const d of allDefects) {
    defectById.set(d.id, d);
    if (d.checklistItemId) defectByItem.set(d.checklistItemId, d);
  }

  // Map latest analysis keyed by defectCandidateId
  const latestAnalysis = new Map<string, AiAnalysisResult>();
  for (const a of allAnalyses.sort((x, y) => x.createdAt - y.createdAt)) {
    latestAnalysis.set(a.defectCandidateId, a);
  }

  // Photo counts
  const photosByItem = new Map<string, number>();
  const photosByDefect = new Map<string, number>();
  for (const p of allPhotos) {
    if (p.checklistItemId) {
      photosByItem.set(p.checklistItemId, (photosByItem.get(p.checklistItemId) ?? 0) + 1);
    }
    if (p.defectCandidateId) {
      photosByDefect.set(p.defectCandidateId, (photosByDefect.get(p.defectCandidateId) ?? 0) + 1);
    }
  }

  const checklist: ChecklistAnalyzable[] = items
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const defect = defectByItem.get(item.id);
      return {
        itemId: item.id,
        areaName: areaMap.get(item.areaId) ?? "",
        title: item.title,
        photoCount: photosByItem.get(item.id) ?? 0,
        defect,
        analysis: defect ? latestAnalysis.get(defect.id) : undefined,
      };
    });

  // Direct defects: not linked to a checklist item
  const direct: DirectAnalyzable[] = allDefects
    .filter((d) => !d.checklistItemId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((defect) => ({
      defect,
      photoCount: photosByDefect.get(defect.id) ?? 0,
      analysis: latestAnalysis.get(defect.id),
    }));

  return { checklist, direct };
}
