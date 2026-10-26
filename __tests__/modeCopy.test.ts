// 임대(입주·퇴거) 모드 렌더에서 «하자»·«시공» 0 — node 환경이라 렌더 대신 (1) 문구 표 값 (2) 화면 리터럴(AST) 정적 검사 (3) .ts 상수.
import { describe, expect, it } from "vitest";
import type { ChecklistItemStatus, InspectionMode } from "@/lib/domain/types";
import { CHECKLIST_STATUS_LABELS } from "@/lib/util/labels";
import ts from "typescript";
import { MODE_COPY } from "@/lib/seed/modeCopy";
import { analysisPath, MODE_CONFIG } from "@/lib/seed/modes";
import { PREP_ITEMS } from "@/lib/seed/prep";
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
    expect(c.flaggedCta).toBe("의심·하자"); // 체크리스트 마지막 CTA 원문
    expect(c.showModeMeta).toBe(false); // 보고서 표지·대시보드에 «점검 종류»·«수신처» 행 없음(기존 그대로)
    expect(c.prepItems).toBe(PREP_ITEMS);
    expect(PREP_ITEMS.map((p) => p.name)).toContain("포스트잇 또는 하자 표시 스티커");
  });
});

// 신축 전용 화면(AI 분석)과 AI 면책 절은 임대에서 렌더되지 않으므로(아래 가드 테스트) 리터럴 검사에서 뺀다
const NEW_BUILD_ONLY = new Set([
  "app/sessions/[sessionId]/analysis/AnalysisView.tsx", // 임대: 본문 대신 «AI 분석을 쓰지 않아요»(그 문구엔 «하자» 없음)
  "app/sessions/[sessionId]/analysis/AnalysisResultCard.tsx",
  "app/sessions/[sessionId]/report/ReportAiDisclaimer.tsx",
  "toss/src/pages/AnalysisPage.tsx", // 헤더는 copy.aiOn일 때만(아래 가드)
  "toss/src/pages/HomePage.tsx", // 세션 밖 소개 화면(모드 없음)
]);

/** 소스의 문자열 리터럴·템플릿 조각·JSX 텍스트(주석은 AST 노드가 아니라 자연히 빠진다) */
function literalsOf(file: string): { line: number; text: string }[] {
  const src = read(file);
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: { line: number; text: string }[] = [];
  const visit = (n: ts.Node) => {
    if (
      ts.isStringLiteral(n) ||
      ts.isNoSubstitutionTemplateLiteral(n) ||
      ts.isTemplateHead(n) ||
      ts.isTemplateMiddle(n) ||
      ts.isTemplateTail(n) ||
      ts.isJsxText(n)
    ) {
      out.push({ line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, text: n.text });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

describe("화면 리터럴 정적 검사(toss 진입 그래프의 .tsx)", () => {
  const screens = tossGraph().files.filter((f) => f.endsWith(".tsx") && !NEW_BUILD_ONLY.has(f));

  it("리터럴 추출기: 주석은 빼고, 문자열 안 // · /* 는 문자열로 본다", () => {
    const sample = read("app/sessions/[sessionId]/checklist/PhotoCaptureButton.tsx");
    expect(sample).toContain('accept="image/*"');
    expect(literalsOf("app/sessions/[sessionId]/checklist/PhotoCaptureButton.tsx").map((l) => l.text)).toContain("image/*");
  });

  it("«하자»·«시공» 리터럴 0 — 문구는 MODE_COPY에서", () => {
    const bad = screens.flatMap((f) =>
      literalsOf(f)
        .filter(({ text }) => BANNED.test(text))
        .map(({ line, text }) => `${f}:${line} ${text.trim()}`),
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

describe("임대에서 렌더되는 .ts 상수", () => {
  it("공간·추천 동선·임대 시드·위험도·보수·하자상태·빠른 태그 라벨에 «하자»·«시공» 0", async () => {
    const { RENTAL_AREAS, RENTAL_CHECKLIST_SEED } = await import("@/lib/seed/rentalChecklist");
    const { RECOMMENDED_ROUTE } = await import("@/lib/seed/prep");
    const { QUICK_TAGS } = await import("@/lib/seed/quickTags");
    const L = await import("@/lib/util/labels");
    const values = [
      ...RENTAL_AREAS,
      ...RECOMMENDED_ROUTE,
      ...QUICK_TAGS,
      ...RENTAL_CHECKLIST_SEED.flatMap((s) => [s.area, s.category, s.title, s.description, s.captureGuide]),
      ...Object.values(L.RISK_LEVEL_LABELS),
      ...Object.values(L.REPAIR_DIFFICULTY_LABELS),
      ...Object.values(L.DEFECT_STATUS_LABELS),
      ...Object.values(L.INSPECTION_MODE_LABELS),
    ];
    expect(values.filter((v) => BANNED.test(v))).toEqual([]);
  });
});

describe("임대 모드 AI 잔여 가드", () => {
  it("analysisPath: AI 끈 모드는 null, 신축은 분석 경로", () => {
    expect(analysisPath("s1", "NEW_BUILD")).toBe("/sessions/s1/analysis");
    expect(analysisPath("s1", "MOVE_IN")).toBeNull();
    expect(analysisPath("s1", "MOVE_OUT")).toBeNull();
  });

  it("대시보드·체크리스트의 «AI 분석» CTA는 analysisPath 값으로만 간다(리터럴 경로 0 · null이면 타입이 href·push를 막는다)", () => {
    for (const f of [
      "app/sessions/[sessionId]/SessionOverview.tsx",
      "app/sessions/[sessionId]/checklist/ChecklistView.tsx",
    ]) {
      const src = read(f);
      expect(src, f).not.toMatch(/\/analysis/);
      expect(src, f).toMatch(/^\s*const aiHref = (session \? )?analysisPath\(sessionId, sessionMode\(session\)\)( : null)?;$/m);
    }
    expect(read("app/sessions/[sessionId]/SessionOverview.tsx")).toMatch(/\{aiHref && \(\s*<Link\s+href=\{aiHref\}/);
    const cl = read("app/sessions/[sessionId]/checklist/ChecklistView.tsx");
    expect(cl.match(/router\.push\(aiHref\)/g)).toHaveLength(2);
    expect(cl).toMatch(/isLastArea && aiHref \?/);
    expect(cl).toMatch(/\{aiHref && suspectedCount > 0 &&/);
  });

  it("보고서 AI 면책 절·toss 분석 헤더는 copy.aiOn(= MODE_CONFIG.aiEnabled)일 때만", () => {
    for (const m of ["NEW_BUILD", "MOVE_IN", "MOVE_OUT"] as InspectionMode[]) {
      expect(MODE_COPY[m].aiOn, m).toBe(MODE_CONFIG[m].aiEnabled);
    }
    const view = read("app/sessions/[sessionId]/report/ReportView.tsx");
    expect(view).toMatch(/^\s*const mode = sessionMode\(session\);$/m);
    expect(view).toMatch(/^\s*const copy = MODE_COPY\[mode\];$/m);
    expect(view).toMatch(/\{copy\.aiOn && <ReportAiDisclaimer\b/);
    expect(view.match(/<ReportAiDisclaimer\b/g)).toHaveLength(1);
    expect(read("toss/src/pages/AnalysisPage.tsx")).toMatch(/\{copy\?\.aiOn && \(\s*<header/);
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
