// 알 수 없는 경로(이식 10화면 밖). 딥링크 오타·옛 경로가 여기로 온다.
import Link from "next/link";

export default function PendingPage({ path }: { path: string }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-4 px-5 py-8">
      <p className="text-sm text-slate-600">찾을 수 없는 화면입니다.</p>
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
