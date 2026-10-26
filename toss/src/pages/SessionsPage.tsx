// app/sessions/page.tsx 이식본. 바뀐 것: metadata → document.title, «홈으로» 링크 → 헤더의 «사용법»(첫 화면 = 세션 목록).
import Link from "next/link";
import SessionsList from "@/app/sessions/SessionsList";
import { useTitle } from "../useTitle";

export default function SessionsPage() {
  useTitle("점검 세션");
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500">
            SESSIONS
          </p>
          <h1 className="text-2xl font-bold leading-tight">점검 세션 목록</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/home"
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            사용법
          </Link>
          <Link
            href="/sessions/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            새 세션
          </Link>
        </div>
      </header>
      <SessionsList />
    </main>
  );
}
