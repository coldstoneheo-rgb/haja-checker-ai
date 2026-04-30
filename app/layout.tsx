import type { Metadata, Viewport } from "next";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "하자체크 AI",
  description:
    "신축 아파트 사전점검에서 사진 증거를 빠짐없이 수집하고, AI 보조 분석으로 하자 의심 보고서를 작성합니다.",
  manifest: "/manifest.webmanifest",
  applicationName: "하자체크 AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "하자체크 AI",
  },
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
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
