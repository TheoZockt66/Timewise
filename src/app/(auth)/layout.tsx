import { AuthIllustration } from "@/components/auth/AuthIllustration";

/**
 * Auth Layout – Split-Layout für Login, Register und Passwort-Reset.
 *
 * Linke Seite: Formular (children) auf weißem Hintergrund.
 * Rechte Seite: Dekorative Illustration auf lila Hintergrund.
 *
 * Separation of Concerns: Layout kümmert sich nur um die Anordnung,
 * nicht um die Formular-Logik oder Illustration-Details.
 *
 * Responsive: Auf Tablet/Mobile wird nur das Formular gezeigt,
 * die Illustration wird ab lg-Breakpoint sichtbar.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Volle Viewport-Höhe, lila Hintergrund sichtbar auf großen Screens
    <div className="flex min-h-screen bg-[var(--tw-primary-300)]">
      {/* Linke Seite: Formular-Bereich */}
      <div className="flex w-full items-center justify-center bg-white p-6 lg:w-1/2 lg:rounded-r-[2rem]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Rechte Seite: Illustration – nur auf Desktop sichtbar */}
      <div className="hidden w-1/2 items-center justify-center lg:flex">
        <AuthIllustration />
      </div>
    </div>
  );
}
