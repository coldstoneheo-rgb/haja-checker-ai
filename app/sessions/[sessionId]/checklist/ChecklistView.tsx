"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  listAreasWithItems,
  setChecklistItemStatus,
} from "@/lib/repo/checklistRepo";
import type {
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistPriority,
} from "@/lib/domain/types";
import PhotoCaptureButton from "./PhotoCaptureButton";
import PhotoGrid from "./PhotoGrid";

const STATUS_BUTTONS: {
  value: ChecklistItemStatus;
  label: string;
  tone: string;
}[] = [
  { value: "GOOD", label: "양호", tone: "emerald" },
  { value: "SUSPECTED", label: "의심", tone: "amber" },
  { value: "DEFECT", label: "하자", tone: "rose" },
  { value: "CANNOT_CHECK", label: "확인불가", tone: "slate" },
];

const PRIORITY_BADGE: Record<ChecklistPriority, { label: string; cls: string }> = {
  CRITICAL: { label: "긴급", cls: "bg-rose-100 text-rose-700" },
  HIGH: { label: "높음", cls: "bg-amber-100 text-amber-700" },
  MEDIUM: { label: "보통", cls: "bg-slate-100 text-slate-700" },
  LOW: { label: "낮음", cls: "bg-slate-50 text-slate-500" },
};

export default function ChecklistView() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  const areas = useLiveQuery(
    () => listAreasWithItems(sessionId),
    [sessionId],
    undefined,
  );

  if (areas === undefined) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  const areasWithItems = areas.filter((a) => a.items.length > 0);
  if (areasWithItems.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        체크리스트 항목이 없습니다.
      </p>
    );
  }

  const currentAreaId = activeAreaId ?? areasWithItems[0].area.id;
  const current = areasWithItems.find((a) => a.area.id === currentAreaId);
  const currentIndex = areasWithItems.findIndex((a) => a.area.id === currentAreaId);
  const nextArea = areasWithItems[currentIndex + 1];
  const isLastArea = currentIndex === areasWithItems.length - 1;

  // 현재 영역의 점검 완료 여부
  const currentAreaDone =
    current?.items.every(
      (i) => i.status !== "NOT_STARTED" && i.status !== "PHOTO_REQUIRED",
    ) ?? false;

  // 전체 영역 중 의심/하자 항목 수
  const suspectedCount = areasWithItems
    .flatMap((a) => a.items)
    .filter((i) => i.status === "SUSPECTED" || i.status === "DEFECT").length;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <nav className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {areasWithItems.map(({ area, items }) => {
          const done = items.filter(
            (i) => i.status !== "NOT_STARTED" && i.status !== "PHOTO_REQUIRED",
          ).length;
          const total = items.length;
          const isActive = area.id === currentAreaId;
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => setActiveAreaId(area.id)}
              className={`flex shrink-0 flex-col rounded-xl px-3 py-2 text-left text-xs font-semibold ring-1 ${
                isActive
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              <span>{area.name}</span>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {done}/{total}
              </span>
            </button>
          );
        })}
      </nav>

      <ul className="flex flex-col gap-3">
        {current?.items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            sessionId={sessionId}
            areaName={current.area.name}
          />
        ))}
      </ul>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          {isLastArea ? (
            // 마지막 영역 → AI 분석으로 바로 이동
            <button
              type="button"
              onClick={() => router.push(`/sessions/${sessionId}/analysis`)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                suspectedCount > 0
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {suspectedCount > 0
                ? `AI 분석 시작 → (의심·하자 ${suspectedCount}건)`
                : "AI 분석으로 이동 →"}
            </button>
          ) : (
            <>
              {nextArea && (
                <button
                  type="button"
                  onClick={() => setActiveAreaId(nextArea.area.id)}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold ring-1 transition ${
                    currentAreaDone
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-700 ring-slate-200"
                  }`}
                >
                  다음: {nextArea.area.name} →
                </button>
              )}
              {suspectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => router.push(`/sessions/${sessionId}/analysis`)}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  AI 분석 ({suspectedCount})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  sessionId,
  areaName,
}: {
  item: ChecklistItem;
  sessionId: string;
  areaName: string;
}) {
  const [pending, setPending] = useState<ChecklistItemStatus | null>(null);

  async function onStatus(status: ChecklistItemStatus) {
    setPending(status);
    try {
      await setChecklistItemStatus(item.id, status);
    } finally {
      setPending(null);
    }
  }

  const priority = PRIORITY_BADGE[item.priority];

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.category}</p>
          <p className="text-sm text-slate-600">{item.description}</p>
          <p className="text-xs text-slate-500">📷 {item.captureGuide}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${priority.cls}`}
        >
          {priority.label}
        </span>
      </div>

      <PhotoGrid
        checklistItemId={item.id}
        requiredPhotoCount={item.requiredPhotoCount}
      />

      <PhotoCaptureButton
        sessionId={sessionId}
        checklistItemId={item.id}
        areaName={areaName}
      />

      <div className="grid grid-cols-4 gap-2">
        {STATUS_BUTTONS.map((b) => {
          const isActive = item.status === b.value;
          const isPending = pending === b.value;
          const cls = `rounded-xl px-2 py-2 text-xs font-semibold ring-1 transition disabled:opacity-50 ${
            isActive
              ? toneActive(b.tone)
              : `bg-white text-slate-700 ring-slate-200 ${toneHover(b.tone)}`
          }`;
          return (
            <button
              key={b.value}
              type="button"
              disabled={isPending}
              onClick={() => onStatus(b.value)}
              className={cls}
            >
              {isPending ? "…" : b.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}

function toneActive(tone: string): string {
  switch (tone) {
    case "emerald":
      return "bg-emerald-600 text-white ring-emerald-600";
    case "amber":
      return "bg-amber-500 text-white ring-amber-500";
    case "rose":
      return "bg-rose-600 text-white ring-rose-600";
    default:
      return "bg-slate-700 text-white ring-slate-700";
  }
}

function toneHover(tone: string): string {
  switch (tone) {
    case "emerald":
      return "hover:bg-emerald-50";
    case "amber":
      return "hover:bg-amber-50";
    case "rose":
      return "hover:bg-rose-50";
    default:
      return "hover:bg-slate-50";
  }
}
