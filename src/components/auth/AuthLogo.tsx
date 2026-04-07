import Image from "next/image";

/**
 * AuthLogo – Timewise Logo-Komponente für Auth-Seiten.
 * Zeigt das offizielle Timewise-Logo aus dem public-Ordner.
 * Single Responsibility: nur für die Logo-Darstellung zuständig.
 */
export function AuthLogo() {
  return (
    // Logo auf 180px Breite skaliert, Höhe proportional (viewBox 289×75 → ~47px)
    <Image
      src="/timewise-logo.svg"
      alt="Timewise Logo"
      width={180}
      height={47}
      priority
    />
  );
}
