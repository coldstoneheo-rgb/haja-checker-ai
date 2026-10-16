"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useState } from "react";
import { getDB } from "@/lib/db/db";
import { analyzeDirectDefect } from "@/lib/repo/analysisRepo";
import { listPhotosForDefect } from "@/lib/repo/photoRepo";
import type { EvidencePhoto } from "@/lib/domain/types";
import {
  DEFECT_TYPE_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/util/labels";
import PhotoCaptureButton from "../../checklist/PhotoCaptureButton";
import PhotoThumbnail from "../../checklist/PhotoThumbnail";
import PhotoViewer from "../../checklist/PhotoViewer";
import AnalysisResultCard from "../../analysis/AnalysisResultCard";

interface Props {
  sessionId: string;
  defectId: string;
}

export default function DefectDetailView({ sessionId, defectId }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const defect = useLiveQuery(
    () => getDB().defects.get(defectId),
    [defectId],
  );

  const photos = useLiveQuery(
    () => listPhotosForDefect(defectId),
    [defectId],
    [] as EvidencePhoto[],
  );

  const analysis = useLiveQuery(
    () =>
      getDB()
        .analyses.where("defectCandidateId")
        .equals(defectId)
        .toArray()
        .then((arr) => arr.sort((a, b) => b.createdAt - a.createdAt)[0]),
    [defectId],
  );

  if (defect === undefined) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  if (!defect) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        <p>하자를 찾을 수 없습니다.</p>
        <Link
          href={`/sessions/${sessionId}/defects`}
          className="mt-3 inline-flex rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700"
        >
          목록으로
        </Link>
      </div>
    );
  }

  async function runAnalysis() {
    if (!photos || photos.length === 0) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      await analyzeDirectDefect(defectId);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Defect summary */}
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-medium text-slate-400">
              {defect.displayId}
            </span>
            <p className="text-base font-semibold text-slate-900">
              {DEFECT_TYPE_LABELS[defect.defectType]}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${RISK_LEVEL_COLORS[defect.riskLevel]}`}
          >
            {RISK_LEVEL_LABELS[defect.riskLevel]}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">공간</dt>
            <dd className="font-medium text-slate-900">{defect.areaName}</dd>
          </div>
          {defect.detailLocation && (
            <div className="flex flex-col">
              <dt className="text-xs text-slate-500">세부 위치</dt>
              <dd className="font-medium text-slate-900">{defect.detailLocation}</dd>
            </div>
          )}
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">보수 난이도</dt>
            <dd className="font-medium text-slate-900">
              {REPAIR_DIFFICULTY_LABELS[defect.repairDifficulty]}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">등록일</dt>
            <dd className="font-medium text-slate-900">
              {new Date(defect.createdAt).toLocaleString("ko-KR")}
            </dd>
          </div>
        </dl>

        {defect.userMemo && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">메모</p>
            <p className="mt-0.5 text-sm text-slate-800">{defect.userMemo}</p>
          </div>
        )}
      </section>

      {/* Photos */}
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">사진</h2>

        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onClick={() => setViewerIndex(idx)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            아직 사진이 없습니다. 아래 버튼으로 사진을 추가하세요.
          </p>
        )}

        <PhotoCaptureButton
          sessionId={sessionId}
          defectCandidateId={defectId}
          areaName={defect.areaName}
          detailLocation={defect.detailLocation}
        />
      </section>

      {/* AI Analysis */}
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">AI 분석</h2>

        {analysis ? (
          <AnalysisResultCard defect={defect} analysis={analysis} />
        ) : (
          <p className="text-sm text-slate-500">
            아직 AI 분석이 없습니다. 사진 추가 후 분석을 실행하세요.
          </p>
        )}

        {analyzing && (
          <div className="flex flex-col gap-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-400" />
            </div>
            <p className="text-xs text-blue-600">Gemini가 사진을 분석하고 있습니다…</p>
          </div>
        )}

        {analysisError && (
          <div className="rounded-lg bg-rose-50 px-3 py-2">
            <p className="text-xs font-semibold text-rose-700">분석 실패</p>
            <p className="mt-0.5 text-xs text-rose-600">{analysisError}</p>
          </div>
        )}

        {!analyzing && (
          <button
            type="button"
            onClick={runAnalysis}
            disabled={!photos || photos.length === 0}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {analysis ? "재분석" : "AI 분석 실행"}
          </button>
        )}
      </section>

      {viewerIndex !== null && photos && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
