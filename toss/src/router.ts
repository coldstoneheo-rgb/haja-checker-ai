// 쿼리 라우터: 경로를 `?p=/sessions/<id>`로 싣는다(S1 ① Chrome 실측 통과 방식).
// 정적 번들 하나(index.html)라 새로고침·딥링크에서도 서버 rewrite가 필요 없다.
import { useSyncExternalStore } from "react";

const NAV_EVENT = "haja:navigate";
export const DEFAULT_PATH = "/sessions";

export function pathFromSearch(search: string): string {
  const p = new URLSearchParams(search).get("p");
  if (!p || !p.startsWith("/") || p === "/") return DEFAULT_PATH;
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

export function navigate(to: string, replace = false) {
  const url = hrefFor(to);
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(NAV_EVENT));
  window.scrollTo(0, 0);
}

export type Route = { name: "sessions" } | { name: "pending"; path: string };

export function matchRoute(path: string): Route {
  if (path === "/sessions") return { name: "sessions" };
  return { name: "pending", path };
}
