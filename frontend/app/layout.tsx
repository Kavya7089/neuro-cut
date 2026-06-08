import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroCut | Enterprise Multi-Agent Short-Form Video Production Studio",
  description: "Advanced zero-gravity multi-agent LangGraph workflow engine with real-time video synthesizing and post-render parameters manipulation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`${geist.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-full flex flex-col bg-[#09090b] text-[#e5e1e4] antialiased select-none font-inter`}
      >
        {children}
      </body>
    </html>
  );
}
