import type { Metadata } from "next";
import { Baloo_2, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const display = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Noto_Sans_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "星星奖励 | Kiddo Star",
  description: "柔和卡通风的每日奖励系统，给孩子更有趣的成长激励",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${display.variable} ${body.variable} antialiased bg-gradient-to-b from-[#fef6ff] via-[#f4fbff] to-[#fefbf4] min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
