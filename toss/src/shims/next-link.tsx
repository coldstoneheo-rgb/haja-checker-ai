/// <reference types="vite/client" />
// next/link 대체(전환기): 레포 원본 화면을 무수정으로 import하기 위한 shim. 내부 경로는 쿼리 라우터로 보낸다.
// 외부 href(결정: 외부 링크 0): 개발 중에는 렌더 즉시 throw로 잡고, 빌드본에서는 openExternal(openURL 자리)로만 나간다.
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { hrefFor, navigate } from "../router";
import { openExternal } from "../platform/openURL";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

/** 앱 안 경로: `/`로 시작하고 `//`·`/\`(프로토콜 상대)가 아닌 것. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\");
}

export function assertInternalHref(href: string, dev: boolean): void {
  if (dev && !isInternalHref(href)) {
    throw new Error(`[toss] 외부 링크 금지: ${href} — openExternal()을 쓴다`);
  }
}

export default function Link({ href, prefetch: _p, replace, scroll = true, onClick, ...rest }: Props) {
  assertInternalHref(href, import.meta.env.DEV);
  const internal = isInternalHref(href);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    if (internal) navigate(href, replace, scroll);
    else openExternal(href);
  };
  return <a href={internal ? hrefFor(href) : "#"} onClick={handle} {...rest} />;
}
