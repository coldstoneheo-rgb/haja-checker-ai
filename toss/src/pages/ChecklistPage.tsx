// app/sessions/[sessionId]/checklist/page.tsx 이식본. 바뀐 것: metadata → document.title, «← 세션 개요» 제거, 안내 문구는 모드별.
import ChecklistView from "@/app/sessions/[sessionId]/checklist/ChecklistView";
import { useModeCopy } from "@/components/useModeCopy";
import { useTitle } from "../useTitle";

export default function ChecklistPage({ sessionId }: { sessionId: string }) {
  useTitle("체크리스트");
  const copy = useModeCopy(sessionId);
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
      <header>
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          CHECKLIST
        </p>
        <h1 className="text-2xl font-bold leading-tight">공간별 체크리스트</h1>
        {copy && <p className="mt-1 text-sm text-slate-600">{copy.checklistIntro}</p>}
      </header>
      <ChecklistView />
    </main>
  );
}
