"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { buildBlankChecklistHtml, buildJsonExport, buildReportData } from "@/lib/repo/reportRepo";
import {
  REPORT_ACTION_LABELS,
  printBlankChecklist,
  printReport,
  saveFile,
} from "@/lib/platform/reportActions";
import type { PlatformResult } from "@/lib/platform/types";
import {
  CHECKLIST_STATUS_COLORS,
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/util/labels";
import { sessionMode, sessionRecipient } from "@/lib/seed/modes";
import { MODE_COPY, type ModeCopy } from "@/lib/seed/modeCopy";
import ReportAiDisclaimer from "./ReportAiDisclaimer";
import { SectionTitle } from "./reportParts";
import type { DefectCandidate, RiskLevel } from "@/lib/domain/types";

interface Props {
  sessionId: string;
}

export default function ReportView({ sessionId }: Props) {
  const data = useLiveQuery(() => buildReportData(sessionId), [sessionId]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!data) {
    return <p className="text-sm text-slate-500">보고서 생성 중…</p>;
  }

  const { session, progress, areasWithItems, directDefects, checklistDefects, analysisMap, checklistDefectMap } = data;

  const allDefects = [...checklistDefects, ...directDefects];
  const urgentHigh = allDefects.filter(
    (d) => d.riskLevel === "URGENT" || d.riskLevel === "HIGH",
  );
  const analyzedDefects = allDefects.filter((d) => analysisMap.has(d.id));

  const mode = sessionMode(session);
  const copy = MODE_COPY[mode];
  const sessionTitle = `${session.complexName} ${session.buildingNo}동 ${session.unitNo}호`;
  const riskCounts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  for (const d of allDefects) riskCounts[d.riskLevel] += 1;

  function show(result: PlatformResult) {
    setActionMessage(result.ok ? null : result.message);
  }

  function onPrint() {
    show(printReport());
  }

  function onJsonExport() {
    const blob = buildJsonExport(data!);
    const date = session.inspectionDate.replace(/-/g, "");
    show(saveFile(blob, `하자체크-${date}-${session.buildingNo}동${session.unitNo}호.json`));
  }

  function onPrintBlankChecklist() {
    show(printBlankChecklist(buildBlankChecklistHtml(sessionTitle, session.inspectionDate, areasWithItems, copy.statusLabel("DEFECT"))));
  }

  return (
    <>
      {/* Action bar — hidden in print */}
      <div className="print:hidden flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
          >
            {REPORT_ACTION_LABELS.report}
          </button>
          <button
            type="button"
            onClick={onJsonExport}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            {REPORT_ACTION_LABELS.json}
          </button>
        </div>
        <button
          type="button"
          onClick={onPrintBlankChecklist}
          className="w-full rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200"
        >
          {REPORT_ACTION_LABELS.blankChecklist}
        </button>
        {actionMessage && (
          <p role="status" className="text-xs text-slate-500">
            {actionMessage}
          </p>
        )}
      </div>

      {/* ── REPORT DOCUMENT ── */}
      <div
        id="report-document"
        className="flex flex-col gap-0 bg-white text-slate-900 print:gap-0"
      >
        {/* ── SECTION 1: 표지 ── */}
        <section className="flex flex-col gap-6 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:p-0 print:pb-10">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              하자체크 AI
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {copy.reportTitle}
            </h1>
            <p className="text-sm text-slate-500">
              작성일: {new Date(data.generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <Detail label="단지명" value={session.complexName} />
            <Detail label="동/호수" value={`${session.buildingNo}동 ${session.unitNo}호`} />
            <Detail label="평형/타입" value={session.floorPlanType ?? "—"} />
            {copy.showModeMeta && <Detail label="점검 종류" value={copy.modeLabel} />}
            {copy.showModeMeta && (
              <Detail label="수신처" value={copy.recipientLabel(sessionRecipient(session))} />
            )}
            {copy.builderDisplayLabel && <Detail label={copy.builderDisplayLabel} value={session.builderName ?? "—"} />}
            <Detail label="점검자" value={session.inspectorName ?? "—"} />
            <Detail label="연락처" value={session.phone ?? "—"} />
            <Detail label="점검일" value={session.inspectionDate} />
            {copy.moveInDateLabel && <Detail label={copy.moveInDateLabel} value={session.moveInDate ?? "—"} />}
          </dl>
        </section>

        {/* ── SECTION 2: 점검 요약 ── */}
        <section className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
          <SectionTitle num={1} title="점검 요약" />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">전체 진행률</span>
              <span className="font-bold">{Math.round(progress.ratio * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 print:hidden">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{ width: `${Math.round(progress.ratio * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <StatBox label="총 체크 항목" value={progress.total} />
            <StatBox label="완료" value={progress.done} color="emerald" />
            <StatBox label={`${copy.flagged}(체크리스트)`} value={progress.suspected + progress.defects} color="amber" />
            <StatBox label={copy.directTitle} value={directDefects.length} color={directDefects.length > 0 ? "rose" : "slate"} />
          </div>

          {allDefects.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500">위험도 분포</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {(["URGENT", "HIGH", "MEDIUM", "LOW"] as RiskLevel[]).map((level) => (
                  <div
                    key={level}
                    className={`flex flex-col rounded-xl py-2 ${RISK_LEVEL_COLORS[level]}`}
                  >
                    <span className="text-lg font-bold">{riskCounts[level]}</span>
                    <span className="font-medium opacity-80">{RISK_LEVEL_LABELS[level]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 3: 긴급/위험 항목 ── */}
        {urgentHigh.length > 0 && (
          <section className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
            <SectionTitle num={2} title="긴급·위험 항목" />
            <p className="text-xs text-slate-500">
              즉각적인 확인 및 조치가 필요한 항목입니다.
            </p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <Th>ID</Th>
                  <Th>공간</Th>
                  <Th>유형</Th>
                  <Th>위험도</Th>
                </tr>
              </thead>
              <tbody>
                {urgentHigh.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <Td className="font-mono">{d.displayId}</Td>
                    <Td>{d.areaName}{d.detailLocation ? ` · ${d.detailLocation}` : ""}</Td>
                    <Td>{copy.defectTypeLabel(d.defectType)}</Td>
                    <Td>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${RISK_LEVEL_COLORS[d.riskLevel]}`}>
                        {RISK_LEVEL_LABELS[d.riskLevel]}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── SECTION 4: 체크리스트 결과 ── */}
        <section className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
          <SectionTitle num={3} title="체크리스트 점검 결과" />
          {areasWithItems.map(({ area, items }) => (
            <div key={area.id} className="flex flex-col gap-1">
              <p className="text-xs font-bold text-slate-700">{area.name}</p>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {items.map((item) => {
                    const linkedDefect = checklistDefectMap.get(item.id);
                    return (
                      <tr key={item.id} className="border-b border-slate-100">
                        <Td className="w-1/2 py-1.5">{item.title}</Td>
                        <Td className={`font-semibold ${CHECKLIST_STATUS_COLORS[item.status]}`}>
                          {copy.statusLabel(item.status)}
                        </Td>
                        <Td className="font-mono text-slate-400">
                          {linkedDefect?.displayId ?? ""}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* ── SECTION 5: 직접 추가 하자 ── */}
        {directDefects.length > 0 && (
          <section className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
            <SectionTitle num={4} title={copy.reportDirectSection} />
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <Th>ID</Th>
                  <Th>공간·위치</Th>
                  <Th>유형</Th>
                  <Th>위험도</Th>
                  <Th>보수</Th>
                </tr>
              </thead>
              <tbody>
                {directDefects.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <Td className="font-mono">{d.displayId}</Td>
                    <Td>{d.areaName}{d.detailLocation ? ` · ${d.detailLocation}` : ""}</Td>
                    <Td>{copy.defectTypeLabel(d.defectType)}</Td>
                    <Td>
                      <span className={`rounded-full px-1.5 py-0.5 font-semibold ${RISK_LEVEL_COLORS[d.riskLevel]}`}>
                        {RISK_LEVEL_LABELS[d.riskLevel]}
                      </span>
                    </Td>
                    <Td>{REPAIR_DIFFICULTY_LABELS[d.repairDifficulty]}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {directDefects.some((d) => d.userMemo) && (
              <div className="flex flex-col gap-2 pt-1">
                {directDefects.filter((d) => d.userMemo).map((d) => (
                  <p key={d.id} className="text-xs text-slate-600">
                    <span className="font-mono font-medium text-slate-400">{d.displayId}</span>
                    {" "}— {d.userMemo}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 6: AI 분석 결과 상세 ── */}
        {analyzedDefects.length > 0 && (
          <section className="flex flex-col gap-5 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
            <SectionTitle num={5} title="AI 분석 결과 상세" />
            {analyzedDefects.map((defect) => {
              const analysis = analysisMap.get(defect.id)!;
              return (
                <AnalysisBlock key={defect.id} defect={defect} analysis={analysis} copy={copy} />
              );
            })}
          </section>
        )}

        {/* ── SECTION 7: 시공자 요청 문구 ── */}
        {allDefects.some((d) => d.requestedAction) && (
          <section className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
            <SectionTitle num={6} title={copy.reportRequestSection} />
            <p className="text-xs text-slate-500">
              {copy.reportRequestIntro}
            </p>
            <ol className="flex flex-col gap-3 list-decimal pl-5 text-sm">
              {allDefects
                .filter((d) => d.requestedAction)
                .map((d) => (
                  <li key={d.id}>
                    <span className="font-mono text-xs text-slate-400">[{d.displayId}] </span>
                    {d.requestedAction}
                  </li>
                ))}
            </ol>
          </section>
        )}

        {/* ── SECTION 8: 면책 고지 — AI를 쓰는 모드(신축)만 ── */}
        {copy.aiOn && <ReportAiDisclaimer generatedAt={data.generatedAt} sessionTitle={sessionTitle} />}
      </div>
    </>
  );
}

/* ── Helpers ── */


function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function StatBox({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: number;
  color?: "slate" | "emerald" | "amber" | "rose";
}) {
  const cls =
    color === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : color === "amber"
        ? "bg-amber-50 text-amber-700"
        : color === "rose"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-50 text-slate-700";
  return (
    <div className={`flex flex-col rounded-xl px-3 py-3 ${cls}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-[11px] font-medium opacity-80">{label}</span>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`py-1.5 pr-2 font-semibold ${className ?? ""}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`py-1.5 pr-2 align-top ${className ?? ""}`}>{children}</td>
  );
}

import type { AiAnalysisResult } from "@/lib/domain/types";

function AnalysisBlock({
  defect,
  analysis,
  copy,
}: {
  defect: DefectCandidate;
  analysis: AiAnalysisResult;
  copy: ModeCopy;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 print:break-inside-avoid">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-slate-400">{defect.displayId}</span>
        <span className="text-sm font-semibold text-slate-900">
          {defect.areaName}
          {defect.detailLocation ? ` · ${defect.detailLocation}` : ""}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_LEVEL_COLORS[defect.riskLevel]}`}>
          {RISK_LEVEL_LABELS[defect.riskLevel]} ({analysis.riskScore}점)
        </span>
        <span className="ml-auto text-xs text-slate-400">
          신뢰도 {Math.round(analysis.confidence * 100)}%
        </span>
      </div>
      <p className="text-xs font-medium text-slate-600">
        유형: {copy.defectTypeLabel(analysis.defectType)} ·{" "}
        보수: {REPAIR_DIFFICULTY_LABELS[analysis.repairDifficulty]} ({analysis.repairDifficultyScore}점)
      </p>
      <p className="text-sm text-slate-800">{analysis.evidenceSummary}</p>
      {analysis.suspectedCause && (
        <p className="text-xs text-slate-500">
          추정 원인: {analysis.suspectedCause}
        </p>
      )}
      {analysis.additionalCheckRequired && analysis.recommendedAdditionalPhotos.length > 0 && (
        <p className="text-xs text-amber-700">
          추가 촬영 권장: {analysis.recommendedAdditionalPhotos.join(" / ")}
        </p>
      )}
    </div>
  );
}
