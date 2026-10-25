// 아직 이식하지 않은 경로. 이식 조각마다 router.ts의 matchRoute로 하나씩 옮긴다.
import Link from "next/link";

export default function PendingPage({ path }: { path: string }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-4 px-5 py-8">
      <p className="text-sm text-slate-600">이 화면은 준비 중입니다.</p>
      <p className="text-xs text-slate-400 break-all">{path}</p>
      <Link
        href="/sessions"
        className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        세션 목록으로
      </Link>
    </main>
  );
}
