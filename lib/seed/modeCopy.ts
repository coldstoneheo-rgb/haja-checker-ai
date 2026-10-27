// 모드별 화면 문구 — 신축은 «하자/시공», 임대(입주·퇴거)는 «상태/기록». 화면은 이 표에서만 꺼내 쓴다
// (경계: __tests__/modeCopy.test.ts가 임대 값에 «하자»·«시공» 0, 대상 화면 리터럴 0을 지킨다).
// 앱 이름 «하자체크»는 브랜드라 예외다.
import type {
  ChecklistItemStatus,
  DefectType,
  InspectionMode,
  RecipientType,
} from "@/lib/domain/types";
import { MODE_CONFIG } from "@/lib/seed/modes";
import { PREP_ITEMS } from "@/lib/seed/prep";
import {
  CHECKLIST_STATUS_LABELS,
  DEFECT_TYPE_LABELS,
  INSPECTION_MODE_LABELS,
  RECIPIENT_TYPE_LABELS,
} from "@/lib/util/labels";

export interface ModeCopy {
  modeLabel: string;
  /** MODE_CONFIG.aiEnabled */
  aiOn: boolean;
  /** 보고서 표지·대시보드에 «점검 종류»·«수신처» 행을 둘지 — 신축은 기존 화면 그대로(false) */
  showModeMeta: boolean;
  /** 체크리스트 마지막 CTA의 묶음 이름(신축 기존 «의심·하자») */
  flaggedCta: string;
  prepItems: { name: string; note?: string }[];
  /** 직접 추가한 항목 하나를 부르는 말. 신축 = MODE_CONFIG.findingNoun(«하자»),
   *  임대는 findingNoun «상태»가 «직접 추가 상태»처럼 어색해 «기록» */
  entry: string;
  statusLabel: (status: ChecklistItemStatus) => string;
  /** 체크리스트 «의심/하자» 묶음 */
  flagged: string;
  /** 선택 가능한 유형(임대는 «미시공» 제외) */
  defectTypes: DefectType[];
  defectTypeLabel: (type: DefectType) => string;
  recipients: RecipientType[];
  recipientLabel: (type: RecipientType) => string;
  /** 신축만: 시공사 필드 라벨. null이면 필드·표시를 숨긴다 */
  builderLabel: string | null;
  /** 대시보드·보고서 표지의 시공사 행 라벨(입력란 라벨과 다름 — 신축 원문 «시공사»). null이면 숨긴다 */
  builderDisplayLabel: string | null;
  builderPlaceholder: string;
  /** 신축만: 입주예정일 라벨. null이면 숨긴다 */
  moveInDateLabel: string | null;
  inspectorPlaceholder: string;
  checklistIntro: string;
  directTitle: string;
  directEmpty: string;
  directFirstAdd: string;
  directAdd: string;
  directDeleteConfirm: string;
  directNewTitle: string;
  directNewIntro: string;
  directTypeLabel: string;
  directMemoPlaceholder: string;
  directSave: string;
  directDetailTitle: string;
  directNotFound: string;
  reportTitle: string;
  /** 종이 백업 빈 체크리스트 제목(reportRepo.buildBlankChecklistHtml) */
  blankChecklistTitle: string;
  reportDirectSection: string;
  reportRequestSection: string;
  reportRequestIntro: string;
}

