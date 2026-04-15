"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  LogOut,
  Tag,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavigationTile = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  eyebrow: string;
};

const navigationTiles: NavigationTile[] = [
  {
    href: "/calendar",
    icon: Calendar,
    title: "Kalender",
    description: "Lernzeiten erfassen, bearbeiten und direkt aus der Wochen- oder Monatsansicht verwalten.",
    eyebrow: "Planen",
  },
  {
    href: "/keywords",
    icon: Tag,
    title: "Keywords",
    description: "Fächer und Themen strukturieren, Farben vergeben und deine Einträge klar ordnen.",
    eyebrow: "Struktur",
  },
  {
    href: "/stats",
    icon: BarChart3,
    title: "Statistiken",
    description: "Lernfortschritt auswerten, Zeitverläufe vergleichen und Schwerpunkte erkennen.",
    eyebrow: "Analyse",
  },
  {
    href: "/goals",
    icon: Target,
    title: "Ziele",
    description: "Lernziele definieren, Keyword-basiert verfolgen und Fortschritte im Blick behalten.",
    eyebrow: "Fokus",
  },
];

function NavigationCard({
  href,
  icon: Icon,
  title,
  description,
  eyebrow,
}: NavigationTile) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-accent/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--tw-surface)] text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">{eyebrow}</p>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Dashboard-Startseite für eingeloggte User.
 * Fokus: schneller Zugang zu allen Hauptbereichen ohne Auth-Splitlayout.
 */
export default function StartPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f4ff_0%,#ffffff_28%,#ffffff_100%)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:p-5">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/timewise-logo.svg"
              alt="Timewise Logo"
              width={216}
              height={56}
              className="h-12 w-[185px] object-contain md:h-14 md:w-[216px]"
              priority
            />
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="min-h-11 rounded-full border-destructive/20 bg-destructive/5 px-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Wird abgemeldet..." : "Abmelden"}
          </Button>
        </header>

        <section className="space-y-4">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Navigation
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Dein Arbeitsbereich</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {navigationTiles.map((tile) => (
              <NavigationCard key={tile.href} {...tile} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
