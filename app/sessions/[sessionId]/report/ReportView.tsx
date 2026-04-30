"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { buildJsonExport, buildReportData, triggerDownload } from "@/lib/repo/reportRepo";
import {
  CHECKLIST_STATUS_COLORS,
  CHECKLIST_STATUS_LABELS,
  DEFECT_TYPE_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/util/labels";
import type { DefectCandidate, RiskLevel } from "@/lib/domain/types";

interface Props {
  sessionId: string;
}

export default function ReportView({ sessionId }: Props) {
  const data = useLiveQuery(() => buildReportData(sessionId), [sessionId]);

  if (!data) {
    return <p className="text-sm text-slate-500">보고서 생성 중…</p>;
  }

  const { session, progress, areasWithItems, directDefects, checklistDefects, analysisMap, checklistDefectMap } = data;

  const allDefects = [...checklistDefects, ...directDefects];
  const urgentHigh = allDefects.filter(
    (d) => d.riskLevel === "URGENT" || d.riskLevel === "HIGH",
  );
  const analyzedDefects = allDefects.filter((d) => analysisMap.has(d.id));

  const sessionTitle = `${session.complexName} ${session.buildingNo}동 ${session.unitNo}호`;
  const riskCounts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  for (const d of allDefects) riskCounts[d.riskLevel] += 1;

  function onPrint() {
    window.print();
  }

  function onJsonExport() {
    const blob = buildJsonExport(data!);
    const date = session.inspectionDate.replace(/-/g, "");
    triggerDownload(blob, `하자체크-${date}-${session.buildingNo}동${session.unitNo}호.json`);
  }

  return (
    <>
      {/* Action bar — hidden in print */}
      <div className="print:hidden flex gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
        >
          인쇄 / PDF 저장
        </button>
        <button
          type="button"
          onClick={onJsonExport}
          className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          JSON 백업
        </button>
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
              사전점검 하자 보고서
            </h1>
            <p className="text-sm text-slate-500">
              작성일: {new Date(data.generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <Detail label="단지명" value={session.complexName} />
            <Detail label="동/호수" value={`${session.buildingNo}동 ${session.unitNo}호`} />
            <Detail label="평형/타입" value={session.floorPlanType ?? "—"} />
            <Detail label="시공사" value={session.builderName ?? "—"} />
            <Detail label="점검자" value={session.inspectorName ?? "—"} />
            <Detail label="연락처" value={session.phone ?? "—"} />
            <Detail label="점검일" value={session.inspectionDate} />
            <Detail label="입주예정일" value={session.moveInDate ?? "—"} />
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
            <StatBox label="의심/하자(체크리스트)" value={progress.suspected + progress.defects} color="amber" />
            <StatBox label="직접 추가 하자" value={directDefects.length} color={directDefects.length > 0 ? "rose" : "slate"} />
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
                    <Td>{DEFECT_TYPE_LABELS[d.defectType]}</Td>
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
                          {CHECKLIST_STATUS_LABELS[item.status]}
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
            <SectionTitle num={4} title="직접 추가 하자 목록" />
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
                    <Td>{DEFECT_TYPE_LABELS[d.defectType]}</Td>
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
                <AnalysisBlock key={defect.id} defect={defect} analysis={analysis} />
              );
            })}
          </section>
        )}

        {/* ── SECTION 7: 시공자 요청 문구 ── */}
        {allDefects.some((d) => d.requestedAction) && (
          <section className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
            <SectionTitle num={6} title="시공자 요청 문구 모음" />
            <p className="text-xs text-slate-500">
              아래 문구를 시공사 하자 접수 시 그대로 사용하실 수 있습니다.
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

        {/* ── SECTION 8: 면책 고지 ── */}
        <section className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
          <SectionTitle num={7} title="AI 분석 주의사항 및 면책 고지" />
          <div className="flex flex-col gap-2 text-xs text-slate-600 leading-relaxed">
            <p>
              본 보고서는 사진 기반 AI 보조 분석 결과를 포함하고 있습니다.
              AI 분석 결과는 참고 자료이며, 실제 하자 여부 및 보수 방법은
              반드시 시공자 또는 관련 분야 전문가(건축사, 설비기사 등)의
              현장 확인을 통해 최종 판단하시기 바랍니다.
            </p>
            <p>
              분석에 사용된 사진은 사용자 기기 내 IndexedDB에만 저장되며,
              AI 분석 요청 시 사용자 동의 하에 압축본이 일시적으로 Gemini
              Vision API로 전송됩니다.
            </p>
            <p>
              하자체크 AI는 국토교통부 공동주택 하자 기준을 참고하여 설계되었으나,
              법적 효력을 갖는 공식 점검 서비스가 아닙니다.
            </p>
            <p className="font-medium text-slate-700">
              생성일시: {new Date(data.generatedAt).toLocaleString("ko-KR")} · {sessionTitle}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

/* ── Helpers ── */

function SectionTitle({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {num}
      </span>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  );
}

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
}: {
  defect: DefectCandidate;
  analysis: AiAnalysisResult;
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
        유형: {DEFECT_TYPE_LABELS[analysis.defectType]} ·{" "}
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
