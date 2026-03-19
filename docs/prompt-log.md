# Timewise – Prompt Log

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
