"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLogo } from "@/components/auth/AuthLogo";

/**
 * LoginPage – Anmeldeseite für bestehende Benutzer.
 *
 * Aufbau orientiert sich am Referenzdesign:
 * - Logo oben
 * - Überschrift "Login"
 * - E-Mail-Feld mit Icon
 * - Passwort-Feld mit Toggle-Sichtbarkeit und "Passwort vergessen?"-Link
 * - "Angemeldet bleiben"-Checkbox
 * - Login-Button
 * - Link zur Registrierung
 *
 * Nur Frontend – kein API-Call, wird in M1 Auth angebunden.
 * Anforderungsbezug: F1 (Login), F2 (JWT-Session), C1 (Datenschutz)
 */
export default function LoginPage() {
  // State für Formularfelder
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Toggle für Passwort-Sichtbarkeit
  const [showPassword, setShowPassword] = useState(false);
  // "Angemeldet bleiben"-Status
  const [rememberMe, setRememberMe] = useState(false);

  /**
   * handleSubmit – Formular-Submit-Handler.
   * Verhindert Standard-Browser-Verhalten.
   * TODO: API-Anbindung in M1 Auth implementieren.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Platzhalter – wird durch Supabase Auth Login ersetzt
    console.log("Login:", { email, rememberMe });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Logo */}
      <AuthLogo />

      {/* Überschrift */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Login</h1>
        <p className="mt-2 text-muted-foreground">
          Melde dich an, um deine Lernzeiten zu verwalten.
        </p>
      </div>

      {/* Formular */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* E-Mail-Feld */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <div className="relative">
            {/* Mail-Icon links im Input-Feld */}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Passwort</Label>
            {/* Link zu Passwort-Reset gemäß Design */}
            <Link
              href="/reset-password"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Passwort vergessen?
            </Link>
          </div>
          <div className="relative">
            {/* Lock-Icon links im Input-Feld */}
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Dein Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-10 pr-12"
              required
              autoComplete="current-password"
            />
            {/* Toggle-Button für Passwort-Sichtbarkeit */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Angemeldet bleiben – Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
            Angemeldet bleiben
          </Label>
        </div>

        {/* Login-Button – min. 44x44px gemäß UI-Anforderungen */}
        <Button type="submit" className="h-12 w-full text-base font-semibold">
          Login
        </Button>
      </form>

      {/* Link zur Registrierung */}
      <p className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Registrieren
        </Link>
      </p>
    </div>
  );
}
