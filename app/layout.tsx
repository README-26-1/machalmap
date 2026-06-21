import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "마찰지도 — 시민 참여형 생활 안전 지도",
  description: "일상 속 불편과 위험을 사진으로 제보하면 지도 위에 실시간으로 공유됩니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-screen pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
