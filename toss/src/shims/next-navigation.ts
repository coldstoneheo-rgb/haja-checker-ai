// next/navigation 대체(전환기): useRouter / usePathname / useParams 최소 구현.
import { navigate, usePath } from "../router";

export function useRouter() {
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to, true),
    back: () => window.history.back(),
    // useLiveQuery가 반응형이라 refresh는 no-op으로 충분
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname(): string {
  return usePath();
}

export function useParams<T extends Record<string, string>>(): T {
  return paramsFromPath(usePath()) as T;
}

export function paramsFromPath(path: string): Record<string, string> {
  const m = path.match(/^\/sessions\/([^/]+)(?:\/defects\/([^/]+))?/);
  const out: Record<string, string> = {};
  // 경로는 URLSearchParams가 이미 디코딩했다 — 다시 decode하면 %zz 같은 입력에서 URIError로 앱이 죽는다
  if (m?.[1] && m[1] !== "new") out.sessionId = m[1];
  if (m?.[2] && m[2] !== "new") out.defectId = m[2];
  return out;
}