const NEW_BUILD: ModeCopy = {
  modeLabel: INSPECTION_MODE_LABELS.NEW_BUILD,
  aiOn: MODE_CONFIG.NEW_BUILD.aiEnabled,
  showModeMeta: false,
  flaggedCta: "의심·하자",
  prepItems: PREP_ITEMS,
  entry: MODE_CONFIG.NEW_BUILD.findingNoun,
  statusLabel: (s) => CHECKLIST_STATUS_LABELS[s],
  flagged: "의심/하자",
  defectTypes: Object.keys(DEFECT_TYPE_LABELS) as DefectType[],
  defectTypeLabel: (t) => DEFECT_TYPE_LABELS[t],
  recipients: Object.keys(RECIPIENT_TYPE_LABELS) as RecipientType[],
  recipientLabel: (r) => RECIPIENT_TYPE_LABELS[r],
  builderLabel: "시공사 / 시행사",
  builderDisplayLabel: "시공사",
  builderPlaceholder: "시공자에게 보낼 보고서에 표시됩니다",
  moveInDateLabel: "입주예정일",
  inspectorPlaceholder: "입주예정자 또는 동행자",
  checklistIntro: "공간 탭을 눌러 이동하고, 항목별로 양호/의심/하자/확인불가를 표시하세요.",
  directTitle: "직접 추가 하자",
  directEmpty: "직접 추가한 하자가 없습니다.",
  directFirstAdd: "첫 하자 추가",
  directAdd: "하자 추가",
  directDeleteConfirm: "이 하자를 삭제하시겠습니까?",
  directNewTitle: "하자 직접 추가",
  directNewIntro:
    "체크리스트 항목과 무관하게 현장에서 발견한 하자를 직접 기록합니다. 하자 ID(D-YYYYMMDD-NNN)가 자동으로 생성됩니다.",
  directTypeLabel: "하자 유형",
  directMemoPlaceholder: "하자 상태, 발견 경위, 시공사 요청 내용 등",
  directSave: "하자 저장",
  directDetailTitle: "하자 상세",
  directNotFound: "하자를 찾을 수 없습니다.",
  reportTitle: "사전점검 하자 보고서",
  blankChecklistTitle: "사전점검 체크리스트 (종이 백업)",
  reportDirectSection: "직접 추가 하자 목록",
  reportRequestSection: "시공자 요청 문구 모음",
  reportRequestIntro: "아래 문구를 시공사 하자 접수 시 그대로 사용하실 수 있습니다.",
};

const RENTAL_STATUS: Partial<Record<ChecklistItemStatus, string>> = { DEFECT: "손상" };

function rental(mode: "MOVE_IN" | "MOVE_OUT"): ModeCopy {
  return {
    modeLabel: INSPECTION_MODE_LABELS[mode],
    aiOn: MODE_CONFIG[mode].aiEnabled,
    showModeMeta: true,
    flaggedCta: "의심·손상",
    prepItems: PREP_ITEMS.map((p) =>
      p.name === "포스트잇 또는 하자 표시 스티커" ? { ...p, name: "포스트잇 또는 표시 스티커" } : p,
    ),
    entry: "기록",
    statusLabel: (s) => RENTAL_STATUS[s] ?? CHECKLIST_STATUS_LABELS[s],
    flagged: "의심/손상",
    defectTypes: NEW_BUILD.defectTypes.filter((t) => t !== "MISSING_WORK"),
    defectTypeLabel: (t) => DEFECT_TYPE_LABELS[t],
    recipients: NEW_BUILD.recipients.filter((r) => r !== "BUILDER"),
    // PR5 이전 임대 세션에 저장된 BUILDER는 값은 두고 중립 라벨로만 보인다(«시공사» 노출 0).
    // RecipientType에 «기타» 값이 생기면 이 라벨과 겹치니 그때 다시 정한다.
    recipientLabel: (r) => (r === "BUILDER" ? "기타" : RECIPIENT_TYPE_LABELS[r]),
    builderLabel: null,
    builderDisplayLabel: null,
    builderPlaceholder: "",
    moveInDateLabel: null,
    inspectorPlaceholder: "본인 또는 동행자",
    checklistIntro: "공간 탭을 눌러 이동하고, 항목별로 양호/의심/손상/확인불가를 표시하세요.",
    directTitle: "직접 추가 기록",
    directEmpty: "직접 추가한 기록이 없습니다.",
    directFirstAdd: "첫 기록 추가",
    directAdd: "기록 추가",
    directDeleteConfirm: "이 기록을 삭제하시겠습니까?",
    directNewTitle: "기록 직접 추가",
    directNewIntro:
      "체크리스트 항목과 무관하게 현장에서 본 상태를 직접 기록합니다. 기록 ID(D-YYYYMMDD-NNN)가 자동으로 생성됩니다.",
    directTypeLabel: "상태 유형",
    directMemoPlaceholder: "상태, 발견 위치, 전달할 내용 등",
    directSave: "기록 저장",
    directDetailTitle: "기록 상세",
    directNotFound: "기록을 찾을 수 없습니다.",
    reportTitle: `${INSPECTION_MODE_LABELS[mode]} 보고서`,
    blankChecklistTitle: `${INSPECTION_MODE_LABELS[mode]} 체크리스트 (종이 백업)`,
    reportDirectSection: "직접 추가 기록 목록",
    reportRequestSection: "전달 문구 모음",
    reportRequestIntro: "아래 문구를 수신처에 전달할 때 그대로 사용하실 수 있습니다.",
  };
}

export const MODE_COPY: Record<InspectionMode, ModeCopy> = {
  NEW_BUILD,
  MOVE_IN: rental("MOVE_IN"),
  MOVE_OUT: rental("MOVE_OUT"),
};
