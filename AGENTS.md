# Timewise — Projektkontext

> Diese Datei wird von der KI bei jedem Prompt gelesen. Sie enthält alles, was nötig ist, um im Projekt sinnvoll zu arbeiten.

## Was ist Timewise?

Eine webbasierte Anwendung zur strukturierten Erfassung und Auswertung von Lernzeiten. Zielgruppe: Schüler und Studierende. Nicht-kommerzielles Hochschulprojekt (HWR Berlin, Software Engineering, 4. Semester).

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React + Next.js (App Router, SSR) |
| Styling | Tailwind CSS + shadcn/ui |
| Kalender | FullCalendar Standard (@fullcalendar/react) |
| Charts | Recharts |
| Backend | Next.js API Routes |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT, Sessions) |
| Deployment | Vercel (oder vergleichbar) |

## Modulstruktur

Das System besteht aus 6 Modulen. Die Abhängigkeiten bestimmen die Reihenfolge.

### M1 — Auth & Benutzerverwaltung
- **Zweck:** Registrierung, Login, Logout, Passwort-Reset, JWT, RLS Policies
- **Anforderungen:** F1–F6, C1, C2 | AK1–AK11
- **Abhängig von:** nichts (Fundament)
- **Wird gebraucht von:** allen anderen Modulen

### M2 — Keyword-System
- **Zweck:** Keywords erstellen/bearbeiten/löschen, Farbe (Hex-Code) zuweisen
- **Anforderungen:** F18–F24 | AK28–AK35
- **Abhängig von:** M1 Auth
- **Wird gebraucht von:** M3 Events, M5 Statistiken, M6 Ziele

### M3 — Lernzeiterfassung (Herzstück)
- **Zweck:** Events CRUD, automatische Dauerberechnung, Überschneidungsprüfung, Keyword-Zuordnung (n:m), Aggregation
- **Anforderungen:** F10–F17 | AK16–AK27
- **Abhängig von:** M1 Auth, M2 Keywords
- **Wird gebraucht von:** M4 Kalender, M5 Statistiken, M6 Ziele

### M4 — Kalenderansicht
- **Zweck:** Tages-/Wochen-/Monatsansicht, Events mit Keyword-Farben anzeigen, Zeitbereich-Auswahl → Eingabemaske
- **Anforderungen:** F7–F9 | AK12–AK15
- **Abhängig von:** M1 Auth, M3 Events
- **Wird gebraucht von:** nichts (reiner Konsument)
- **Hinweis:** Kein eigener API-Endpunkt — nutzt GET /api/events aus M3

### M5 — Datenvisualisierung
- **Zweck:** Gesamtlernzeit als Kennzahl, Balkendiagramm (pro Keyword), Liniendiagramm (Verlauf), Filter
- **Anforderungen:** F25–F28 | AK36–AK40
- **Abhängig von:** M1 Auth, M2 Keywords (Farben), M3 Events (Daten)
- **Wird gebraucht von:** M6 Ziele (Fortschrittsberechnung)
- **Hinweis:** Nutzt GET /api/events/aggregate aus M3

### M6 — Zielsystem
- **Zweck:** Lernziele definieren (Stunden, Zeitraum, Beschreibung), Keywords zuordnen, Fortschritt automatisch berechnen
- **Anforderungen:** F29–F33 | AK41–AK45
- **Abhängig von:** M1 Auth, M2 Keywords, M3 Events
- **Wird gebraucht von:** nichts (Endpunkt)
- **Wichtig:** Überlappende Ziel-Zeiträume sind ERLAUBT (F31)

## Ordnerstruktur

Legende: ✅ = existiert bereits, 📁 = muss noch erstellt werden

