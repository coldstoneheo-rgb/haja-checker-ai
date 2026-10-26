import type {
  ChecklistItem,
  InspectionArea,
  InspectionMode,
  InspectionSession,
  RecipientType,
} from "@/lib/domain/types";
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

/** 모드를 고를 때 수신처 기본값. */
export const DEFAULT_RECIPIENT: Record<InspectionMode, RecipientType> = {
  NEW_BUILD: "BUILDER",
  MOVE_IN: "HOUSE_OWNER",
  MOVE_OUT: "HOUSE_OWNER",
};

/** v1 세션(recipientType 없음) 백필: 모드 기본값 — v1은 mode도 없으니 신축 → "BUILDER". */
export function sessionRecipient(session: Pick<InspectionSession, "mode" | "recipientType">): RecipientType {
  return session.recipientType ?? DEFAULT_RECIPIENT[sessionMode(session)];
}

/** 공간 선택값: 고른 값이 현재 모드 공간 목록에 없으면(세션 로드 전 기본값 등) 첫 공간. */
export function pickArea(areas: string[], chosen: string | null): string {
  return chosen !== null && areas.includes(chosen) ? chosen : areas[0];
}

export function isAiEnabled(mode: InspectionMode): boolean {
  return MODE_CONFIG[mode].aiEnabled;
}

/** 세션 생성 시 넣을 공간·항목(순수 함수 — sessionRepo가 트랜잭션으로 저장한다). */
export function buildSessionSeed(
  sessionId: string,
  mode: InspectionMode,
  now: number,
  newId: () => string,
): { areas: InspectionArea[]; items: ChecklistItem[] } {
  const { areas, seed } = MODE_CONFIG[mode];
  const areaByName = new Map<string, InspectionArea>();
  areas.forEach((name, index) => {
    areaByName.set(name, { id: newId(), sessionId, name, order: index, status: "NOT_STARTED" });
  });
  const items: ChecklistItem[] = seed.map((s, index) => {
    const area = areaByName.get(s.area);
    if (!area) throw new Error(`Checklist seed references unknown area: ${s.area}`);
    return {
      id: newId(),
      sessionId,
      areaId: area.id,
      category: s.category,
      title: s.title,
      description: s.description,
      captureGuide: s.captureGuide,
      requiredPhotoCount: s.requiredPhotoCount,
      priority: s.priority,
      status: "NOT_STARTED",
      isUserAdded: false,
      order: index,
      updatedAt: now,
    };
  });
  return { areas: Array.from(areaByName.values()), items };
}
