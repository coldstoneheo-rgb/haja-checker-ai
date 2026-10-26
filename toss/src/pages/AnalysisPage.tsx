// app/sessions/[sessionId]/analysis/page.tsx 이식본. 바뀐 것: «← 뒤로» 제거, document.title 추가.
import AnalysisView from "@/app/sessions/[sessionId]/analysis/AnalysisView";
import { useTitle } from "../useTitle";

export default function AnalysisPage({ sessionId }: { sessionId: string }) {
  useTitle("AI 하자 분석");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900">AI 하자 분석</h1>
        <p className="text-xs text-slate-500">
          의심/하자 항목을 Gemini Vision으로 분석합니다
        </p>
      </header>

      <AnalysisView sessionId={sessionId} />
    </main>
  );
}
