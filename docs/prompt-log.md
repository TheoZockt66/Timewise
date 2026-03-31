# Timewise – Prompt Log

---

Eintrag Nr.: 5
Datum: 2026-03-31
Prompt: erstelle eine startseite auf der man zu allen seiten kommt orientiere dich beim design an der login page
Aktion: GEÄNDERT
Datei / Komponente: src/app/page.tsx, src/lib/supabase/middleware.ts
Schnittstelle: |
  StartPage: keine Props – statische Navigationsseite
  NavCard: { href, icon, title, description, variant? } → JSX.Element
Beschreibung: |
  Startseite als öffentlich zugängliche Landing Page mit Split-Layout analog zur Login-Seite.

  Geänderte Dateien:
  - src/app/page.tsx (Startseite mit Navigationskarten zu allen Seiten)
  - src/lib/supabase/middleware.ts (PUBLIC_ROUTES: "/" hinzugefügt)

  Design:
  - Gleiches Split-Layout wie AuthLayout (weiß links, lila rechts mit Illustration)
  - AuthIllustration wiederverwendet (DRY)
  - NavCard-Komponente für einheitliche Darstellung der Navigationskarten
  - Zwei Abschnitte: "Konto" (Login, Registrieren) und "Dashboard" (Kalender, Keywords, Statistiken, Ziele)
  - Primary-Variant für Login-Button (lila Karte als Haupt-CTA)

  Middleware:
  - "/" zu PUBLIC_ROUTES hinzugefügt, damit die Startseite ohne Login erreichbar ist

---

Eintrag Nr.: 4
Datum: 2026-03-27
Prompt: Bitte schreibe nun die Verbindung zwischen Frontend und den API sodass die Anmeldung funktioniert und das erst mal wenn ich die Seite öffnen will geguckt wird ob ich angemeldet bin
Aktion: GEÄNDERT
Datei / Komponente: Auth-Frontend ↔ API Anbindung (M1) — 4 Dateien
Schnittstelle: |
  LoginPage: fetch POST /api/auth/login → ApiResponse<AuthResponse> → redirect /calendar
  RegisterPage: fetch POST /api/auth/register → ApiResponse<AuthResponse> → redirect /calendar
  ResetPasswordPage: fetch POST /api/auth/reset → ApiResponse<{ success }> → Bestätigungs-Zustand
  updateSession(): Middleware erweitert um Route-Protection (redirect-Logik)
Beschreibung: |
  Verbindung der Auth-Frontend-Seiten mit den bestehenden API-Endpunkten.

  Geänderte Dateien:
  - src/lib/supabase/middleware.ts (Route-Protection: unauthentifiziert → /login, authentifiziert auf Auth-Seiten → /calendar)
  - src/app/(auth)/login/page.tsx (API-Anbindung: fetch /api/auth/login, Fehleranzeige, Ladezustand)
  - src/app/(auth)/register/page.tsx (API-Anbindung: fetch /api/auth/register, Fehleranzeige, Ladezustand)
  - src/app/(auth)/reset-password/page.tsx (API-Anbindung: fetch /api/auth/reset, Fehleranzeige, Ladezustand)

  Middleware-Logik:
  - PUBLIC_ROUTES: /login, /register, /reset-password (ohne Auth erreichbar)
  - API-Routen (/api/*) werden nicht redirected — geben selbst 401 zurück
  - Nicht eingeloggt + geschützte Route → redirect /login
  - Eingeloggt + Auth-Seite → redirect /calendar

  Sicherheit:
  - Kein direkter Supabase-Client im Frontend (Schichtenarchitektur eingehalten)
  - Reset-Password zeigt immer Bestätigung (User-Enumeration-Schutz)
  - Login zeigt generische Fehlermeldung (User-Enumeration-Schutz)
  - Ladezustand verhindert doppeltes Absenden
  - Netzwerkfehler werden separat abgefangen und angezeigt

---

Eintrag Nr.: 3
Datum: 2026-03-26
Prompt: Baue einmal die LoginPage und Reset-Passwort-Page und Registrierpage, orientiere dich an diesem Design. Nutze aber unsere Farben sowie unser Logo. Erst mal nur Frontendseitig.
Aktion: ERSTELLT
Datei / Komponente: Auth-Seiten Frontend (M1) — 10 Dateien
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

  Erstellte Dateien:
  - src/app/globals.css (Timewise-Farbvariablen, Custom Properties)
  - src/app/(auth)/layout.tsx (Split-Layout: Formular links, Illustration rechts)
  - src/app/(auth)/login/page.tsx (Login-Formular mit E-Mail, Passwort, Remember-Me)
  - src/app/(auth)/register/page.tsx (Registrierung mit Passwort-Bestätigung)
  - src/app/(auth)/reset-password/page.tsx (Reset mit State Pattern: Formular → Bestätigung)
  - src/components/auth/AuthLogo.tsx (Logo-Komponente)
  - src/components/auth/AuthIllustration.tsx (Illustration für rechte Seite)
  - src/components/ui/input.tsx (shadcn/ui Input – neu installiert)
  - src/components/ui/label.tsx (shadcn/ui Label – neu installiert)
  - src/components/ui/checkbox.tsx (shadcn/ui Checkbox – neu installiert)

  Nicht geänderte Dateien (von Sina Eger in separatem Commit gepflegt):
  - src/app/layout.tsx (Atkinson Hyperlegible – Sinas Version beibehalten)
  - tailwind.config.ts (fontFamily – Sinas Version beibehalten)

  Design-Entscheidungen:
  - Split-Layout mit lg-Breakpoint (Illustration nur auf Desktop)
  - State Pattern in ResetPasswordPage (Formular ↔ Bestätigung)
  - Passwort-Sichtbarkeit-Toggle mit Eye/EyeOff Icons
  - Client-seitige Validierung (Passwort-Match, Mindestlänge)
  - Kein API-Call – reine Frontend-Darstellung, API wird in M1 Auth angebunden
  - Timewise-Farben über CSS Custom Properties in globals.css, nicht über Tailwind-Config

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
