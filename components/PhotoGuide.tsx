const GUIDE_STEPS = [
  {
    label: "① 전체 위치",
    desc: "결함이 있는 공간 전체가 보이는 원거리 사진 — 위치 맥락 파악용",
    hint: "2~3m 거리에서 넓게 촬영",
  },
  {
    label: "② 부위 포함",
    desc: "결함 부위와 주변이 보이는 중거리 사진 — AI 분석 및 보수 범위 판단용",
    hint: "1m 내외에서 결함 부위 중심으로 촬영",
  },
  {
    label: "③ 클로즈업",
    desc: "결함을 최대한 가까이 촬영한 근접 사진 — 상세 확인·증거 보존용",
    hint: "최대한 접근, 손가락으로 크기 비교 가능하면 더 좋음",
  },
];

interface Props {
  compact?: boolean;
}

export default function PhotoGuide({ compact = false }: Props) {
  if (compact) {
    return (
      <p className="text-[11px] text-slate-400">
        권장: ① 전체 위치 · ② 부위 포함 · ③ 클로즈업 3장 촬영
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-blue-50 px-3 py-3 ring-1 ring-blue-100">
      <p className="text-xs font-semibold text-blue-800">📷 사진 3종 촬영 가이드</p>
      <ol className="flex flex-col gap-2">
        {GUIDE_STEPS.map((step) => (
          <li key={step.label} className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-blue-900">{step.label}</span>
            <span className="text-[11px] text-blue-700">{step.desc}</span>
            <span className="text-[11px] italic text-blue-500">{step.hint}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
