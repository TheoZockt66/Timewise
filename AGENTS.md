# Timewise — Projektkontext

> Diese Datei ist die kanonische Projektübersicht für KI-Agents in diesem Repo. `CLAUDE.md` und `.github/copilot-instructions.md` sollten inhaltlich denselben Stand widerspiegeln.

## Was ist Timewise?

Eine webbasierte Anwendung zur strukturierten Erfassung und Auswertung von Lernzeiten. Zielgruppe: Schüler und Studierende. Nicht-kommerzielles Hochschulprojekt (HWR Berlin, Software Engineering, 4. Semester).

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Frontend | React 19 + Next.js 16 (App Router, SSR/Client Components) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Kalender | FullCalendar |
| Charts | Recharts |
| Backend | Next.js Route Handlers (`route.ts`) |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth + RLS |
| Testing | Vitest + Testing Library |
| Deployment | Vercel |

## Aktueller Repo-Stand

- M1 bis M6 sind im Repo angelegt und in wesentlichen Teilen implementiert.
- Route-Protection läuft über `src/proxy.ts`; es gibt kein aktives `src/middleware.ts`.
- Die Startseite `/` ist aktuell eine geschützte Navigationsseite für eingeloggte User.
- Die Auth-Seiten `/login`, `/register` und `/reset-password` sind öffentlich.
- Es gibt kein eigenes `(dashboard)/layout.tsx`; die geschützten Seiten liegen direkt unter `src/app/(dashboard)/...`.
- Das Datenbankschema liegt in Supabase. Im Repo gibt es aktuell keine lokalen SQL-Migrationsdateien.

## Modulstruktur

Das System besteht aus 6 Modulen. Die Abhängigkeiten bestimmen die Reihenfolge.

### M1 — Auth & Benutzerverwaltung
- Zweck: Registrierung, Login, Logout, Passwort-Reset, JWT, RLS Policies
- Anforderungen: F1–F6, C1, C2 | AK1–AK11
- Abhängig von: nichts
- Wird gebraucht von: allen anderen Modulen

### M2 — Keyword-System
- Zweck: Keywords erstellen, bearbeiten und löschen, Farbe (Hex-Code) zuweisen
- Anforderungen: F18–F24 | AK28–AK35
- Abhängig von: M1 Auth
- Wird gebraucht von: M3 Events, M5 Statistiken, M6 Ziele

### M3 — Lernzeiterfassung
- Zweck: Events CRUD, Dauerberechnung, Überschneidungsprüfung, Keyword-Zuordnung (n:m), Aggregation
- Anforderungen: F10–F17 | AK16–AK27
- Abhängig von: M1 Auth, M2 Keywords
- Wird gebraucht von: M4 Kalender, M5 Statistiken, M6 Ziele

### M4 — Kalenderansicht
- Zweck: Tages-, Wochen- und Monatsansicht, Event-Details, Bearbeitung und Löschung
- Anforderungen: F7–F9 | AK12–AK15
- Abhängig von: M1 Auth, M3 Events
- Wird gebraucht von: nichts
- Hinweis: Nutzt die Events-API aus M3

### M5 — Datenvisualisierung
- Zweck: Gesamtlernzeit, Balkendiagramm pro Keyword, Liniendiagramm, Filter
- Anforderungen: F25–F28 | AK36–AK40
- Abhängig von: M1 Auth, M2 Keywords, M3 Events
- Wird gebraucht von: M6 Ziele
- Hinweis: Nutzt `GET /api/events/aggregate`

### M6 — Zielsystem
- Zweck: Lernziele definieren, Keywords zuordnen, Fortschritt berechnen
- Anforderungen: F29–F33 | AK41–AK45
- Abhängig von: M1 Auth, M2 Keywords, M3 Events
- Wird gebraucht von: nichts
- Wichtig: Überlappende Zielzeiträume sind erlaubt

## Ordnerstruktur

Legende: `✅` = existiert im aktuellen Repo

