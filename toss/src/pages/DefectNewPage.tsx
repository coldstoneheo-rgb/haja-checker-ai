// app/sessions/[sessionId]/defects/new/page.tsx 이식본. 바뀐 것: «← 뒤로» 제거, document.title 추가, 문구는 모드별.
import NewDefectForm from "@/app/sessions/[sessionId]/defects/new/NewDefectForm";
import { useModeCopy } from "@/components/useModeCopy";
import { useTitle } from "../useTitle";

export default function DefectNewPage({ sessionId }: { sessionId: string }) {
  const copy = useModeCopy(sessionId);
  useTitle(copy?.directNewTitle ?? "직접 추가");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header>
        <h1 className="text-lg font-bold text-slate-900">{copy?.directNewTitle}</h1>
      </header>

      {copy && <p className="text-xs text-slate-500">{copy.directNewIntro}</p>}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <NewDefectForm sessionId={sessionId} />
      </div>
    </main>
  );
}
