// 임대(입주·퇴거) 모드 렌더에서 «하자»·«시공» 0 — node 환경이라 렌더 대신 (1) 문구 표 값 (2) 화면 리터럴 정적 검사.
import { describe, expect, it } from "vitest";
import type { ChecklistItemStatus, InspectionMode } from "@/lib/domain/types";
import { CHECKLIST_STATUS_LABELS } from "@/lib/util/labels";
import { MODE_COPY } from "@/lib/seed/modeCopy";
import { read, tossGraph } from "./helpers/tossGraph";

/** 브랜드 «하자체크»를 뺀 «하자»·«시공» */
const BANNED = /하자(?!체크)|시공/;
const RENTAL: InspectionMode[] = ["MOVE_IN", "MOVE_OUT"];
const STATUSES = Object.keys(CHECKLIST_STATUS_LABELS) as ChecklistItemStatus[];

/** 문구 표의 화면 노출 값 전부(함수는 도메인 전체에 대해 펼친다) */
function rendered(mode: InspectionMode): string[] {
  const c = MODE_COPY[mode];
  const out: string[] = [];
  for (const v of Object.values(c)) if (typeof v === "string") out.push(v);
  out.push(...STATUSES.map(c.statusLabel));
  out.push(...c.defectTypes.map(c.defectTypeLabel));
  out.push(...c.recipients.map(c.recipientLabel));
  return out;
}

describe("모드 문구 표", () => {
  it.each(RENTAL)("%s: 노출 값에 «하자»·«시공» 0", (mode) => {
    expect(rendered(mode).filter((s) => BANNED.test(s))).toEqual([]);
    expect(MODE_COPY[mode].builderLabel).toBeNull();
    expect(MODE_COPY[mode].moveInDateLabel).toBeNull();
  });

  it("신축은 기존 문구 그대로(Next 웹 회귀 0)", () => {
    const c = MODE_COPY.NEW_BUILD;
    expect(c.statusLabel("DEFECT")).toBe("하자");
    expect(c.builderLabel).toBe("시공사 / 시행사");
    expect(c.moveInDateLabel).toBe("입주예정일");
    expect(c.reportTitle).toBe("사전점검 하자 보고서");
    expect(c.defectTypes).toContain("MISSING_WORK");
    expect(c.recipients).toContain("BUILDER");
  });
});

// 신축 전용 화면(AI 분석)과 AI 면책 절은 임대에서 렌더되지 않으므로(아래 가드 테스트) 리터럴 검사에서 뺀다
const NEW_BUILD_ONLY = new Set([
  "app/sessions/[sessionId]/analysis/AnalysisView.tsx",
  "app/sessions/[sessionId]/analysis/AnalysisResultCard.tsx",
  "app/sessions/[sessionId]/report/ReportAiDisclaimer.tsx",
  "toss/src/pages/AnalysisPage.tsx",
  "toss/src/pages/HomePage.tsx", // 세션 밖 소개 화면(모드 없음)
]);

/** 주석을 지운 소스 */
const stripComments = (src: string) =>
  src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/([^:"'`])\/\/.*$/gm, "$1");

describe("화면 리터럴 정적 검사(toss 진입 그래프의 .tsx)", () => {
  const screens = tossGraph().files.filter((f) => f.endsWith(".tsx") && !NEW_BUILD_ONLY.has(f));

  it("«하자»·«시공» 리터럴 0 — 문구는 MODE_COPY에서", () => {
    const bad = screens.flatMap((f) =>
      stripComments(read(f))
        .split("\n")
        .map((line, i) => [i + 1, line] as const)
        .filter(([, line]) => BANNED.test(line))
        .map(([n, line]) => `${f}:${n} ${line.trim()}`),
    );
    expect(bad).toEqual([]);
  });

  it("상태·유형·수신처 라벨 맵을 직접 쓰지 않는다(MODE_COPY 경유)", () => {
    const bad = screens.filter((f) =>
      /\b(CHECKLIST_STATUS_LABELS|DEFECT_TYPE_LABELS|RECIPIENT_TYPE_LABELS)\b/.test(read(f)),
    );
    expect(bad).toEqual([]);
  });
});

describe("임대 모드 AI 잔여 가드", () => {
  it("대시보드·체크리스트의 «AI 분석» CTA는 aiOn일 때만", () => {
    for (const f of [
      "app/sessions/[sessionId]/SessionOverview.tsx",
      "app/sessions/[sessionId]/checklist/ChecklistView.tsx",
    ]) {
      const src = read(f);
      expect(src, f).toMatch(/const aiOn = .*isAiEnabled\(sessionMode\(session\)\)/);
      // /analysis로 가는 모든 지점이 aiOn 조건 안에 있다: aiOn 언급 없이 analysis로 가는 줄 0
      const lines = src.split("\n");
      lines.forEach((line, i) => {
        if (/\/analysis[`"]/.test(line)) {
          const window = lines.slice(Math.max(0, i - 12), i + 1).join("\n");
          expect(window, `${f}:${i + 1}`).toMatch(/aiOn/);
        }
      });
    }
  });

  it("보고서 AI 면책 절은 aiOn일 때만 렌더, 문안은 별도 파일로 옮겼을 뿐 그대로", () => {
    const view = read("app/sessions/[sessionId]/report/ReportView.tsx");
    expect(view).toMatch(/\{aiOn && <ReportAiDisclaimer\b/);
    const disc = read("app/sessions/[sessionId]/report/ReportAiDisclaimer.tsx");
    expect(disc).toContain("REPORT_AI_FIXED_TEXT");
    expect(disc).toContain("법적 효력을 갖는 공식 점검 서비스가 아닙니다.");
  });
});

describe("백필·공간 초기값", () => {
  it("v1 세션 recipientType 없음 → BUILDER, 임대는 모드 기본값", async () => {
    const { sessionRecipient } = await import("@/lib/seed/modes");
    expect(sessionRecipient({})).toBe("BUILDER");
    expect(sessionRecipient({ mode: "MOVE_OUT" })).toBe("HOUSE_OWNER");
    expect(sessionRecipient({ mode: "MOVE_IN", recipientType: "MANAGEMENT_OFFICE" })).toBe("MANAGEMENT_OFFICE");
  });

  it("NewDefectForm 공간: 세션을 읽은 뒤 그 모드의 areas[0]", async () => {
    const { MODE_CONFIG, pickArea } = await import("@/lib/seed/modes");
    const rentalAreas = MODE_CONFIG.MOVE_IN.areas;
    expect(pickArea(rentalAreas, null)).toBe(rentalAreas[0]);
    // 로드 전 신축 기본값으로 고른 값이 임대 목록에 없으면 임대 첫 공간
    const onlyNew = MODE_CONFIG.NEW_BUILD.areas.find((a) => !rentalAreas.includes(a));
    if (onlyNew) expect(pickArea(rentalAreas, onlyNew)).toBe(rentalAreas[0]);
    expect(pickArea(rentalAreas, rentalAreas[1])).toBe(rentalAreas[1]);
    const form = read("app/sessions/[sessionId]/defects/new/NewDefectForm.tsx");
    expect(form).toMatch(/pickArea\(areas, chosenArea\)/);
  });
});
