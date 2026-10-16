import Link from "next/link";
import ReportView from "./ReportView";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function ReportPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6 print:px-0 print:pt-0 print:max-w-none">
      <header className="flex items-center gap-3 print:hidden">
        <Link
          href={`/sessions/${sessionId}`}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
        >
          ← 뒤로
        </Link>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900">PDF 보고서</h1>
          <p className="text-xs text-slate-500">인쇄하거나 JSON으로 백업합니다</p>
        </div>
      </header>

      <ReportView sessionId={sessionId} />
    </main>
  );
}
