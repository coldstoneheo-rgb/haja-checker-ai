"use client";

import { useState } from "react";
import AiNoticeDialog from "@/components/AiNoticeDialog";
import { ackAiNotice, needsAiNotice } from "@/lib/ai/notice";

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * AI 분석 진입점 공용 게이트: 첫 이용이면 고지를 띄우고, 확인한 뒤에만 run을 부른다(확인 전 네트워크 0).
 * analyzeChecklistItem·analyzeDirectDefect를 부르는 화면은 모두 이 guarded를 거친다.
 */
export function useAiNoticeGate() {
  const [pendingRun, setPendingRun] = useState<(() => void) | null>(null);

  function guarded(run: () => void) {
    if (needsAiNotice(browserStorage())) setPendingRun(() => run);
    else run();
  }

  const dialog = pendingRun ? (
    <AiNoticeDialog
      onCancel={() => setPendingRun(null)}
      onConfirm={() => {
        ackAiNotice(browserStorage());
        const run = pendingRun;
        setPendingRun(null);
        run();
      }}
    />
  ) : null;

  return { guarded, dialog };
}
