// app/sessions/[sessionId]/report/page.tsx 이식본. 바뀐 것: «← 뒤로» 제거, document.title 추가,
// 부제 «인쇄하거나…» → 인쇄 없는 문구(토스: 인쇄·새 창 0, 출력은 lib/platform 어댑터의 토스 스텁).
import ReportView from "@/app/sessions/[sessionId]/report/ReportView";
import { useTitle } from "../useTitle";

export default function ReportPage({ sessionId }: { sessionId: string }) {
  useTitle("보고서");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900">보고서</h1>
        <p className="text-xs text-slate-500">이미지로 저장하거나 JSON으로 백업합니다</p>
      </header>

      <ReportView sessionId={sessionId} />
    </main>
  );
}
