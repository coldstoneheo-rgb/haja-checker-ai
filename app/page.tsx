import Link from "next/link";

const STEPS: { title: string; desc: string }[] = [
  {
    title: "세션 만들기",
    desc: "단지·동·호수·평형을 입력해 점검 세션을 생성합니다.",
  },
  {
    title: "체크리스트 + 사진",
    desc: "28개 기본 항목을 순서대로 점검하며 사진을 촬영합니다. EXIF 방향 자동 보정 후 압축 저장됩니다.",
  },
  {
    title: "AI 분석",
    desc: "의심 사진을 Gemini Vision으로 분석해 하자 유형·위험도·수리 난이도를 자동으로 분류합니다.",
  },
  {
    title: "보고서 출력",
    desc: "시공사 제출용 PDF를 바로 인쇄하고, JSON으로 백업해 데이터를 보관합니다.",
  },
];

const FEATURES: { badge: string; title: string; desc: string }[] = [
  {
    badge: "AI",
    title: "AI 하자 분석",
    desc: "균열·누수·타일 손상 등 21개 하자 유형을 자동 분류하고 위험도를 평가합니다.",
  },
  {
    badge: "CAM",
    title: "사진 자동 처리",
    desc: "iOS Safari EXIF 방향 보정, 1024px 압축, 품질 미달 경고까지 자동 처리합니다.",
  },
  {
    badge: "PWA",
    title: "오프라인 지원",
    desc: "사진과 데이터를 기기 내 IndexedDB에 저장해 인터넷 없이도 점검을 이어갈 수 있습니다.",
  },
  {
    badge: "PDF",
    title: "즉시 보고서",
    desc: "점검 완료 즉시 PDF 인쇄와 JSON 백업을 동시에 제공합니다.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          HAJA CHECKER · AI
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
        <h2 className="text-base font-semibold">이렇게 사용하세요</h2>
        <ol className="flex flex-col">
          {STEPS.map((step, idx) => (
            <li key={step.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="my-1 w-0.5 flex-1 bg-orange-100" />
                )}
              </div>
              <div className={`flex flex-col gap-0.5 ${idx < STEPS.length - 1 ? "pb-4" : ""}`}>
                <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                <span className="text-xs leading-relaxed text-slate-500 break-keep">{step.desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold">주요 기능</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
            >
              <span className="text-[10px] font-bold tracking-widest text-orange-500">
                {feature.badge}
              </span>
              <span className="text-sm font-semibold text-slate-900 break-keep">{feature.title}</span>
              <span className="text-xs leading-relaxed text-slate-500 break-keep">{feature.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-xs text-slate-500 break-keep">
        AI 보조 분석 결과는 참고용이며 최종 하자 여부는 시공자·전문가 확인이
        필요합니다.
      </footer>
    </main>
  );
}