```
timewise/
├── src/
│   ├── app/
│   │   ├── globals.css                 ✅
│   │   ├── layout.tsx                  ✅ Root-Layout
│   │   ├── page.tsx                    ✅ Startseite (Platzhalter)
│   │   ├── (auth)/                     ✅ Auth-Seiten (eigenes Layout, kein Sidebar)
│   │   │   ├── layout.tsx              ✅
│   │   │   ├── login/page.tsx          ✅
│   │   │   ├── register/page.tsx       ✅
│   │   │   └── reset-password/page.tsx ✅
│   │   ├── (dashboard)/                Geschützte Seiten (Sidebar + Navigation)
│   │   │   ├── layout.tsx              📁
│   │   │   ├── calendar/
│   │   │   │   ├── page.tsx            ✅
│   │   │   │   └── CalendarView.tsx    ✅
│   │   │   ├── keywords/page.tsx       ✅
│   │   │   ├── stats/page.tsx          📁
│   │   │   └── goals/page.tsx          📁
│   │   └── api/                        API-Endpunkte
│   │       ├── auth/
│   │       │   ├── callback/route.ts   ✅
│   │       │   ├── login/route.ts      ✅
│   │       │   ├── logout/route.ts     ✅
│   │       │   ├── register/route.ts   ✅
│   │       │   └── reset/route.ts      ✅
│   │       ├── keywords/
│   │       │   ├── route.ts            ✅ GET all, POST create
│   │       │   └── [id]/route.ts       ✅ GET, PUT, DELETE
│   │       ├── events/
│   │       │   ├── route.ts            📁 GET (gefiltert), POST
│   │       │   ├── [id]/route.ts       📁 GET, PUT, DELETE
│   │       │   └── aggregate/route.ts  📁 GET aggregierte Lernzeiten
│   │       └── goals/
│   │           ├── route.ts            📁
│   │           └── [id]/route.ts       📁
│   ├── components/
│   │   ├── ui/                         ✅ shadcn/ui Komponenten
│   │   │   ├── button.tsx              ✅
│   │   │   ├── card.tsx                ✅
│   │   │   ├── checkbox.tsx            ✅
│   │   │   ├── input.tsx               ✅
│   │   │   ├── label.tsx               ✅
│   │   │   ├── toast.tsx               ✅
│   │   │   └── toaster.tsx             ✅
│   │   ├── auth/                       ✅
│   │   │   ├── AuthIllustration.tsx    ✅
│   │   │   └── AuthLogo.tsx            ✅
│   │   ├── EventForm.tsx               ✅ Platzhalter (wird zu components/events/ verschoben)
│   │   ├── keywords/                   📁 KeywordList, KeywordForm, KeywordBadge, ColorPicker, KeywordSelect
│   │   ├── events/                     📁 EventCard, TimeRangePicker, OverlapWarning
│   │   ├── calendar/                   📁 CalendarToolbar, CalendarEvent
│   │   ├── stats/                      📁 StatsOverview, KeywordBarChart, TimelineLineChart, StatsFilterBar
│   │   └── goals/                      📁 GoalList, GoalForm, GoalCard, GoalProgressBar
│   ├── hooks/
│   │   ├── use-toast.ts                ✅
│   │   ├── useCalendar.ts              ✅
│   │   ├── useStats.ts                 📁
│   │   └── useGoals.ts                 📁
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               ✅ Browser Supabase Client
│   │   │   ├── server.ts               ✅ Server Supabase Client
│   │   │   └── middleware.ts           ✅ Session Refresh
│   │   ├── utils.ts                    ✅ Hilfsfunktionen
│   │   ├── services/
│   │   │   ├── auth.service.ts         ✅
│   │   │   ├── keyword.service.ts      ✅
│   │   │   ├── event.service.ts        📁 CRUD + Overlap-Check + Aggregation
│   │   │   └── goal.service.ts         📁 CRUD + Fortschrittsberechnung
│   │   └── validators/
│   │       ├── keyword.validator.ts    ✅
│   │       └── event.validator.ts      📁 Zeitvalidierung, Overlap-Logik
│   ├── types/
│   │   └── index.ts                    ✅ Shared Interfaces
│   └── middleware.ts                   ✅ Next.js Route Protection
├── docs/
│   └── prompt-log.md                   ✅ KI-Prompt-Dokumentation
├── .env.local                          ✅ Supabase Keys (nicht in Git!)
├── CLAUDE.md                           ✅ Claude Code Kontext
├── AGENTS.md                           ✅ OpenAI Codex Kontext
├── .github/copilot-instructions.md     ✅ GitHub Copilot Kontext
├── components.json                     ✅ shadcn/ui Config
├── tailwind.config.ts                  ✅
├── next.config.ts                      ✅
├── postcss.config.mjs                  ✅
├── tsconfig.json                       ✅
└── package.json                        ✅
```

