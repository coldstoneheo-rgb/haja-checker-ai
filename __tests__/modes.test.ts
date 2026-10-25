import { describe, it, expect } from "vitest";
import { MODE_CONFIG, isAiEnabled, sessionMode } from "@/lib/seed/modes";
import { CHECKLIST_SEED } from "@/lib/seed/checklist";
import { RENTAL_AREAS, RENTAL_CHECKLIST_SEED } from "@/lib/seed/rentalChecklist";
import { INSPECTION_MODE_LABELS, RECIPIENT_TYPE_LABELS } from "@/lib/util/labels";
import type { InspectionMode, RecipientType } from "@/lib/domain/types";

const MODES: InspectionMode[] = ["NEW_BUILD", "MOVE_IN", "MOVE_OUT"];
const RECIPIENTS: RecipientType[] = ["BUILDER", "MANAGEMENT_OFFICE", "HOUSE_OWNER"];

// 콘솔 금지어(PLAN §8 LC 판단 1) — 앱 시드 문구에도 쓰지 않는다.
const BANNED = ["전월세", "임대인", "임차인", "보증금", "이사", "인테리어", "중개", "시세", "분양", "임대차"];

describe("모드별 시드 수와 AI 플래그", () => {
  it.each([
    ["NEW_BUILD", 28, true],
    ["MOVE_IN", 20, false],
    ["MOVE_OUT", 20, false],
  ] as const)("%s: 시드 %i항목, AI %s", (mode, count, ai) => {
    expect(MODE_CONFIG[mode].seed).toHaveLength(count);
    expect(isAiEnabled(mode)).toBe(ai);
  });

  it("퇴거는 «상태», 신축은 «하자»로 부른다", () => {
    expect(MODE_CONFIG.NEW_BUILD.findingNoun).toBe("하자");
    expect(MODE_CONFIG.MOVE_OUT.findingNoun).toBe("상태");
  });

  it("mode가 없는 v1 세션은 신축(AI on)", () => {
    expect(sessionMode({})).toBe("NEW_BUILD");
    expect(isAiEnabled(sessionMode({}))).toBe(true);
    expect(isAiEnabled(sessionMode({ mode: "MOVE_IN" }))).toBe(false);
  });

  it("모드마다 시드 항목의 공간이 그 모드 공간 목록에 있고, 모든 공간에 항목이 있다", () => {
    for (const mode of MODES) {
      const { areas, seed } = MODE_CONFIG[mode];
      const areaSet = new Set(areas);
      for (const item of seed) expect(areaSet.has(item.area), `${mode}: ${item.area}`).toBe(true);
      const covered = new Set(seed.map((i) => i.area));
      for (const a of areas) expect(covered.has(a), `${mode}: 빈 공간 ${a}`).toBe(true);
    }
  });
});

describe("임대 시드 초안(20) 출처", () => {
  const newBuildTitles = new Set(CHECKLIST_SEED.map((i) => i.title));

  it("source=NEW_BUILD 항목은 신축 28에 같은 제목이 있다", () => {
    const reused = RENTAL_CHECKLIST_SEED.filter((i) => i.source === "NEW_BUILD");
    for (const i of reused) expect(newBuildTitles.has(i.title), i.title).toBe(true);
    expect(reused).toHaveLength(13);
  });

  it("source=NEW 항목은 신축 28과 제목이 겹치지 않는다", () => {
    const fresh = RENTAL_CHECKLIST_SEED.filter((i) => i.source === "NEW");
    for (const i of fresh) expect(newBuildTitles.has(i.title), i.title).toBe(false);
    expect(fresh).toHaveLength(7);
  });

  it("공간 안 제목 중복 0 · 필수 필드 · 사진 1장 이상", () => {
    const seen = new Set<string>();
    for (const i of RENTAL_CHECKLIST_SEED) {
      const key = `${i.area}/${i.title}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
      expect(i.description.trim() && i.captureGuide.trim()).toBeTruthy();
      expect(i.requiredPhotoCount).toBeGreaterThanOrEqual(1);
    }
    expect(new Set(RENTAL_AREAS).size).toBe(RENTAL_AREAS.length);
  });

  it("시드·라벨 문구에 금지어 0", () => {
    const text = JSON.stringify([RENTAL_CHECKLIST_SEED, RENTAL_AREAS, INSPECTION_MODE_LABELS, RECIPIENT_TYPE_LABELS]);
    for (const w of BANNED) expect(text.includes(w), w).toBe(false);
  });
});

describe("모드·수신처 라벨", () => {
  it("모든 값에 한국어 라벨", () => {
    for (const m of MODES) expect(INSPECTION_MODE_LABELS[m]).toBeTruthy();
    for (const r of RECIPIENTS) expect(RECIPIENT_TYPE_LABELS[r]).toBeTruthy();
  });
});
