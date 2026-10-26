// app/sessions/new/page.tsx 이식본. 바뀐 것: metadata → document.title, «← 홈으로» 제거(토스 상단 바 뒤로).
import NewSessionForm from "@/app/sessions/new/NewSessionForm";
import { useTitle } from "../useTitle";

export default function SessionNewPage() {
  useTitle("새 점검 세션");
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 px-5 py-8">
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
