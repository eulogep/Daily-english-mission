import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/app-shell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Engineer Learning OS",
    template: "%s · Engineer Learning OS",
  },
  description: "Un espace local et guidé pour apprendre, pratiquer et produire des preuves de progression.",
  applicationName: "Engineer Learning OS",
  openGraph: {
    title: "Engineer Learning OS",
    description: "Apprendre, pratiquer et progresser à partir de preuves réelles.",
    siteName: "Engineer Learning OS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
