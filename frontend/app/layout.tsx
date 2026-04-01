import "./globals.css";
import type { Metadata, Viewport } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "ArKeep — 읽고 싶은 아티클, 한 곳에서",
  description: "URL 하나면 충분합니다. 제목과 썸네일은 자동으로 가져오고, 카테고리로 정리하고, 읽기 상태까지 관리하는 아티클 매니저입니다.",
  keywords: ["아티클", "북마크", "링크 저장", "읽기 관리", "ArKeep"],
  openGraph: {
    title: "ArKeep — 읽고 싶은 아티클, 한 곳에서",
    description: "URL 하나면 충분합니다. 카테고리로 정리하고 읽기 상태까지 관리하세요.",
    url: "https://www.arkeep.net",
    siteName: "ArKeep",
    locale: "ko_KR",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#137fec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
