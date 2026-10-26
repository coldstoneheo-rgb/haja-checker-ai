// app/sessions/[sessionId]/page.tsx 이식본. 바뀐 것: metadata → document.title, «← 세션 목록» 제거.
import SessionOverview from "@/app/sessions/[sessionId]/SessionOverview";
import { useTitle } from "../useTitle";

export default function OverviewPage() {
  useTitle("세션 개요");
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <header>
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          INSPECTION
        </p>
        <h1 className="text-2xl font-bold leading-tight">세션 개요</h1>
      </header>
      <SessionOverview />
    </main>
  );
}
