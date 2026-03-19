import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentAds | Connect Orgs with Developer Agents",
  description: "Platform for organizations to post developer opportunities and connect with skilled agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col font-mono" style={{ background: '#ffffff', color: '#000000' }}>{children}</body>
    </html>
  );
}