**Datenbankschema existiert bereits in Supabase** — keine lokalen Migrations nötig.

## Datenbankschema (Single Source of Truth)

```sql
-- Events
-- user_id referenziert auth.users(id) — verwaltet von Supabase Auth
CREATE TABLE events (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label       VARCHAR,
    description VARCHAR,
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Goals
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

-- Keywords
CREATE TABLE keywords (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label       VARCHAR NOT NULL,
    description VARCHAR,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    color       VARCHAR NOT NULL
);

-- Event ↔ Keywords (m:n)
CREATE TABLE event_keywords (
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, keyword_id)
);

-- Goal ↔ Keywords (m:n)
CREATE TABLE goal_keywords (
    goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (goal_id, keyword_id)
);
```

**Hinweis:** Es gibt keine eigene `users`-Tabelle. User werden ausschließlich über **Supabase Auth** (`auth.users`) verwaltet. Alle `user_id`-Felder referenzieren direkt `auth.users(id)`.

## TypeScript Interfaces

Die Interfaces bilden das Datenbankschema 1:1 ab. Feldnamen entsprechen den Spaltennamen.

### Kern-Entitäten

```typescript
interface User {
  id: string;                // UUID von Supabase Auth
  email: string;
  created_at: string;        // ISO 8601
}

interface Keyword {
  id: string;
  user_id: string;
  label: string;             // Pflicht (NOT NULL)
  description?: string;
  color: string;             // Hex-Code, Pflicht (NOT NULL)
  created_at: string;
}

interface Event {
  id: string;
  user_id: string;
  label?: string;
  description?: string;
  start_time: string;        // ISO 8601, Pflicht (NOT NULL)
  end_time: string;          // ISO 8601, Pflicht (NOT NULL)
  created_at: string;
}

interface EventKeyword {
  event_id: string;
  keyword_id: string;
}

interface Goal {
  id: string;
  user_id: string;
  label?: string;
  description?: string;
  start_time?: string;       // ISO 8601, optional
  end_time?: string;         // ISO 8601, optional
  target_study_time?: string; // PostgreSQL INTERVAL, z.B. "20:00:00"
  created_at: string;
}

interface GoalKeyword {
  goal_id: string;
  keyword_id: string;
}
```

### API Types

```typescript
// Standardisierter Response-Wrapper
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

interface ApiError {
  code: string;    // z.B. "OVERLAP", "UNAUTHORIZED", "KEYWORD_REQUIRED"
  message: string; // Benutzerfreundlich
  details?: string;
}

// Event mit aufgelösten Keywords
interface EventWithKeywords extends Event {
  keywords: Keyword[];
  duration_minutes: number;  // Berechnet im Backend: (end_time - start_time)
}

// Goal mit berechnetem Fortschritt
interface GoalWithProgress extends Goal {
  keywords: Keyword[];
  logged_minutes: number;
  target_minutes: number;    // Aus target_study_time konvertiert
  percentage: number;        // 0–100+
  is_achieved: boolean;
  remaining_minutes: number;
  days_remaining: number;
}

// Aggregierte Lernzeiten
interface AggregatedTime {
  period: string;
  total_minutes: number;
  by_keyword: {
    keyword_id: string;
    keyword_label: string;
    keyword_color: string;
    minutes: number;
  }[];
}
```

## API Endpoints

