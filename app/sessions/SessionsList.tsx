"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDB } from "@/lib/db/db";
import { deleteSession } from "@/lib/repo/sessionRepo";
import type { InspectionSession } from "@/lib/domain/types";

const STATUS_LABEL: Record<InspectionSession["status"], string> = {
  DRAFT: "준비 중",
  IN_PROGRESS: "점검 중",
  ANALYZING: "AI 분석 중",
  REPORT_READY: "보고서 준비",
  ARCHIVED: "보관",
};

const STATUS_TONE: Record<InspectionSession["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  ANALYZING: "bg-sky-100 text-sky-700",
  REPORT_READY: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return iso;
}

export default function SessionsList() {
  const router = useRouter();
  const sessions = useLiveQuery(
    async () => {
      const all = await getDB().sessions.toArray();
      return all.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    [],
    undefined,
  );
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (sessions === undefined) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        <p>아직 생성된 점검 세션이 없습니다.</p>
        <Link
          href="/sessions/new"
          className="inline-flex w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          새 세션 만들기
        </Link>
      </div>
    );
  }

  async function onDelete(id: string) {
    if (!confirm("이 세션의 모든 데이터(사진·메모·분석)를 삭제합니다. 진행할까요?")) {
      return;
    }
    setPendingDelete(id);
    try {
      await deleteSession(id);
    } finally {
      setPendingDelete(null);
      router.refresh();
    }
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-semibold text-slate-900">
                {session.complexName} {session.buildingNo}동 {session.unitNo}호
              </p>
              <p className="text-xs text-slate-500">
                점검일 {formatDate(session.inspectionDate)} · 갱신{" "}
                {new Date(session.updatedAt).toLocaleString("ko-KR")}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[session.status]}`}
            >
              {STATUS_LABEL[session.status]}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/sessions/${session.id}`}
              className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              열기
            </Link>
            <button
              type="button"
              onClick={() => onDelete(session.id)}
              disabled={pendingDelete === session.id}
              className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              {pendingDelete === session.id ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
