import Link from "next/link";
import SessionsList from "./SessionsList";

export const metadata = {
  title: "점검 세션 · 하자체크 AI",
};

export default function SessionsListPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
      >
        ← 홈으로
      </Link>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500">
            SESSIONS
          </p>
          <h1 className="text-2xl font-bold leading-tight">점검 세션 목록</h1>
        </div>
        <Link
          href="/sessions/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          새 세션
        </Link>
      </header>
      <SessionsList />
    </main>
  );
}