```
# Auth (M1)
POST   /api/auth/register       → { email, password }          → AuthResponse
POST   /api/auth/login           → { email, password }          → AuthResponse
POST   /api/auth/logout          → (empty)                      → { success }
POST   /api/auth/reset           → { email }                    → { success }

# Keywords (M2)
GET    /api/keywords             →                              → Keyword[]
POST   /api/keywords             → { label, color, description? } → Keyword
PUT    /api/keywords/:id         → { label?, color?, description? } → Keyword
DELETE /api/keywords/:id         →                              → { success }

# Events (M3)
GET    /api/events               → ?start_date&end_date&keyword_ids → EventWithKeywords[]
POST   /api/events               → { start_time, end_time, keyword_ids[], label?, description? } → EventWithKeywords
PUT    /api/events/:id           → { start_time?, end_time?, keyword_ids?, label?, description? } → EventWithKeywords
DELETE /api/events/:id           →                              → { success }
GET    /api/events/aggregate     → ?start_date&end_date&keyword_ids&granularity → AggregatedTime[]

# Goals (M6)
GET    /api/goals                →                              → GoalWithProgress[]
POST   /api/goals                → { target_study_time, start_time?, end_time?, label?, description?, keyword_ids? } → GoalWithProgress
PUT    /api/goals/:id            → (partial update)             → GoalWithProgress
DELETE /api/goals/:id            →                              → { success }
```

## Validierungsregeln

### Events
- `end_time` > `start_time` → sonst: ApiError `INVALID_TIME_RANGE`
- `end_time` ≤ jetzt → sonst: ApiError `FUTURE_NOT_ALLOWED`
- Keine zeitliche Überschneidung mit bestehenden Events → sonst: ApiError `OVERLAP`
- `keyword_ids.length` ≥ 1 → sonst: ApiError `KEYWORD_REQUIRED`
- `duration_minutes` existiert nicht in der DB — wird im Backend bei jeder Abfrage berechnet

