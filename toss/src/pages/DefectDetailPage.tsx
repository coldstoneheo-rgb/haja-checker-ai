// app/sessions/[sessionId]/defects/[defectId]/page.tsx 이식본. 바뀐 것: «← 뒤로» 제거, document.title 추가, 제목은 모드별.
import DefectDetailView from "@/app/sessions/[sessionId]/defects/[defectId]/DefectDetailView";
import { useModeCopy } from "@/components/useModeCopy";
import { useTitle } from "../useTitle";

export default function DefectDetailPage({ sessionId, defectId }: { sessionId: string; defectId: string }) {
  const copy = useModeCopy(sessionId);
  useTitle(copy?.directDetailTitle ?? "상세");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-10 pt-6">
      <header>
        <h1 className="text-lg font-bold text-slate-900">{copy?.directDetailTitle}</h1>
      </header>

      <DefectDetailView sessionId={sessionId} defectId={defectId} />
    </main>
  );
}
