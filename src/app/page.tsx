"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag, BarChart3, Target, LogOut } from "lucide-react";
import { AuthIllustration } from "@/components/auth/AuthIllustration";

/**
 * Navigationskarte – zeigt eine Seite als klickbare Karte an.
 * Single Responsibility: nur für die Darstellung einer einzelnen Navigationskarte.
 */
function NavCard({
  href,
  icon: Icon,
  title,
  description,
  variant = "default",
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  // "default" = weiße Karte, "primary" = lila Karte (für Haupt-CTAs)
  variant?: "default" | "primary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={[
        // Mindestgröße 44px für interaktive Elemente (UI-Anforderung)
        "flex items-center gap-4 rounded-xl border p-4 transition-all duration-200",
        isPrimary
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-white text-foreground hover:border-primary/40 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Icon-Container */}
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          isPrimary ? "bg-white/20" : "bg-[var(--tw-surface)]",
        ].join(" ")}
      >
        <Icon
          className={[
            "h-5 w-5",
            isPrimary ? "text-white" : "text-primary",
          ].join(" ")}
        />
      </div>

      {/* Text */}
      <div>
        <p className="font-semibold text-base">{title}</p>
        <p
          className={[
            "text-sm",
            isPrimary ? "text-white/70" : "text-muted-foreground",
          ].join(" ")}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

/**
 * StartPage – Geschützte Startseite von Timewise (nur für eingeloggte User).
 *
 * Aufbau (analog zur Login-Seite):
 * - Linke Seite: Logo, Begrüßung, Navigationskarten zu allen Funktionen, Logout
 * - Rechte Seite: Dekorative Illustration auf lila Hintergrund
 *
 * Anforderungsbezug: U1 (max. 3 Klicks), F5 (Logout)
 */
export default function StartPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * handleLogout – Ruft die Logout-API auf und leitet zu /login weiter.
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    // Gleiches Split-Layout wie AuthLayout
    <div className="flex min-h-screen bg-[var(--tw-primary-300)]">

      {/* Linke Seite: Navigation auf weißem Hintergrund */}
      <div className="flex w-full items-center justify-center bg-white p-6 lg:w-1/2 lg:rounded-r-[2rem]">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Logo – identisch zur Login-Seite */}
          <Image
            src="/timewise-logo.svg"
            alt="Timewise Logo"
            width={180}
            height={47}
            priority
          />

          {/* Begrüßung */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Willkommen</h1>
            <p className="mt-2 text-muted-foreground">
              Erfasse deine Lernzeiten, setze Ziele und behalte deinen Fortschritt im Blick.
            </p>
          </div>

          {/* Funktionen-Bereich */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Funktionen
            </p>
            <NavCard
              href="/calendar"
              icon={Calendar}
              title="Kalender"
              description="Lernzeiten erfassen und verwalten"
              variant="primary"
            />
            <NavCard
              href="/keywords"
              icon={Tag}
              title="Keywords"
              description="Kategorien erstellen und bearbeiten"
            />
            <NavCard
              href="/stats"
              icon={BarChart3}
              title="Statistiken"
              description="Lernfortschritt visualisieren"
            />
            <NavCard
              href="/goals"
              icon={Target}
              title="Ziele"
              description="Lernziele definieren und verfolgen"
            />
          </div>

          {/* Logout-Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/5 disabled:opacity-50"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-base text-destructive">
                {isLoggingOut ? "Wird abgemeldet..." : "Abmelden"}
              </p>
              <p className="text-sm text-muted-foreground">
                Sicher aus Timewise ausloggen
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Rechte Seite: Illustration – nur auf Desktop sichtbar */}
      <div className="hidden w-1/2 items-center justify-center lg:flex">
        <AuthIllustration />
      </div>

    </div>
  );
}