```text
timewise/
├── src/
│   ├── app/
│   │   ├── globals.css                 ✅
│   │   ├── layout.tsx                  ✅ Root-Layout
│   │   ├── page.tsx                    ✅ geschützte Start-/Navigationsseite
│   │   ├── (auth)/                     ✅ öffentliches Auth-Segment
│   │   │   ├── layout.tsx              ✅
│   │   │   ├── login/page.tsx          ✅
│   │   │   ├── register/page.tsx       ✅
│   │   │   └── reset-password/page.tsx ✅
│   │   ├── (dashboard)/                ✅ geschützte Seiten ohne eigenes Segment-Layout
│   │   │   ├── calendar/
│   │   │   │   ├── page.tsx            ✅
│   │   │   │   └── CalendarView.tsx    ✅
│   │   │   ├── keywords/page.tsx       ✅
│   │   │   ├── stats/page.tsx          ✅
│   │   │   └── goals/page.tsx          ✅
│   │   └── api/                        ✅ Route Handler
│   │       ├── auth/
│   │       │   ├── callback/route.ts   ✅
│   │       │   ├── login/route.ts      ✅
│   │       │   ├── logout/route.ts     ✅
│   │       │   ├── register/route.ts   ✅
│   │       │   └── reset/route.ts      ✅
│   │       ├── keywords/
│   │       │   ├── route.ts            ✅ GET, POST
│   │       │   └── [id]/route.ts       ✅ PUT, DELETE
│   │       ├── events/
│   │       │   ├── route.ts            ✅ GET, POST
│   │       │   ├── [id]/route.ts       ✅ PUT, DELETE
│   │       │   └── aggregate/route.ts  ✅ GET Aggregation
│   │       └── goals/
│   │           ├── route.ts            ✅ GET, POST
│   │           └── [id]/route.ts       ✅ PUT, DELETE
│   ├── components/
│   │   ├── ui/                         ✅ shadcn/ui Basiskomponenten
│   │   │   ├── button.tsx              ✅
│   │   │   ├── card.tsx                ✅
│   │   │   ├── checkbox.tsx            ✅
│   │   │   ├── input.tsx               ✅
│   │   │   ├── label.tsx               ✅
│   │   │   ├── toast.tsx               ✅
│   │   │   └── toaster.tsx             ✅
│   │   ├── auth/
│   │   │   ├── AuthIllustration.tsx    ✅
│   │   │   └── AuthLogo.tsx            ✅
│   │   ├── calendar/
│   │   │   └── EventDetails.tsx        ✅
│   │   ├── events/
│   │   │   ├── EventForm.tsx           ✅
│   │   │   ├── KeywordSelector.tsx     ✅
│   │   │   └── TimeRangePicker.tsx     ✅
│   │   ├── goals/
│   │   │   ├── GoalCard.tsx            ✅
│   │   │   ├── GoalForm.tsx            ✅
│   │   │   ├── GoalList.tsx            ✅
│   │   │   └── GoalProgressBar.tsx     ✅
│   │   └── stats/
│   │       ├── CustomTooltip.tsx       ✅
│   │       ├── KeywordBarChart.tsx     ✅
│   │       ├── KeywordSelect.tsx       ✅
│   │       ├── StatsFilterBar.tsx      ✅
│   │       └── TimelineLineChart.tsx   ✅
│   ├── hooks/
│   │   ├── use-toast.ts                ✅
│   │   ├── useCalendar.ts              ✅
│   │   ├── useStats.ts                 ✅
│   │   └── useGoals.ts                 ✅
│   ├── lib/
│   │   ├── env.ts                      ✅
│   │   ├── utils.ts                    ✅
│   │   ├── supabase/
│   │   │   ├── client.ts               ✅
│   │   │   ├── server.ts               ✅
│   │   │   └── middleware.ts           ✅ Session-/Route-Logik
│   │   ├── services/
│   │   │   ├── auth.service.ts         ✅
│   │   │   ├── auth.service.test.ts    ✅
│   │   │   ├── event.service.ts        ✅
│   │   │   ├── goal.service.ts         ✅
│   │   │   └── keyword.service.ts      ✅
│   │   └── validators/
│   │       ├── event.validator.ts      ✅
│   │       ├── goal.validator.ts       ✅
│   │       ├── goal.validator.test.ts  ✅
│   │       ├── keyword.validator.ts    ✅
│   │       └── keyword.validator.test.ts ✅
│   ├── types/
│   │   └── index.ts                    ✅
│   └── proxy.ts                        ✅ Next.js Proxy Entry
├── docs/
│   ├── prompt-log.md                   lokal, nicht committen
│   └── vercel-deployment.md            ✅
├── public/
│   └── timewise-logo.svg               ✅
├── scripts/
│   └── generate-tests.ts               ✅
├── .env.example                        ✅
├── .env.local                          ✅ lokal, nicht committen
├── AGENTS.md                           ✅
├── CLAUDE.md                           ✅
├── .github/copilot-instructions.md     ✅
├── README.md                           ✅
├── Onboarding.md                       ✅
├── components.json                     ✅
├── eslint.config.mjs                   ✅
├── next.config.ts                      ✅
├── package.json                        ✅
├── package-lock.json                   ✅
├── postcss.config.mjs                  ✅
├── tailwind.config.ts                  ✅
├── tsconfig.json                       ✅
├── vitest.config.ts                    ✅
└── vitest.setup.ts                     ✅
```

