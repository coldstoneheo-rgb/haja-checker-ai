// app/sessions/[sessionId]/checklist/page.tsx 이식본. 바뀐 것: metadata → document.title, «← 세션 개요» 제거.
import ChecklistView from "@/app/sessions/[sessionId]/checklist/ChecklistView";
import { useTitle } from "../useTitle";

export default function ChecklistPage() {
  useTitle("체크리스트");
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
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
