import Link from "next/link";

const PHASES: { day: string; title: string; status: "done" | "now" | "todo" }[] = [
  { day: "D-11 (4/30)", title: "프로젝트 셋업 · Dexie · PWA 매니페스트", status: "done" },
  { day: "D-10 (5/1)", title: "세션 · 체크리스트 · 사전 준비물", status: "done" },
  { day: "D-9 (5/2)", title: "카메라 · IndexedDB 사진 저장 · 메모", status: "done" },
  { day: "D-8 (5/3)", title: "직접 하자 추가 · 진행률 · 하자 ID", status: "done" },
  { day: "D-7 (5/4)", title: "Gemini Vision API 연동 · 결과 편집", status: "done" },
  { day: "D-6 (5/5)", title: "PDF 보고서 · JSON export 백업", status: "done" },
  { day: "D-5 (5/6)", title: "Service Worker 오프라인 · 사진 3종 가이드", status: "done" },
  { day: "D-4 (5/7)", title: "권한 · 에러 · 사진 품질 경고", status: "done" },
  { day: "D-3 (5/8)", title: "단위 테스트 · iOS Safari 호환성", status: "done" },
  { day: "D-2 (5/9)", title: "1차 실기기 모의 점검", status: "now" },
  { day: "D-1 (5/10)", title: "피드백 반영 hotfix · 종이 백업 PDF", status: "todo" },
  { day: "D-Day (5/11)", title: "실제 점검 수행", status: "todo" },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          HAJA CHECKER · MVP
        </p>
        <h1 className="text-3xl font-bold leading-tight">하자체크 AI</h1>
        <p className="text-sm text-slate-600">
          신축 아파트 사전점검에서 사진 증거를 빠짐없이 수집하고, AI 보조 분석으로
          하자 의심 보고서를 작성합니다.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold">시작하기</h2>
        <p className="text-sm text-slate-600">
          새 점검 세션을 만들어 단지·동·호수 정보를 입력하고 체크리스트를 진행하세요.
        </p>
        <div className="flex gap-2">
          <Link
            href="/sessions/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            새 점검 세션
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            세션 목록
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold">개발 일정 (5/11 점검)</h2>
        <ol className="flex flex-col divide-y divide-slate-100">
          {PHASES.map((phase) => (
            <li
              key={phase.day}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{phase.day}</span>
                <span className="text-slate-600">{phase.title}</span>
              </div>
              <span
                className={
                  phase.status === "now"
                    ? "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                    : phase.status === "done"
                      ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500"
                }
              >
                {phase.status === "now"
                  ? "진행"
                  : phase.status === "done"
                    ? "완료"
                    : "예정"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="text-xs text-slate-500">
        AI 보조 분석 결과는 참고용이며 최종 하자 여부는 시공자·전문가 확인이
        필요합니다.
      </footer>
    </main>
  );
}
