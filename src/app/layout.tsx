import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter als primäre Schriftart – wird als CSS-Variable eingebunden
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Timewise",
  description: "Intelligente Zeitplanung für Studierende",
};

/**
 * Root Layout – wraps alle Seiten der Anwendung.
 * Verantwortlich für: globale Styles, Schriftarten, HTML-Struktur.
 * Gemäß Single Responsibility Principle nur für das Grundgerüst zuständig.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
