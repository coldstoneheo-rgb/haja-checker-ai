// 전환기(S2): 화면은 toss/(Vite)로 옮겼고 Next에는 /api/analyze만 남는다 — 이 레이아웃은 404 페이지용.
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // PWA 메타(manifest·appleWebApp)는 뺀다 — 404 화면을 «홈 화면에 추가»하면 404만 뜨는 아이콘이 생긴다
  title: "하자체크 AI",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
