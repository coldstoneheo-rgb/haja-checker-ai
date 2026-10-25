// next/link 대체(전환기): 레포 원본 화면을 무수정으로 import하기 위한 shim. 내부 경로는 쿼리 라우터로 보낸다.
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { hrefFor, navigate } from "../router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

export default function Link({ href, prefetch: _p, replace, scroll: _s, onClick, ...rest }: Props) {
  const internal = href.startsWith("/");
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (!internal || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(href, replace);
  };
  return <a href={internal ? hrefFor(href) : href} onClick={handle} {...rest} />;
}
