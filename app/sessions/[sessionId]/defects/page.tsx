import Link from "next/link";
import DefectsList from "./DefectsList";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function DefectsPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/sessions/${sessionId}`}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
          >
            ← 뒤로
          </Link>
          <h1 className="text-lg font-bold text-slate-900">직접 추가 하자</h1>
        </div>
        <Link
          href={`/sessions/${sessionId}/defects/new`}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          + 추가
        </Link>
      </header>

      <DefectsList />
    </main>
  );
}