## Datenbankschema

Das Datenbankschema existiert bereits in Supabase. Es gibt aktuell keine lokalen Migrationsdateien im Repo.

```sql
CREATE TABLE events (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label       VARCHAR,
    description VARCHAR,
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE goals (
    id                UUID PRIMARY KEY,
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label             VARCHAR,
    description       VARCHAR,
    start_time        TIMESTAMP,
    end_time          TIMESTAMP,
    target_study_time INTERVAL,
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE keywords (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label       VARCHAR NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    color       VARCHAR NOT NULL
);

CREATE TABLE event_keywords (
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, keyword_id)
);

CREATE TABLE goal_keywords (
    goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (goal_id, keyword_id)
);
```

Hinweis:
- Es gibt keine eigene `users`-Tabelle im Anwendungsschema.
- User werden ausschließlich über Supabase Auth (`auth.users`) verwaltet.
- Alle `user_id`-Spalten referenzieren direkt `auth.users(id)`.
- Funktionierende RLS-Policies in Supabase sind für CRUD zwingend erforderlich.

## TypeScript Interfaces

Die Shared Types liegen in `src/types/index.ts`.

### Kern-Entitäten

```typescript
interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Keyword {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
}

interface Event {
  id: string;
  user_id: string;
  label?: string;
  description?: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  label?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  target_study_time?: string | null;
  created_at: string;
}
```

### Auth- und API-Typen

```typescript
interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

interface ApiError {
  code: string;
  message: string;
  details?: string;
}

interface EventWithKeywords extends Event {
  keywords: Keyword[];
  duration_minutes: number;
}

interface GoalWithProgress extends Goal {
  keywords: Keyword[];
  logged_minutes: number;
  target_minutes: number;
  percentage: number;
  is_achieved: boolean;
  remaining_minutes: number;
  days_remaining: number;
}
```

## API Endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset
GET    /api/auth/callback

GET    /api/keywords
POST   /api/keywords
PUT    /api/keywords/:id
DELETE /api/keywords/:id

GET    /api/events
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/events/aggregate

GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id
```

## Validierungsregeln

### Events
- `end_time` muss nach `start_time` liegen.
- Events dürfen nicht in der Zukunft enden.
- Zeitliche Überschneidungen mit bestehenden Events sind unzulässig.
- Laut Projektanforderung braucht jedes Event mindestens ein Keyword.

### Keywords
- `label`: Pflichtfeld, nicht leer, maximal 50 Zeichen
- `color`: valider Hex-Code im Format `#RRGGBB`
- Label-Eindeutigkeit pro User sollte serverseitig berücksichtigt werden

### Goals
- `label` ist bei Create verpflichtend.
- `label` darf nicht nur aus Leerzeichen bestehen und maximal 100 Zeichen lang sein.
- `target_study_time` ist aktuell optional; wenn gesetzt, dann im Format `HH:MM:SS` und größer als `0`.
- `start_time` und `end_time` sind optional.
- `end_time` darf nicht vor `start_time` liegen.
- Überlappende Zielzeiträume sind erlaubt.
- Fortschritt berechnet sich aus passenden Events im Zielzeitraum über die zugeordneten Keywords.

## Skripte & Tests

### npm-Skripte
- `npm run dev` → lokale Entwicklung mit Next.js
- `npm run build` → Produktions-Build
- `npm run start` → Start des gebauten Projekts
- `npm run lint` → ESLint über das ganze Repo
- `npm run test` → Vitest Watch Mode
- `npm run test:run` → Vitest einmalig
- `npm run generate-tests` → Test-Generierungsskript

### Vorhandene Testdateien
- `src/lib/validators/keyword.validator.test.ts`
- `src/lib/validators/goal.validator.test.ts`
- `src/lib/services/auth.service.test.ts`

## Farbkonzept

