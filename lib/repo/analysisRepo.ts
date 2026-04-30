"use client";

import { getDB } from "@/lib/db/db";
import { newId, newDefectDisplayId } from "@/lib/db/id";
import type { AiAnalysisPayload } from "@/lib/ai/types";
import type { AiAnalysisResult, DefectCandidate } from "@/lib/domain/types";

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
  },
  signal?: AbortSignal,
): Promise<AiAnalysisPayload> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const data = (await response.json()) as AiAnalysisPayload & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  return data;
}

async function saveAnalysisResult(
  defectId: string,
  payload: AiAnalysisPayload,
): Promise<AiAnalysisResult> {
  const db = getDB();
  const now = Date.now();
  const analysis: AiAnalysisResult = {
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
  await db.analyses.add(analysis);
  return analysis;
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
    },
    signal,
  );

  const now = Date.now();

  // Find existing linked defect or create one
  const existingDefects = await db.defects
    .where("sessionId")
    .equals(item.sessionId)
    .toArray();
  let defect = existingDefects.find((d) => d.checklistItemId === itemId);

  if (!defect) {
    const count = await db.defects
      .where("sessionId")
      .equals(item.sessionId)
      .count();
    defect = {
      id: newId(),
      displayId: newDefectDisplayId(count + 1),
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
    await db.defects.add(defect);
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
    await db.defects.update(defect.id, patch);
    defect = { ...defect, ...patch };
  }

  const analysis = await saveAnalysisResult(defect.id, payload);
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
    },
    signal,
  );

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

  return saveAnalysisResult(defectId, payload);
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
