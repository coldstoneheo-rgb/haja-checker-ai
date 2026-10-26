// Next metadata.title 대체: 화면마다 document.title을 맞춘다.
import { useEffect } from "react";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · 하자체크 AI`;
  }, [title]);
}
