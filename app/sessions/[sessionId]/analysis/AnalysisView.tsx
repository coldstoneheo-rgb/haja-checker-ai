"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useState } from "react";
import { getDB } from "@/lib/db/db";
import {
  analyzeChecklistItem,
  analyzeDirectDefect,
  loadAnalysisPageData,
  type ChecklistAnalyzable,
  type DirectAnalyzable,
} from "@/lib/repo/analysisRepo";
import { DEFECT_TYPE_LABELS, RISK_LEVEL_COLORS, RISK_LEVEL_LABELS } from "@/lib/util/labels";
import AnalysisResultCard from "./AnalysisResultCard";

interface Props {
  sessionId: string;
}

type AnalyzingState = {
  id: string;
  status: "analyzing" | "error";
  error?: string;
};

export default function AnalysisView({ sessionId }: Props) {
  const [states, setStates] = useState<Map<string, AnalyzingState>>(new Map());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  const data = useLiveQuery(() => loadAnalysisPageData(sessionId), [sessionId]);
  const allDefects = useLiveQuery(
    () => getDB().defects.where("sessionId").equals(sessionId).toArray(),
    [sessionId],
  );

  const stateOf = (id: string) => states.get(id);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const setItemState = useCallback(
    (id: string, s: AnalyzingState | null) =>
      setStates((prev) => {
        const next = new Map(prev);
        if (s === null) next.delete(id); else next.set(id, s);
        return next;
      }),
    [],
  );

  async function runChecklistAnalysis(item: ChecklistAnalyzable) {
    if (item.photoCount === 0) return;
    setItemState(item.itemId, { id: item.itemId, status: "analyzing" });
    try {
      await analyzeChecklistItem(item.itemId);
      setItemState(item.itemId, null);
      setExpandedIds((prev) => new Set([...prev, item.itemId]));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setItemState(item.itemId, { id: item.itemId, status: "error", error: msg });
    }
  }

  async function runDirectAnalysis(entry: DirectAnalyzable) {
    if (entry.photoCount === 0) return;
    const id = entry.defect.id;
    setItemState(id, { id, status: "analyzing" });
    try {
      await analyzeDirectDefect(id);
      setItemState(id, null);
      setExpandedIds((prev) => new Set([...prev, id]));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setItemState(id, { id, status: "error", error: msg });
    }
  }

  async function analyzeAll() {
    if (!data) return;
    const pendingChecklist = data.checklist.filter((i) => !i.analysis && i.photoCount > 0);
    const pendingDirect = data.direct.filter((d) => !d.analysis && d.photoCount > 0);
    const total = pendingChecklist.length + pendingDirect.length;
    if (total === 0) return;

    setBatchRunning(true);
    setBatchProgress({ done: 0, total });
    let done = 0;
    for (const item of pendingChecklist) {
      await runChecklistAnalysis(item);
      done += 1;
      setBatchProgress({ done, total });
    }
    for (const entry of pendingDirect) {
      await runDirectAnalysis(entry);
      done += 1;
      setBatchProgress({ done, total });
    }
    setBatchRunning(false);
    setBatchProgress(null);
  }

  if (!data) return <p className="text-sm text-slate-500">불러오는 중…</p>;

  const defectMap = new Map((allDefects ?? []).map((d) => [d.id, d]));

  const pendingCount =
    data.checklist.filter((i) => !i.analysis && i.photoCount > 0).length +
    data.direct.filter((d) => !d.analysis && d.photoCount > 0).length;

  const totalItems = data.checklist.length + data.direct.length;

  if (totalItems === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">
          체크리스트에서 <strong>의심/하자</strong> 상태로 표시한 항목이 없습니다.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          체크리스트 화면에서 의심 또는 하자 버튼을 누른 항목이 여기에 나타납니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Batch control */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-slate-900">분석 대기 {pendingCount}건</p>
            {batchProgress && (
              <p className="text-xs text-slate-500">{batchProgress.done} / {batchProgress.total} 완료</p>
            )}
          </div>
          <button
            type="button"
            onClick={analyzeAll}
            disabled={batchRunning}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {batchRunning ? "분석 중…" : "전체 분석"}
          </button>
        </div>
      )}

      {/* Checklist items */}
      {data.checklist.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">체크리스트 항목</h2>
          {data.checklist.map((item) => {
            const st = stateOf(item.itemId);
            const expanded = expandedIds.has(item.itemId);
            const currentDefect = item.defect ? (defectMap.get(item.defect.id) ?? item.defect) : undefined;
            const isAnalyzing = st?.status === "analyzing";

            return (
              <div
                key={item.itemId}
                className={`flex flex-col rounded-2xl bg-white shadow-sm ring-1 ${isAnalyzing ? "ring-blue-200" : "ring-slate-200"}`}
              >
                {/* Header row — div, not button, to allow inner buttons */}
                <div className="flex items-start gap-3 p-4">
                  <div
                    className="flex flex-1 flex-col gap-0.5 cursor-pointer"
                    onClick={() => item.analysis && toggleExpand(item.itemId)}
                    role={item.analysis ? "button" : undefined}
                    aria-expanded={item.analysis ? expanded : undefined}
                  >
                    <p className="text-xs text-slate-400">{item.areaName}</p>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      사진 {item.photoCount}장
                      {item.analysis && currentDefect && (
                        <>
                          {" · "}
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${RISK_LEVEL_COLORS[currentDefect.riskLevel]}`}>
                            {RISK_LEVEL_LABELS[currentDefect.riskLevel]}
                          </span>
                          {" · "}
                          {DEFECT_TYPE_LABELS[currentDefect.defectType]}
                        </>
                      )}
                    </p>
                  </div>
                  <ItemAction
                    hasPhotos={item.photoCount > 0}
                    hasAnalysis={!!item.analysis}
                    analyzing={isAnalyzing}
                    expanded={expanded}
                    onAnalyze={() => runChecklistAnalysis(item)}
                    onToggle={() => toggleExpand(item.itemId)}
                  />
                </div>

                {isAnalyzing && (
                  <div className="px-4 pb-3">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-400" />
                    </div>
                    <p className="mt-1 text-xs text-blue-600">Gemini가 사진을 분석하고 있습니다…</p>
                  </div>
                )}

                {st?.status === "error" && (
                  <div className="mx-4 mb-3 rounded-lg bg-rose-50 px-3 py-2">
                    <p className="text-xs font-semibold text-rose-700">분석 실패</p>
                    <p className="mt-0.5 text-xs text-rose-600">{st.error}</p>
                    <button
                      type="button"
                      onClick={() => runChecklistAnalysis(item)}
                      className="mt-1.5 rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      재시도
                    </button>
                  </div>
                )}

                {expanded && item.analysis && currentDefect && (
                  <div className="px-4 pb-4">
                    <AnalysisResultCard defect={currentDefect} analysis={item.analysis} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Direct defects */}
      {data.direct.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">직접 추가 하자</h2>
          {data.direct.map((entry) => {
            const id = entry.defect.id;
            const st = stateOf(id);
            const expanded = expandedIds.has(id);
            const currentDefect = defectMap.get(id) ?? entry.defect;
            const isAnalyzing = st?.status === "analyzing";

            return (
              <div
                key={id}
                className={`flex flex-col rounded-2xl bg-white shadow-sm ring-1 ${isAnalyzing ? "ring-blue-200" : "ring-slate-200"}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    className="flex flex-1 flex-col gap-0.5 cursor-pointer"
                    onClick={() => entry.analysis && toggleExpand(id)}
                    role={entry.analysis ? "button" : undefined}
                    aria-expanded={entry.analysis ? expanded : undefined}
                  >
                    <p className="text-xs font-mono text-slate-400">{entry.defect.displayId}</p>
                    <p className="text-sm font-semibold text-slate-900">{DEFECT_TYPE_LABELS[currentDefect.defectType]}</p>
                    <p className="text-xs text-slate-500">
                      {currentDefect.areaName}
                      {currentDefect.detailLocation ? ` · ${currentDefect.detailLocation}` : ""}
                      {" · "}사진 {entry.photoCount}장
                      {entry.analysis && (
                        <>
                          {" · "}
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${RISK_LEVEL_COLORS[currentDefect.riskLevel]}`}>
                            {RISK_LEVEL_LABELS[currentDefect.riskLevel]}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <ItemAction
                    hasPhotos={entry.photoCount > 0}
                    hasAnalysis={!!entry.analysis}
                    analyzing={isAnalyzing}
                    expanded={expanded}
                    onAnalyze={() => runDirectAnalysis(entry)}
                    onToggle={() => toggleExpand(id)}
                  />
                </div>

                {isAnalyzing && (
                  <div className="px-4 pb-3">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-400" />
                    </div>
                    <p className="mt-1 text-xs text-blue-600">Gemini가 사진을 분석하고 있습니다…</p>
                  </div>
                )}

                {st?.status === "error" && (
                  <div className="mx-4 mb-3 rounded-lg bg-rose-50 px-3 py-2">
                    <p className="text-xs font-semibold text-rose-700">분석 실패</p>
                    <p className="mt-0.5 text-xs text-rose-600">{st.error}</p>
                    <button
                      type="button"
                      onClick={() => runDirectAnalysis(entry)}
                      className="mt-1.5 rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      재시도
                    </button>
                  </div>
                )}

                {expanded && entry.analysis && (
                  <div className="px-4 pb-4">
                    <AnalysisResultCard defect={currentDefect} analysis={entry.analysis} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function ItemAction({
  hasPhotos,
  hasAnalysis,
  analyzing,
  expanded,
  onAnalyze,
  onToggle,
}: {
  hasPhotos: boolean;
  hasAnalysis: boolean;
  analyzing: boolean;
  expanded: boolean;
  onAnalyze: () => void;
  onToggle: () => void;
}) {
  if (!hasPhotos) {
    return (
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400">
        사진 없음
      </span>
    );
  }
  if (analyzing) {
    return (
      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
        분석 중…
      </span>
    );
  }
  if (hasAnalysis) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
      >
        {expanded ? "접기 ↑" : "결과 보기 ↓"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onAnalyze}
      className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white active:bg-slate-700"
    >
      AI 분석
    </button>
  );
}
