"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDB } from "@/lib/db/db";
import { computeSessionProgress } from "@/lib/repo/checklistRepo";
import { PREP_ITEMS, RECOMMENDED_ROUTE } from "@/lib/seed/prep";

export default function SessionOverview() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const session = useLiveQuery(
    () => getDB().sessions.get(sessionId),
    [sessionId],
    undefined,
  );

  const progress = useLiveQuery(
    () => computeSessionProgress(sessionId),
    [sessionId],
    undefined,
  );

  if (session === undefined || progress === undefined) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  if (!session) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        <p>세션을 찾을 수 없습니다.</p>
        <Link
          href="/sessions"
          className="mt-3 inline-flex rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700"
        >
          세션 목록으로
        </Link>
      </div>
    );
  }

  const ratio = Math.round(progress.ratio * 100);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold">세대 정보</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <Detail label="단지" value={session.complexName} />
          <Detail label="동/호수" value={`${session.buildingNo}동 ${session.unitNo}호`} />
          <Detail label="평형/타입" value={session.floorPlanType ?? "—"} />
          <Detail label="시공사" value={session.builderName ?? "—"} />
          <Detail label="점검자" value={session.inspectorName ?? "—"} />
          <Detail label="연락처" value={session.phone ?? "—"} />
          <Detail label="점검일" value={session.inspectionDate} />
          <Detail label="입주예정일" value={session.moveInDate ?? "—"} />
        </dl>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">진행 상황</h2>
          <span className="text-sm font-semibold text-slate-700">{ratio}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <Stat label="총 항목" value={progress.total} tone="slate" />
          <Stat label="완료" value={progress.done} tone="emerald" />
          <Stat label="의심/하자" value={progress.suspected + progress.defects} tone="amber" />
          <Stat label="미점검" value={progress.notStarted} tone="slate" />
        </div>
        <div className="flex gap-2 pt-1">
          <Link
            href={`/sessions/${sessionId}/checklist`}
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-center text-sm font-semibold text-white"
          >
            체크리스트 진행
          </Link>
          <Link
            href={`/sessions/${sessionId}/analysis`}
            className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700"
          >
            AI 분석
          </Link>
          <Link
            href={`/sessions/${sessionId}/report`}
            className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700"
          >
            보고서
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold">사전 준비물</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-700">
          {PREP_ITEMS.map((item) => (
            <li key={item.name} className="flex flex-col">
              <span className="font-medium">· {item.name}</span>
              {item.note && (
                <span className="ml-3 text-xs text-slate-500">{item.note}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold">추천 동선</h2>
        <ol className="flex flex-wrap gap-2 text-sm">
          {RECOMMENDED_ROUTE.map((step, idx) => (
            <li
              key={step}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700"
            >
              <span className="text-xs text-slate-400">{idx + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500">
          각 공간 내부에서는 천장 → 벽 → 창호 → 문 → 수납 → 바닥 → 설비 → 전기
          순서로 점검하면 빠짐이 적습니다.
        </p>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-50 text-slate-700";
  return (
    <div className={`flex flex-col rounded-xl px-2 py-2 ${toneClass}`}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[11px] font-medium opacity-80">{label}</span>
    </div>
  );
}