```text
Primär (Lila):     #5500B0, #7700F4, #9B3FF7, #C98BFB, #EDD9FE
Akzent (Türkis):   #00957F, #00C2A8, #33CDB7, #99E8DE, #CCFAF4
Success:           #22C55E
Warning:           #F59E0B
Error:             #EF4444
Info:              #3B82F6
Text Primary:      #1A1A2E
Text Secondary:    #6B7280
Text Disabled:     #B0B7C3
Border:            #E5E7EB
Surface:           #F7F4FF
Background:        #FFFFFF
```

## UI-Anforderungen

- Schriftart: Atkinson Hyperlegible
- Fließtext: mindestens 16px
- Überschriften: mindestens 20px
- Interaktive Elemente: mindestens 44×44px
- Kontrast: mindestens 4,5:1 (WCAG 2.1)
- Responsive: Desktop + Tablet
- Hauptfunktionen in maximal 3 Klicks erreichbar
- Fehlermeldungen: immer Fehlergrund plus Korrekturhinweis
- Visuelle Bestätigung nach Speichern und Löschen

## Architekturprinzipien

- Schichtenarchitektur: Frontend → Route Handler → Auth → Business Logic → DB
- Kein Request erreicht die Business Logic ohne Auth-Prüfung
- Frontend enthält keine Geschäftslogik, sondern Darstellung und UI-State
- Services in `src/lib/services/` enthalten die fachliche Logik
- RLS auf allen Tabellen: User sieht nur eigene Daten
- Route-Protection läuft zentral über `src/proxy.ts` und `src/lib/supabase/middleware.ts`
- Shared Types liegen zentral in `src/types/index.ts`

## Arbeitsweise

Das Team arbeitet iterativ. Einzelne Funktionen werden schrittweise umgesetzt, nicht das gesamte System auf einmal. Ziel ist nicht nur funktionierender Code, sondern auch ein nachvollziehbarer Lernprozess.

## Regeln für die KI

### Scope & Rückfragen
- Erstelle immer nur exakt den Code, der angefragt wird.
- Wenn eine Anfrage unklar ist oder Abhängigkeiten fehlen: zuerst gezielte Rückfragen stellen.
- Orientiere dich an der Ordnerstruktur und den Interfaces oben.

### Code-Qualität
- Jeder Baustein wird als eigenständige Komponente oder Modul mit klarer Schnittstelle umgesetzt.
- Komponenten dürfen keine internen Details anderer Komponenten kennen.
- Verständlichkeit hat Vorrang vor Mikro-Optimierung.
- Nicht triviale Logik direkt im Code knapp kommentieren.
- Jede API-Route macht zuerst den Auth-Check.
- Nutze den `ApiResponse<T>`-Wrapper für API-Antworten.
- Zeiten in ISO 8601, IDs als UUID.

### Software-Engineering-Prinzipien
- SOLID
- DRY
- Separation of Concerns
- GoF-Muster nur dort einsetzen, wo sie das Design wirklich verbessern

### Verbotene Code-Smells

| Code-Smell | Problem | Lösung |
|---|---|---|
| LongMethod | Methode länger als nötig | Extract Method |
| GodClass | Klasse/Komponente macht zu viel | Extract Class |
| FeatureEnvy | Nutzt fremde Daten statt eigene | Move Method |
| DuplicateCode | Copy-Paste | Extract Method / Extract Class |
| MagicNumbers | Hardcodierte Werte | Extract Constant |

### Ausgabeformat für größere User Stories oder Funktionen

1. Was
2. Schnittstelle
3. Warum
4. Alternativen
5. KI-Kennzeichnung
6. Menschliche Begründung
7. Randfälle
8. Prüfhinweis
9. Oral Defense
10. Anforderungsbezug

Bei kleinen, klaren Änderungen reicht eine knappe, direkte Antwort.

## Prompt-Log Dokumentation

Nach jeder Antwort mit tatsächlichen Dateiänderungen wird `docs/prompt-log.md` lokal ergänzt. Die Datei dient nur der lokalen Nachvollziehbarkeit, ist per Git ignoriert und wird nicht committed oder gepusht.

Format:

```markdown
# Timewise – Prompt Log

---

Eintrag Nr.: [Fortlaufende Nummer]
Datum: [Datum]
Prompt: [Exakter Prompt]
Aktion: [ERSTELLT / GEÄNDERT / GELÖSCHT]
Datei / Komponente: [Welche Datei oder Komponente betroffen ist]
Schnittstelle: [Props / Parameter / Rückgabewerte der Komponente]
Beschreibung: [Was wurde gemacht und warum]

---
```
