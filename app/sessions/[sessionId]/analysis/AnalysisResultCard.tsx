"use client";

import { useState } from "react";
import { updateDefect } from "@/lib/repo/defectRepo";
import type { AiAnalysisResult, DefectCandidate, DefectType, RepairDifficulty, RiskLevel } from "@/lib/domain/types";
import {
  DEFECT_TYPE_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/util/labels";

const DEFECT_TYPES = Object.keys(DEFECT_TYPE_LABELS) as DefectType[];
const REPAIR_DIFFICULTIES = Object.keys(REPAIR_DIFFICULTY_LABELS) as RepairDifficulty[];
const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface Props {
  defect: DefectCandidate;
  analysis: AiAnalysisResult;
}

export default function AnalysisResultCard({ defect, analysis }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(defect.status === "USER_CONFIRMED");

  // Editable fields (start from defect values, which are updated on each analysis)
  const [defectType, setDefectType] = useState<DefectType>(defect.defectType);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(defect.riskLevel);
  const [repairDifficulty, setRepairDifficulty] = useState<RepairDifficulty>(
    defect.repairDifficulty,
  );
  const [contractorText, setContractorText] = useState(
    defect.requestedAction ?? analysis.contractorRequestText,
  );

  async function onConfirm() {
    setSaving(true);
    try {
      await updateDefect(defect.id, {
        defectType,
        riskLevel,
        repairDifficulty,
        requestedAction: contractorText.trim() || undefined,
        status: "USER_CONFIRMED",
      } as Parameters<typeof updateDefect>[1]);
      setConfirmed(true);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const confidencePct = Math.round(analysis.confidence * 100);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      {/* Header row: defect type + risk level + confidence */}
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <select
            value={defectType}
            onChange={(e) => setDefectType(e.target.value as DefectType)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none"
          >
            {DEFECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {DEFECT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        ) : (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            {DEFECT_TYPE_LABELS[defectType]}
          </span>
        )}

        {editing ? (
          <div className="flex gap-1">
            {RISK_LEVELS.map((level) => {
              const sel = riskLevel === level;
              const color =
                level === "URGENT"
                  ? sel ? "bg-rose-600 text-white" : "text-rose-700 ring-1 ring-rose-300"
                  : level === "HIGH"
                    ? sel ? "bg-orange-500 text-white" : "text-orange-700 ring-1 ring-orange-300"
                    : level === "MEDIUM"
                      ? sel ? "bg-amber-500 text-white" : "text-amber-700 ring-1 ring-amber-300"
                      : sel ? "bg-slate-600 text-white" : "text-slate-600 ring-1 ring-slate-300";
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRiskLevel(level)}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${color}`}
                >
                  {RISK_LEVEL_LABELS[level]}
                </button>
              );
            })}
          </div>
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RISK_LEVEL_COLORS[riskLevel]}`}
          >
            {RISK_LEVEL_LABELS[riskLevel]} ({analysis.riskScore}점)
          </span>
        )}

        <span className="ml-auto text-xs text-slate-400">
          신뢰도 {confidencePct}%
        </span>

        {confirmed && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            확정
          </span>
        )}
      </div>

      {/* Evidence summary */}
      <p className="text-sm text-slate-800">{analysis.evidenceSummary}</p>

      {/* Suspected cause */}
      {analysis.suspectedCause && (
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">추정 원인: </span>
          {analysis.suspectedCause}
        </p>
      )}

      {/* Repair difficulty */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">보수 난이도</span>
        {editing ? (
          <select
            value={repairDifficulty}
            onChange={(e) =>
              setRepairDifficulty(e.target.value as RepairDifficulty)
            }
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none"
          >
            {REPAIR_DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {REPAIR_DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-semibold text-slate-700">
            {REPAIR_DIFFICULTY_LABELS[repairDifficulty]} ({analysis.repairDifficultyScore}점)
          </span>
        )}
      </div>

      {/* Contractor request text */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-slate-600">시공자 요청 문구</p>
        {editing ? (
          <textarea
            value={contractorText}
            onChange={(e) => setContractorText(e.target.value)}
            rows={4}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        ) : (
          <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-100">
            {contractorText}
          </p>
        )}
      </div>

      {/* Additional photos needed */}
      {analysis.additionalCheckRequired &&
        analysis.recommendedAdditionalPhotos.length > 0 && (
          <div className="flex flex-col gap-1 rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100">
            <p className="text-xs font-semibold text-amber-800">
              추가 촬영 권장
            </p>
            <ul className="list-disc pl-4 text-xs text-amber-700">
              {analysis.recommendedAdditionalPhotos.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}

      {/* Caution */}
      <p className="text-[11px] italic text-slate-400">{analysis.caution}</p>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중…" : "확정 저장"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {confirmed ? "수정" : "검토·확정"}
          </button>
        )}
      </div>
    </div>
  );
}
