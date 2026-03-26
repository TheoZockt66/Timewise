import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { Atkinson_Hyperlegible } from "next/font/google";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
});

// Inter als primäre Schriftart – wird als CSS-Variable eingebunden
// Inter aktuell deaktiviert, da laut Anforderungen Atkinson Hyperlegible verwendet werden muss
// const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={atkinson.className}>
        {children}
      </body>
    </html>
  );
}