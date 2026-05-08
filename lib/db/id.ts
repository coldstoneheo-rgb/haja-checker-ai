export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newDefectDisplayId(sequence: number, date = new Date()): string {
  const yyyymmdd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  return `D-${yyyymmdd}-${String(sequence).padStart(3, "0")}`;
}

/**
 * 오늘 날짜 prefix로 기존 displayId 목록에서 최대 suffix를 구한다.
 * 다음 sequence = maxSuffix + 1 로 사용하면 삭제 후 재생성 시 중복이 없다.
 */
export function computeNextDefectSequence(
  existingDisplayIds: string[],
  date = new Date(),
): number {
  const yyyymmdd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const prefix = `D-${yyyymmdd}-`;
  const maxSuffix = existingDisplayIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return maxSuffix + 1;
}
