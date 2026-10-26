"use client";

// 세션 모드 문구(MODE_COPY)를 읽는 훅. 세션을 읽기 전에는 undefined — 신축 문구가 임대 화면에 깜빡이지 않게.
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/db";
import { sessionMode } from "@/lib/seed/modes";
import { MODE_COPY, type ModeCopy } from "@/lib/seed/modeCopy";

export function useModeCopy(sessionId: string): ModeCopy | undefined {
  // null = 세션 없음(삭제·잘못된 링크) → 신축 문구로 떨어진다
  const session = useLiveQuery(
    async () => (await getDB().sessions.get(sessionId)) ?? null,
    [sessionId],
  );
  if (session === undefined) return undefined;
  return MODE_COPY[session ? sessionMode(session) : "NEW_BUILD"];
}