### Keywords
- `label`: min 1, max 50 Zeichen, unique pro User
- `color`: valider Hex-Code (#RRGGBB), Pflichtfeld (NOT NULL)

### Goals
- `target_study_time` als PostgreSQL INTERVAL (z.B. "20:00:00" für 20 Stunden)
- `start_time` und `end_time` sind optional (laut Schema nullable)
- Überlappende Zeiträume sind ERLAUBT
- Fortschritt = Summe aller Events mit zugeordneten Keywords im Ziel-Zeitraum

## Farbkonzept

```
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

## UI-Anforderungen (nicht vergessen!)

- Schriftart: Atkinson Hyperlegible
- Fließtext: mindestens 16px
- Überschriften: mindestens 20px
- Interaktive Elemente: mindestens 44×44px
- Kontrast: mindestens 4,5:1 (WCAG 2.1)
- Responsive: Desktop + Tablet (Smartphone optional)
- Hauptfunktionen in max. 3 Klicks erreichbar
- Fehlermeldungen: immer Fehlergrund + Korrekturhinweis
- Visuelle Bestätigung nach Speichern/Löschen

## Architekturprinzipien

- **Schichtenarchitektur:** Frontend → API Routes → Auth → Business Logic → DB
- **Kein Request erreicht die Business Logic ohne JWT-Validierung**
- **Frontend enthält keine Geschäftslogik** — nur Darstellung
- **Services (lib/services/) enthalten die Business Logic**, API Routes leiten nur weiter
- **RLS (Row-Level Security)** auf allen Tabellen — User sieht nur eigene Daten
- **Bidirektionaler Datenfluss** zwischen Business Logic und PostgreSQL
- **Gestrichelter Auth→DB Pfad:** Auth greift nur bei Login/Register/Token-Refresh auf die DB zu, sonst validiert JWT kryptographisch ohne DB-Call

## Arbeitsweise

Das Team arbeitet iterativ — einzelne Funktionen werden schrittweise umgesetzt, nicht das gesamte System auf einmal. Ziel ist nicht nur funktionierender Code, sondern auch ein nachvollziehbarer Lernprozess (Hochschulprojekt).

## Regeln für die KI

### Scope & Rückfragen
- Erstelle immer nur exakt den Code der angefragt wird — nicht mehr und nicht weniger.
- Wenn eine Anfrage unklar ist oder Abhängigkeiten fehlen: stelle zuerst gezielte Rückfragen bevor du mit dem Code beginnst. Lieber einmal mehr nachfragen als etwas falsch umsetzen.
- Orientiere dich an der Ordnerstruktur und den Interfaces oben.

### Code-Qualität
- Jeder Code wird als eigenständige Komponente oder Modul umgesetzt mit klar definierten Schnittstellen (Props, Parameter, Rückgabewerte).
- Komponenten dürfen keine internen Details anderer Komponenten kennen — Kommunikation nur über definierte Schnittstellen.
- Verständlichkeit hat Vorrang vor Optimierung.
- Code verständlich und kommentiert schreiben — erkläre jede nicht-triviale Zeile mit einem Kommentar direkt im Code.
- Jede API-Route muss zuerst den Auth-Check machen (Supabase Auth JWT validieren).
- Nutze den ApiResponse<T> Wrapper für alle API-Antworten.
- Events brauchen IMMER mindestens ein Keyword — vergiss die Validierung nicht.
- Die Overlap-Prüfung muss auch beim Bearbeiten greifen (excludeId für den eigenen Eintrag).
- Keyword-Farben werden aus der DB geladen und direkt in Charts/Kalender verwendet.
- Alle Zeiten in ISO 8601, alle IDs als UUID.

### Software-Engineering-Prinzipien
Halte folgende Prinzipien konsequent ein:
- **SOLID** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **GoF Entwurfsmuster** wo sinnvoll (z.B. Observer, Command, State)
- **DRY** — Don't Repeat Yourself
- **Separation of Concerns** — Darstellung, Business Logic und Datenzugriff getrennt

### Verbotene Code-Smells

| Code-Smell | Problem | Lösung |
|---|---|---|
| LongMethod | Methode länger als 20 Zeilen | ExtractMethod |
| GodClass | Klasse/Komponente macht alles | ExtractClass |
| FeatureEnvy | Nutzt fremde Daten statt eigene | MoveMethod |
| DuplicateCode | Copy-Paste | ExtractMethod / ExtractClass |
| MagicNumbers | Hardcodierte Werte | ExtractConstant |

### Ausgabeformat für jede User Story oder Funktion

Für jede angeforderte Implementierung lieferst du diese Struktur:

1. **Was** — Kurze Erklärung was umgesetzt wird
2. **Schnittstelle** — Welche Props / Parameter nimmt die Komponente entgegen, was gibt sie zurück?
3. **Warum** — Warum wurde dieses Pattern / diese Umsetzung gewählt? (Bezug auf SOLID, DRY, Separation of Concerns etc.)
4. **Alternativen** — Welche alternativen Implementierungen gab es und warum wurden sie verworfen?
5. **KI-Kennzeichnung** — Markiere explizit welche Teile maßgeblich KI-generiert sind
6. **Menschliche Begründung** — Warum ist diese Implementierung inhaltlich richtig, sicher und effizient? (Nicht: "Die KI hat das vorgeschlagen")
7. **Randfälle** — Welche Randfälle und Fehlerfälle sind zu beachten?
8. **Prüfhinweis** — Was muss konkret im Code auf Richtigkeit, Sicherheit und Effizienz geprüft werden bevor er übernommen wird?
9. **Oral Defense** — Eine kurze Erklärung die dem Dozenten gesagt werden kann wenn er zu diesem Code fragt
10. **Anforderungsbezug** — Beziehe dich wo möglich auf die Projektanforderungen (F1–F33, U1–U5, R1–R5, P1–P3, S1–S6, C1–C2)

### Prompt-Log Dokumentation

Nach jeder Antwort wird die Datei `docs/prompt-log.md` im Projekt aktualisiert. Die Datei wird nie gekürzt oder überschrieben — nur um den neuen Eintrag erweitert. Am Ende jeder Antwort wird der vollständige aktualisierte Inhalt ausgegeben.

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

[Alle vorherigen Einträge bleiben erhalten]
```