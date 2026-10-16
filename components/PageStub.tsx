import Link from "next/link";
import type { ReactNode } from "react";

interface PageStubProps {
  title: string;
  day: string;
  children?: ReactNode;
}

export default function PageStub({ title, day, children }: PageStubProps) {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
      >
        ← 홈으로
      </Link>
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-amber-600">
          {day}
        </p>
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
      </header>
      <section className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        {children ?? (
          <p>이 화면은 다음 단계에서 구현됩니다. (D-11 스캐폴드)</p>
        )}
      </section>
    </main>
  );
}
