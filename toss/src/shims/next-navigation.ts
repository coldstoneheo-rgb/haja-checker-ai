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
  const m = usePath().match(/^\/sessions\/([^/]+)(?:\/defects\/([^/]+))?/);
  const out: Record<string, string> = {};
  if (m?.[1] && m[1] !== "new") out.sessionId = decodeURIComponent(m[1]);
  if (m?.[2]) out.defectId = decodeURIComponent(m[2]);
  return out as T;
}
