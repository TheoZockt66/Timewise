# Timewise – Prompt Log

---

Eintrag Nr.: 3
Datum: 2026-03-26
Prompt: Baue einmal die LoginPage und Reset-Passwort-Page und Registrierpage, orientiere dich an diesem Design. Nutze aber unsere Farben sowie unser Logo. Erst mal nur Frontendseitig.
Aktion: ERSTELLT
Datei / Komponente: Auth-Seiten Frontend (M1) — 7 Dateien
Schnittstelle: |
  LoginPage: keine Props – Standalone-Page mit E-Mail, Passwort, Remember-Me
  RegisterPage: keine Props – Standalone-Page mit E-Mail, Passwort, Passwort-Bestätigung
  ResetPasswordPage: keine Props – Standalone-Page mit E-Mail, Bestätigungs-Zustand
  AuthLogo: keine Props – Logo-Komponente (Clock-Icon + "Timewise")
  AuthIllustration: keine Props – Dekorative Icons + Slogan
  AuthLayout: { children: ReactNode } – Split-Layout (Formular links, Illustration rechts)
Beschreibung: |
  Frontend-Implementierung der drei Auth-Seiten basierend auf einem Referenzdesign.
  Anpassungen: Timewise-Farbschema (Lila #7700F4 als Primärfarbe, Türkis #00C2A8 als Akzent),
  Atkinson Hyperlegible Schriftart, WCAG-konforme UI-Elemente (min. 44x44px, 4.5:1 Kontrast).

  Erstellte/geänderte Dateien:
  - src/app/globals.css (Timewise-Farbvariablen, Custom Properties)
  - src/app/layout.tsx (Atkinson Hyperlegible statt Inter)
  - tailwind.config.ts (Schriftart + tw-primary/tw-accent Farben)
  - src/app/(auth)/layout.tsx (Split-Layout: Formular links, Illustration rechts)
  - src/app/(auth)/login/page.tsx (Login-Formular mit E-Mail, Passwort, Remember-Me)
  - src/app/(auth)/register/page.tsx (Registrierung mit Passwort-Bestätigung)
  - src/app/(auth)/reset-password/page.tsx (Reset mit State Pattern: Formular → Bestätigung)
  - src/components/auth/AuthLogo.tsx (Logo-Komponente)
  - src/components/auth/AuthIllustration.tsx (Illustration für rechte Seite)
  - src/components/ui/input.tsx (shadcn/ui Input – neu installiert)
  - src/components/ui/label.tsx (shadcn/ui Label – neu installiert)
  - src/components/ui/checkbox.tsx (shadcn/ui Checkbox – neu installiert)

  Design-Entscheidungen:
  - Split-Layout mit lg-Breakpoint (Illustration nur auf Desktop)
  - State Pattern in ResetPasswordPage (Formular ↔ Bestätigung)
  - Passwort-Sichtbarkeit-Toggle mit Eye/EyeOff Icons
  - Client-seitige Validierung (Passwort-Match, Mindestlänge)
  - Kein API-Call – reine Frontend-Darstellung, API wird in M1 Auth angebunden

---

Eintrag Nr.: 2
Datum: 2026-03-25
Prompt: Setze die APIs für die Authentifizierung um also für Modul 1
Aktion: ERSTELLT
Datei / Komponente: Auth-API-Endpunkte (M1) — 7 Dateien
Schnittstelle: |
  POST /api/auth/register → { email, password } → ApiResponse<AuthResponse>
  POST /api/auth/login    → { email, password } → ApiResponse<AuthResponse>
  POST /api/auth/logout   → (leer)              → ApiResponse<{ success }>
  POST /api/auth/reset    → { email }           → ApiResponse<{ success }>
  GET  /api/auth/callback  → ?code=...           → Redirect
Beschreibung: |
  Vollständige Implementierung der Auth-API-Schicht für Modul M1.
  Architektur: Schichtenarchitektur mit Service-Layer (Separation of Concerns).

  Erstellte/geänderte Dateien:
  - src/types/index.ts (AuthResponse + AuthCredentials Interfaces hinzugefügt)
  - src/lib/services/auth.service.ts (Business Logic: register, login, logout, resetPassword, exchangeCodeForSession)
  - src/app/api/auth/register/route.ts (POST — Registrierung)
  - src/app/api/auth/login/route.ts (POST — Login)
  - src/app/api/auth/logout/route.ts (POST — Logout)
  - src/app/api/auth/reset/route.ts (POST — Passwort-Reset-E-Mail)
  - src/app/api/auth/callback/route.ts (GET — E-Mail-Bestätigung / Reset-Callback)

  Sicherheitsmaßnahmen:
  - Generische Fehlermeldungen bei Login (keine User-Enumeration)
  - Reset gibt immer Erfolg zurück (keine User-Enumeration)
  - Eingabevalidierung (E-Mail-Format, Passwort-Mindestlänge)
  - Alle Responses im ApiResponse<T>-Wrapper

---

Eintrag Nr.: 1
Datum: 2026-03-19
Prompt: Setze schon einmal diesen Teil des Projektes auf (mit Architektur-Diagramm: React + Tailwind Next.js SSR → API Routes Next.js → Supabase Auth JWT/Sessions → Business Logic Supabase Edge Fn. → PostgreSQL Supabase)
Aktion: ERSTELLT
Datei / Komponente: Projekt-Grundstruktur (mehrere Dateien)
Schnittstelle: Keine Props – reines Projekt-Setup
Beschreibung: |
  Vollständiges Next.js 15 Projekt-Scaffold mit folgendem Stack:
  - Next.js 15 (App Router, SSR, TypeScript)
  - Tailwind CSS v3 mit shadcn/ui CSS-Variablen-Theming
  - Supabase SSR (@supabase/ssr) mit Browser- und Server-Client
  - shadcn/ui (components.json, Button-Komponente als Basis)
  - FullCalendar als Dependency vorbereitet
  - Middleware für automatische Session-Erneuerung (JWT)
  - .env.local als Konfigurationsvorlage

  Erstellte Dateien:
  - package.json
  - tsconfig.json
  - next.config.ts
  - tailwind.config.ts
  - postcss.config.mjs
  - components.json
  - .gitignore
  - .env.local (Template)
  - src/app/globals.css (shadcn/ui CSS-Variablen)
  - src/app/layout.tsx (Root Layout)
  - src/app/page.tsx (Platzhalter-Startseite)
  - src/lib/utils.ts (cn-Hilfsfunktion)
  - src/lib/supabase/client.ts (Browser-Client)
  - src/lib/supabase/server.ts (Server-Client)
  - src/lib/supabase/middleware.ts (Session-Refresh)
  - src/middleware.ts (Next.js Middleware Entry Point)
  - src/components/ui/button.tsx (shadcn/ui Button)
  - src/types/index.ts (Zentrale Typen – Platzhalter)
  - docs/prompt-log.md (diese Datei)

---
