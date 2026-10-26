// app/sessions/[sessionId]/defects/page.tsx 이식본. 바뀐 것: «← 뒤로» 제거, document.title 추가.
import Link from "next/link";
import DefectsList from "@/app/sessions/[sessionId]/defects/DefectsList";
import { useTitle } from "../useTitle";

export default function DefectsPage({ sessionId }: { sessionId: string }) {
  useTitle("직접 추가 하자");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-900">직접 추가 하자</h1>
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
