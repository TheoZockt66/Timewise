"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLogo } from "@/components/auth/AuthLogo";

/**
 * ResetPasswordPage – Seite zum Zurücksetzen des Passworts.
 *
 * Zwei Zustände:
 * 1. Formular: E-Mail eingeben und absenden
 * 2. Bestätigung: Erfolgsmeldung nach Absenden
 *
 * State Pattern: Die Komponente wechselt zwischen Formular- und
 * Bestätigungs-Zustand basierend auf `isSubmitted`.
 *
 * Nur Frontend – kein API-Call, wird in M1 Auth angebunden.
 * Anforderungsbezug: F5 (Passwort zurücksetzen)
 */
export default function ResetPasswordPage() {
  // E-Mail-Eingabe
  const [email, setEmail] = useState("");
  // Zustandswechsel: Formular → Bestätigung
  const [isSubmitted, setIsSubmitted] = useState(false);

  /**
   * handleSubmit – Verarbeitet die Reset-Anfrage.
   * TODO: API-Anbindung in M1 Auth implementieren.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Platzhalter – wird durch Supabase Auth Reset ersetzt
    console.log("Reset password for:", email);
    // Wechsel zum Bestätigungs-Zustand
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Logo */}
      <AuthLogo />

      {/* Zustandsabhängige Anzeige: Formular oder Bestätigung */}
      {isSubmitted ? (
        /* Bestätigungs-Zustand: E-Mail wurde gesendet */
        <div className="flex flex-col gap-6">
          {/* Erfolgs-Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tw-success)]/10">
              <CheckCircle2 className="h-8 w-8 text-[var(--tw-success)]" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">E-Mail gesendet</h1>
            <p className="mt-3 text-muted-foreground">
              Wir haben eine E-Mail an{" "}
              <span className="font-semibold text-foreground">{email}</span>{" "}
              gesendet. Folge dem Link in der E-Mail, um dein Passwort zurückzusetzen.
            </p>
          </div>

          {/* Hinweis falls E-Mail nicht ankommt */}
          <p className="text-center text-sm text-muted-foreground">
            Keine E-Mail erhalten? Prüfe deinen Spam-Ordner oder{" "}
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              versuche es erneut
            </button>
            .
          </p>

          {/* Zurück zum Login */}
          <Button asChild variant="outline" className="h-12 w-full text-base">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Login
            </Link>
          </Button>
        </div>
      ) : (
        /* Formular-Zustand: E-Mail eingeben */
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Passwort vergessen?</h1>
            <p className="mt-2 text-muted-foreground">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum
              Zurücksetzen deines Passworts.
            </p>
          </div>

          {/* Formular */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* E-Mail-Feld */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Submit-Button – min. 44x44px gemäß UI-Anforderungen */}
            <Button type="submit" className="h-12 w-full text-base font-semibold">
              Link senden
            </Button>
          </form>

          {/* Zurück zum Login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Login
          </Link>
        </div>
      )}
    </div>
  );
}
