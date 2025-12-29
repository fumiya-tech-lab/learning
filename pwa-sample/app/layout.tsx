import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "勉強管理アプリ",
  description: "あなたの学習をサポートします",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}