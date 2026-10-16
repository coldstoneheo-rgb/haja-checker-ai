"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getDB } from "@/lib/db/db";
import { deleteDefect } from "@/lib/repo/defectRepo";
import {
  DEFECT_TYPE_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/util/labels";

export default function DefectsList() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const defects = useLiveQuery(
    () =>
      getDB()
        .defects.where("sessionId")
        .equals(sessionId)
        .toArray()
        .then((arr) =>
          arr
            .filter((d) => !d.checklistItemId)
            .sort((a, b) => a.createdAt - b.createdAt),
        ),
    [sessionId],
  );

  if (defects === undefined) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  if (defects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">직접 추가한 하자가 없습니다.</p>
        <Link
          href={`/sessions/${sessionId}/defects/new`}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          첫 하자 추가
        </Link>
      </div>
    );
  }

  async function onDelete(defectId: string) {
    if (!confirm("이 하자를 삭제하시겠습니까?")) return;
    setDeleting(defectId);
    try {
      await deleteDefect(defectId);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <ul className="flex flex-col gap-3">
      {defects.map((defect) => (
        <li
          key={defect.id}
          className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
        >
          <button
            type="button"
            onClick={() => router.push(`/sessions/${sessionId}/defects/${defect.id}`)}
            className="flex items-start justify-between gap-2 text-left"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-mono font-medium text-slate-400">
                {defect.displayId}
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {DEFECT_TYPE_LABELS[defect.defectType]}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${RISK_LEVEL_COLORS[defect.riskLevel]}`}
            >
              {RISK_LEVEL_LABELS[defect.riskLevel]}
            </span>
          </button>

          <div className="flex gap-1.5 text-xs text-slate-500">
            <span>{defect.areaName}</span>
            {defect.detailLocation && (
              <>
                <span>·</span>
                <span>{defect.detailLocation}</span>
              </>
            )}
            <span>·</span>
            <span>{REPAIR_DIFFICULTY_LABELS[defect.repairDifficulty]}</span>
          </div>

          {defect.userMemo && (
            <p className="text-sm text-slate-700">{defect.userMemo}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              {new Date(defect.createdAt).toLocaleString("ko-KR")}
            </span>
            <button
              type="button"
              onClick={() => onDelete(defect.id)}
              disabled={deleting === defect.id}
              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
            >
              {deleting === defect.id ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
