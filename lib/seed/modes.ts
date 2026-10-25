import type { InspectionMode, InspectionSession } from "@/lib/domain/types";
import { CHECKLIST_SEED, DEFAULT_AREAS, type ChecklistSeedItem } from "@/lib/seed/checklist";
import { RENTAL_AREAS, RENTAL_CHECKLIST_SEED } from "@/lib/seed/rentalChecklist";

export interface ModeConfig {
  areas: string[];
  seed: ChecklistSeedItem[];
  /** AI 분석 허용. 임대(입주·퇴거) v1은 끔 — 켜는 조건은 신축 월 비용 실측 2회 뒤(PLAN §8 LC 판단 3). */
  aiEnabled: boolean;
  /** 결과·보고서에서 항목을 부르는 말. 퇴거는 «상태». */
  findingNoun: "하자" | "상태";
}

export const MODE_CONFIG: Record<InspectionMode, ModeConfig> = {
  NEW_BUILD: { areas: DEFAULT_AREAS, seed: CHECKLIST_SEED, aiEnabled: true, findingNoun: "하자" },
  MOVE_IN: { areas: RENTAL_AREAS, seed: RENTAL_CHECKLIST_SEED, aiEnabled: false, findingNoun: "상태" },
  MOVE_OUT: { areas: RENTAL_AREAS, seed: RENTAL_CHECKLIST_SEED, aiEnabled: false, findingNoun: "상태" },
};

/** v1 세션(mode 없음)은 신축으로 본다. */
export function sessionMode(session: Pick<InspectionSession, "mode">): InspectionMode {
  return session.mode ?? "NEW_BUILD";
}

export function isAiEnabled(mode: InspectionMode): boolean {
  return MODE_CONFIG[mode].aiEnabled;
}
