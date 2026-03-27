"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLogo } from "@/components/auth/AuthLogo";
import type { ApiResponse, AuthResponse } from "@/types";

// Minimale Passwortlänge als benannte Konstante (kein Magic Number)
const MIN_PASSWORD_LENGTH = 8;

/**
 * RegisterPage – Registrierungsseite für neue Benutzer.
 *
 * Aufbau analog zur LoginPage, erweitert um:
 * - Passwort-Bestätigung mit Client-seitiger Validierung
 * - Hinweis auf Passwortanforderungen
 *
 * Bei Erfolg: Weiterleitung zum Kalender (Dashboard).
 * Anforderungsbezug: F1 (Registrierung), C1 (Datenschutz), C2 (Passwort-Sicherheit)
 */
export default function RegisterPage() {
  const router = useRouter();

  // State für Formularfelder
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Toggle für Passwort-Sichtbarkeit (beide Felder unabhängig)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Fehlermeldung (Client-Validierung oder Server-Antwort)
  const [error, setError] = useState("");
  // Ladezustand – verhindert doppeltes Absenden
  const [isLoading, setIsLoading] = useState(false);

  /**
   * handleSubmit – Validiert client-seitig und sendet Daten an die API.
   * Client-Validierung: Passwort-Übereinstimmung und Mindestlänge.
   * Server-Validierung: E-Mail-Format, Duplikate, Passwort-Policy.
   * Bei Erfolg: Weiterleitung zum Dashboard.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fehlermeldung zurücksetzen
    setError("");

    // Validierung: Passwörter müssen übereinstimmen
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    // Validierung: Mindestlänge prüfen
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`);
      return;
    }

    setIsLoading(true);

    try {
      // API-Call an den Register-Endpunkt
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result: ApiResponse<AuthResponse> = await response.json();

      if (!response.ok || result.error) {
        // Server-Fehlermeldung anzeigen (z.B. "E-Mail bereits vergeben")
        setError(
          result.error?.message ||
            "Registrierung fehlgeschlagen. Bitte versuche es erneut."
        );
        return;
      }

      // Erfolg: Weiterleitung zum Dashboard
      // router.refresh() aktualisiert die Server-Komponenten mit der neuen Session
      router.refresh();
      router.push("/calendar");
    } catch {
      // Netzwerkfehler (z.B. Server nicht erreichbar)
      setError(
        "Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Logo */}
      <AuthLogo />

      {/* Überschrift */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Registrieren</h1>
        <p className="mt-2 text-muted-foreground">
          Erstelle ein Konto, um mit dem Lernen zu starten.
        </p>
      </div>

      {/* Fehlermeldung – zeigt Grund und Korrekturhinweis (UI-Anforderung) */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

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

        {/* Passwort-Feld */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Passwort</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mindestens 8 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-10 pr-12"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {/* Hinweis zur Passwort-Anforderung */}
          <p className="text-xs text-muted-foreground">
            Mindestens {MIN_PASSWORD_LENGTH} Zeichen
          </p>
        </div>

        {/* Passwort-Bestätigung */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 pl-10 pr-12"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Registrieren-Button – min. 44x44px gemäß UI-Anforderungen */}
        <Button
          type="submit"
          className="h-12 w-full text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? "Wird registriert..." : "Registrieren"}
        </Button>
      </form>

      {/* Link zum Login */}
      <p className="text-center text-sm text-muted-foreground">
        Bereits ein Konto?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
