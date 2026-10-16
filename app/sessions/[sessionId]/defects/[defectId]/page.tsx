import Link from "next/link";
import DefectDetailView from "./DefectDetailView";

interface Props {
  params: Promise<{ sessionId: string; defectId: string }>;
}

export default async function DefectDetailPage({ params }: Props) {
  const { sessionId, defectId } = await params;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href={`/sessions/${sessionId}/defects`}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
        >
          ← 뒤로
        </Link>
        <h1 className="text-lg font-bold text-slate-900">하자 상세</h1>
      </header>

      <DefectDetailView sessionId={sessionId} defectId={defectId} />
    </main>
  );
}
