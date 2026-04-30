import Link from "next/link";
import ChecklistView from "./ChecklistView";

export const metadata = {
  title: "체크리스트 · 하자체크 AI",
};

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function ChecklistPage({ params }: Props) {
  const { sessionId } = await params;
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <Link
        href={`/sessions/${sessionId}`}
        className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
      >
        ← 세션 개요
      </Link>
      <header>
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          CHECKLIST
        </p>
        <h1 className="text-2xl font-bold leading-tight">공간별 체크리스트</h1>
        <p className="mt-1 text-sm text-slate-600">
          공간 탭을 눌러 이동하고, 항목별로 양호/의심/하자/확인불가를 표시하세요.
        </p>
      </header>
      <ChecklistView />
    </main>
  );
}
