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

const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** 종이 백업용 빈 체크리스트(완결된 HTML 문서). 출력은 플랫폼 어댑터(lib/platform/reportActions)가 맡는다. */
export function buildBlankChecklistHtml(
  sessionTitle: string,
  inspectionDate: string,
  areasWithItems: { area: { name: string }; items: { title: string }[] }[],
  /** 체크 칸 «하자» 자리 — 모드 문구(임대 = «손상») */
  defectLabel = "하자",
  /** 제목 — 모드 문구 blankChecklistTitle(임대 = «입주 점검 체크리스트 …»류) */
  title = "사전점검 체크리스트 (종이 백업)",
): string {
  const rows = areasWithItems
    .flatMap(({ area, items }) =>
      items.map(
        (item) => `
          <tr>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;color:#64748b;white-space:nowrap">${escapeHtml(area.name)}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px">${escapeHtml(item.title)}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;font-size:11px">□ 양호&nbsp;&nbsp;□ 의심&nbsp;&nbsp;□ ${escapeHtml(defectLabel)}&nbsp;&nbsp;□ 확인불가</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:120px">&nbsp;</td>
          </tr>`,
      ),
    )
    .join("");
  return `<!doctype html><html lang="ko"><head>
      <meta charset="utf-8">
      <title>하자체크 체크리스트 — ${escapeHtml(sessionTitle)}</title>
      <style>
        body{font-family:system-ui,sans-serif;margin:20px;color:#0f172a}
        h1{font-size:16px;margin-bottom:4px}
        p{font-size:12px;color:#64748b;margin:0 0 12px}
        table{width:100%;border-collapse:collapse}
        th{background:#f1f5f9;padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;text-align:left}
        @media print{body{margin:10px}}
      </style>
    </head><body>
      <h1>하자체크 AI — ${escapeHtml(title)}</h1>
      <p>${escapeHtml(sessionTitle)} · 점검일: ${escapeHtml(inspectionDate)}</p>
      <table>
        <thead><tr>
          <th style="width:70px">공간</th>
          <th>점검 항목</th>
          <th style="width:200px">상태</th>
          <th style="width:140px">메모</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
}
