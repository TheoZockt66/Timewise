import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
    <html lang="de" suppressHydrationWarning>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
