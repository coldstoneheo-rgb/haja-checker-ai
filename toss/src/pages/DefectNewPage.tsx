// app/sessions/[sessionId]/defects/new/page.tsx 이식본. 바뀐 것: «← 뒤로» 제거, document.title 추가.
import NewDefectForm from "@/app/sessions/[sessionId]/defects/new/NewDefectForm";
import { useTitle } from "../useTitle";

export default function DefectNewPage({ sessionId }: { sessionId: string }) {
  useTitle("하자 직접 추가");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header>
        <h1 className="text-lg font-bold text-slate-900">하자 직접 추가</h1>
      </header>

      <p className="text-xs text-slate-500">
        체크리스트 항목과 무관하게 현장에서 발견한 하자를 직접 기록합니다.
        하자 ID(D-YYYYMMDD-NNN)가 자동으로 생성됩니다.
      </p>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <NewDefectForm sessionId={sessionId} />
      </div>
    </main>
  );
}
