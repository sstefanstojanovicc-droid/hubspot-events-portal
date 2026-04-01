import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getDeploymentUrl } from "@/src/lib/platform/deployment-url";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadataBase = getDeploymentUrl();

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  title: "HubSpot Application Platform",
  description:
    "Reusable Next.js + HubSpot platform for candidate, events, and CRM-driven portals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
