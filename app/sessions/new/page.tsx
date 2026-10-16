import Link from "next/link";
import NewSessionForm from "./NewSessionForm";

export const metadata = {
  title: "새 점검 세션 · 하자체크 AI",
};

export default function NewSessionPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
      >
        ← 홈으로
      </Link>
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          NEW SESSION
        </p>
        <h1 className="text-2xl font-bold leading-tight">새 점검 세션</h1>
        <p className="text-sm text-slate-600">
          단지·동·호수와 점검자 정보를 입력하면 표준 체크리스트가 자동으로
          준비됩니다.
        </p>
      </header>
      <NewSessionForm />
    </main>
  );
}
