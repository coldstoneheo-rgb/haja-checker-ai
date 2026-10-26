// 보고서 절 제목 — ReportView와 ReportAiDisclaimer가 같이 쓴다.
export function SectionTitle({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {num}
      </span>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  );
}
