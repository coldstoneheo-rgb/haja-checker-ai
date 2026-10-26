"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDefect } from "@/lib/repo/defectRepo";
import type { DefectType, RepairDifficulty, RiskLevel } from "@/lib/domain/types";
import {
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_LABELS,
} from "@/lib/util/labels";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/db";
import { MODE_CONFIG, pickArea, sessionMode } from "@/lib/seed/modes";
import { MODE_COPY } from "@/lib/seed/modeCopy";

const RISK_LEVELS = Object.keys(RISK_LEVEL_LABELS) as RiskLevel[];
const REPAIR_DIFFICULTIES = Object.keys(
  REPAIR_DIFFICULTY_LABELS,
) as RepairDifficulty[];

interface Props {
  sessionId: string;
}

export default function NewDefectForm({ sessionId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // null = 세션 없음(잘못된 링크) · undefined = 로딩 중 — 없음을 로딩으로 착각해 «불러오는 중…»이 끝나지 않는 것을 막는다
  const session = useLiveQuery(async () => (await getDB().sessions.get(sessionId)) ?? null, [sessionId]);
  // 공간 목록은 세션 모드의 시드 공간(임대: 욕실·침실·전기·설비 …)
  const mode = session ? sessionMode(session) : "NEW_BUILD";
  const areas = MODE_CONFIG[mode].areas;
  const copy = MODE_COPY[mode];
  // 세션을 읽기 전에는 고른 값이 없다(null) → 읽은 뒤 그 모드의 areas[0]
  const [chosenArea, setAreaName] = useState<string | null>(null);
  const areaName = pickArea(areas, chosenArea);
  const [customArea, setCustomArea] = useState("");
  const [useCustomArea, setUseCustomArea] = useState(false);
  const [detailLocation, setDetailLocation] = useState("");
  const [defectType, setDefectType] = useState<DefectType>("CRACK");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("MEDIUM");
  const [repairDifficulty, setRepairDifficulty] =
    useState<RepairDifficulty>("UNKNOWN");
  const [userMemo, setUserMemo] = useState("");

  function validate(): boolean {
    const next: Record<string, string> = {};
    const area = useCustomArea ? customArea.trim() : areaName;
    if (!area) next.area = "공간을 선택하거나 입력해 주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const defect = await addDefect({
        sessionId,
        areaName: useCustomArea ? customArea.trim() : areaName,
        detailLocation: detailLocation.trim() || undefined,
        defectType,
        riskLevel,
        repairDifficulty,
        userMemo: userMemo.trim() || undefined,
      });
      router.push(`/sessions/${sessionId}/defects/${defect.id}`);
    } finally {
      setBusy(false);
    }
  }

  // 모드를 알기 전에는 신축 문구·공간을 보이지 않는다
  if (session === undefined) return <p className="text-sm text-slate-500">불러오는 중…</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Area */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">
          공간 <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {!useCustomArea ? (
            <select
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              placeholder="예: 드레스룸"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          )}
          <button
            type="button"
            onClick={() => setUseCustomArea((v) => !v)}
            className="shrink-0 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600"
          >
            {useCustomArea ? "목록에서 선택" : "직접 입력"}
          </button>
        </div>
        {errors.area && (
          <p className="text-xs text-rose-600">{errors.area}</p>
        )}
      </div>

      {/* Detail location */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-slate-700">세부 위치</span>
        <input
          type="text"
          value={detailLocation}
          onChange={(e) => setDetailLocation(e.target.value)}
          placeholder="예: 북쪽 창문 하단, 세면대 아래"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        />
      </label>

      {/* Defect type */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-700">
          {copy.directTypeLabel} <span className="text-rose-500">*</span>
        </span>
        <select
          value={defectType}
          onChange={(e) => setDefectType(e.target.value as DefectType)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
        >
          {copy.defectTypes.map((t) => (
            <option key={t} value={t}>
              {copy.defectTypeLabel(t)}
            </option>
          ))}
        </select>
      </div>

      {/* Risk level */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-700">위험도</span>
        <div className="grid grid-cols-4 gap-2">
          {RISK_LEVELS.map((level) => {
            const selected = riskLevel === level;
            const color =
              level === "URGENT"
                ? selected
                  ? "bg-rose-600 text-white ring-rose-600"
                  : "text-rose-700 ring-rose-200"
                : level === "HIGH"
                  ? selected
                    ? "bg-orange-500 text-white ring-orange-500"
                    : "text-orange-700 ring-orange-200"
                  : level === "MEDIUM"
                    ? selected
                      ? "bg-amber-500 text-white ring-amber-500"
                      : "text-amber-700 ring-amber-200"
                    : selected
                      ? "bg-slate-700 text-white ring-slate-700"
                      : "text-slate-600 ring-slate-200";
            return (
              <button
                key={level}
                type="button"
                onClick={() => setRiskLevel(level)}
                className={`rounded-xl py-2 text-xs font-semibold ring-1 transition ${color}`}
              >
                {RISK_LEVEL_LABELS[level]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Repair difficulty */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-700">보수 난이도</span>
        <select
          value={repairDifficulty}
          onChange={(e) =>
            setRepairDifficulty(e.target.value as RepairDifficulty)
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
        >
          {REPAIR_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {REPAIR_DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      {/* Memo */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-slate-700">메모</span>
        <textarea
          value={userMemo}
          onChange={(e) => setUserMemo(e.target.value)}
          placeholder={copy.directMemoPlaceholder}
          rows={4}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "저장 중…" : copy.directSave}
      </button>
    </form>
  );
}
