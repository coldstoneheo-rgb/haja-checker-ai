// 쿼리 라우터: 경로를 `?p=/sessions/<id>`로 싣는다(S1 ① Chrome 실측 통과 방식).
// 정적 번들 하나(index.html)라 새로고침·딥링크에서도 서버 rewrite가 필요 없다.
import { useSyncExternalStore } from "react";

const NAV_EVENT = "haja:navigate";
export const DEFAULT_PATH = "/sessions";

export function pathFromSearch(search: string): string {
  const p = new URLSearchParams(search).get("p");
  // 앱 안 경로만: 프로토콜 상대(//host)와 슬래시 뒤 역슬래시로 시작하는 경로는 버린다
  if (!p || !p.startsWith("/") || p === "/" || p.startsWith("//") || p.startsWith("/\\")) return DEFAULT_PATH;
  return p;
}

export function hrefFor(path: string): string {
  return "?p=" + encodeURIComponent(path).replace(/%2F/g, "/");
}

function getPath(): string {
  return pathFromSearch(window.location.search);
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(NAV_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(NAV_EVENT, cb);
  };
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, () => DEFAULT_PATH);
}

export function navigate(to: string, replace = false, scroll = true) {
  const url = hrefFor(to);
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(NAV_EVENT));
  if (scroll) window.scrollTo(0, 0);
}

export type Route =
  | { name: "home" }
  | { name: "sessions" }
  | { name: "sessionNew" }
  | { name: "overview"; sessionId: string }
  | { name: "checklist"; sessionId: string }
  | { name: "defects"; sessionId: string }
  | { name: "defectNew"; sessionId: string }
  | { name: "defectDetail"; sessionId: string; defectId: string }
  | { name: "analysis"; sessionId: string }
  | { name: "report"; sessionId: string }
  | { name: "pending"; path: string };

const SESSION_SUB = { checklist: "checklist", defects: "defects", analysis: "analysis", report: "report" } as const;

export function matchRoute(path: string): Route {
  if (path === "/home") return { name: "home" };
  if (path === "/sessions") return { name: "sessions" };
  if (path === "/sessions/new") return { name: "sessionNew" };
  const parts = path.split("/").slice(1); // ["sessions", id, ...]
  if (parts[0] !== "sessions" || !parts[1] || parts.some((s) => s === "")) return { name: "pending", path };
  const sessionId = parts[1];
  if (parts.length === 2) return { name: "overview", sessionId };
  const sub = parts[2];
  if (parts.length === 3 && sub in SESSION_SUB) {
    return { name: SESSION_SUB[sub as keyof typeof SESSION_SUB], sessionId };
  }
  if (parts.length === 4 && sub === "defects") {
    return parts[3] === "new"
      ? { name: "defectNew", sessionId }
      : { name: "defectDetail", sessionId, defectId: parts[3] };
  }
  return { name: "pending", path };
}
