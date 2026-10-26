// 보고서 7절 «AI 분석 주의사항 및 면책 고지» — ReportView에서 문안 그대로 옮겼다.
// AI를 쓰는 모드(신축)에서만 렌더된다. 문안 정리는 사용자 ASK(동의·고지·면책 중복) 때.
import { REPORT_AI_FIXED_TEXT } from "@/lib/ai/notice";
import { SectionTitle } from "./reportParts";

export default function ReportAiDisclaimer({
  generatedAt,
  sessionTitle,
}: {
  generatedAt: number;
  sessionTitle: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 print:break-before-page print:pt-10">
      <SectionTitle num={7} title="AI 분석 주의사항 및 면책 고지" />
      <div className="flex flex-col gap-2 text-xs text-slate-600 leading-relaxed">
        <p className="text-sm font-semibold text-slate-900">{REPORT_AI_FIXED_TEXT}</p>
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
          생성일시: {new Date(generatedAt).toLocaleString("ko-KR")} · {sessionTitle}
        </p>
      </div>
    </section>
  );
}
