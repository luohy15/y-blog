import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { LanguageProvider } from "@/contexts/LanguageContext";
import HtmlLangUpdater from "@/components/HtmlLangUpdater";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Huayi Luo"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <HtmlLangUpdater />
          <div className="min-h-screen bg-background">
            <Header />
            <main className="flex-1 pt-20">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
