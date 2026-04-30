import Link from "next/link";
import SessionOverview from "./SessionOverview";

export const metadata = {
  title: "세션 개요 · 하자체크 AI",
};

export default function SessionOverviewPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/sessions"
          className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
        >
          ← 세션 목록
        </Link>
      </div>
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
