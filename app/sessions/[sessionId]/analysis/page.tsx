import Link from "next/link";
import AnalysisView from "./AnalysisView";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function AnalysisPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href={`/sessions/${sessionId}`}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
        >
          ← 뒤로
        </Link>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900">AI 하자 분석</h1>
          <p className="text-xs text-slate-500">
            의심/하자 항목을 Gemini Vision으로 분석합니다
          </p>
        </div>
      </header>

      <AnalysisView sessionId={sessionId} />
    </main>
  );
}
