"use client";

import { useEffect, useMemo } from "react";

/**
 * Blob 으로부터 Object URL 을 만들고 컴포넌트 unmount/blob 변경 시 해제한다.
 * Dexie 에서 가져온 Blob 을 <img src> 에 바인딩할 때 사용.
 *
 * useMemo 로 URL 을 동기 계산하고 useEffect 는 정리(revoke) 만 담당해
 * React 19 의 set-state-in-effect 규칙을 회피한다.
 */
export function useBlobUrl(blob: Blob | undefined | null): string | undefined {
  const url = useMemo(
    () => (blob ? URL.createObjectURL(blob) : undefined),
    [blob],
  );

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}
