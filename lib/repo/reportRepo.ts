"use client";

import { getDB } from "@/lib/db/db";
import { computeSessionProgress } from "@/lib/repo/checklistRepo";
import { listAreasWithItems, type AreaWithItems } from "@/lib/repo/checklistRepo";
import type {
  AiAnalysisResult,
  DefectCandidate,
  InspectionSession,
} from "@/lib/domain/types";
import type { SessionProgress } from "@/lib/repo/checklistRepo";

export interface ReportData {
  session: InspectionSession;
  progress: SessionProgress;
  areasWithItems: AreaWithItems[];
  directDefects: DefectCandidate[];
  checklistDefects: DefectCandidate[];
  analysisMap: Map<string, AiAnalysisResult>; // defectId → latest analysis
  checklistDefectMap: Map<string, DefectCandidate>; // checklistItemId → defect
  generatedAt: number;
}

export async function buildReportData(sessionId: string): Promise<ReportData> {
  const db = getDB();

  const [session, progress, areasWithItems, allDefects, rawAnalyses] =
    await Promise.all([
      db.sessions.get(sessionId),
      computeSessionProgress(sessionId),
      listAreasWithItems(sessionId),
      db.defects.where("sessionId").equals(sessionId).toArray(),
      db.analyses.toArray(),
    ]);

  if (!session) throw new Error("세션을 찾을 수 없습니다.");

  // Build analysis map (latest per defect)
  const defectIds = new Set(allDefects.map((d) => d.id));
  const sessionAnalyses = rawAnalyses
    .filter((a) => defectIds.has(a.defectCandidateId))
    .sort((a, b) => a.createdAt - b.createdAt);

  const analysisMap = new Map<string, AiAnalysisResult>();
  for (const a of sessionAnalyses) {
    analysisMap.set(a.defectCandidateId, a);
  }

  const checklistDefects = allDefects
    .filter((d) => !!d.checklistItemId)
    .sort((a, b) => a.createdAt - b.createdAt);
  const directDefects = allDefects
    .filter((d) => !d.checklistItemId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const checklistDefectMap = new Map<string, DefectCandidate>();
  for (const d of checklistDefects) {
    if (d.checklistItemId) checklistDefectMap.set(d.checklistItemId, d);
  }

  return {
    session,
    progress,
    areasWithItems,
    directDefects,
    checklistDefects,
    analysisMap,
    checklistDefectMap,
    generatedAt: Date.now(),
  };
}

interface ExportableReport {
  exportVersion: string;
  exportedAt: string;
  session: InspectionSession;
  progress: Omit<SessionProgress, never>;
  checklistItems: Array<{
    area: string;
    title: string;
    status: string;
    userMemo?: string;
    linkedDefectId?: string;
  }>;
  defects: Array<Omit<DefectCandidate, never>>;
  analyses: Array<Omit<AiAnalysisResult, never>>;
}

export function buildJsonExport(data: ReportData): Blob {
  const checklistItems = data.areasWithItems.flatMap(({ area, items }) =>
    items.map((item) => ({
      area: area.name,
      title: item.title,
      status: item.status,
      userMemo: item.userMemo,
      linkedDefectId: data.checklistDefectMap.get(item.id)?.id,
    })),
  );

  const allDefects = [...data.checklistDefects, ...data.directDefects];
  const allAnalyses = [...data.analysisMap.values()];

  const payload: ExportableReport = {
    exportVersion: "1.0",
    exportedAt: new Date(data.generatedAt).toISOString(),
    session: data.session,
    progress: data.progress,
    checklistItems,
    defects: allDefects,
    analyses: allAnalyses,
  };

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
