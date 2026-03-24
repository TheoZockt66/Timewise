# Timewise — Team-Onboarding

Dieses Dokument erklärt alles was ihr braucht um am Projekt mitzuarbeiten. Lest es einmal durch, danach könnt ihr direkt loslegen.

---

## 1. KI-Kontextdatei (CLAUDE.md / AGENTS.md)

Im Projekt-Root liegen drei Dateien mit identischem Inhalt:

| Datei | Wird gelesen von |
|-------|-----------------|
| `CLAUDE.md` | Claude Code (Terminal) |
| `AGENTS.md` | OpenAI Codex / ChatGPT |
| `.github/copilot-instructions.md` | GitHub Copilot (VS Code) |

**Was steht drin?** Alles was die KI braucht um sinnvoll Code zu generieren: Tech-Stack, Modulstruktur, Datenbankschema, TypeScript Interfaces, API-Contracts, Validierungsregeln, Farbkonzept, UI-Anforderungen und Coding-Regeln.

**Warum ist das wichtig?** Ohne diese Datei erfindet die KI Feldnamen die nicht zur Datenbank passen (z.B. `event.title` statt `event.label`). Mit der Datei kennt sie das Schema und baut Code der sofort funktioniert.

**Was müsst ihr tun?** Nichts — die Datei wird automatisch gelesen sobald ihr in eurem IDE einen KI-Prompt absetzt. Einfach im Timewise-Ordner arbeiten und losprompen.

**Wichtig:** Wenn sich etwas am Schema oder an den Interfaces ändert, müssen alle drei Dateien aktualisiert werden. Am einfachsten: CLAUDE.md anpassen, dann in die anderen beiden kopieren.

---

## 2. Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React + Next.js (App Router, SSR) |
| Styling | Tailwind CSS + shadcn/ui |
| Kalender | FullCalendar Standard (@fullcalendar/react) |
| Charts | Recharts |
| Backend | Next.js API Routes |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT, Sessions) |

---

## 3. Datenbankschema

Die Tabellen existieren bereits in Supabase. Hier die Struktur als Referenz — die Feldnamen müssen überall im Code exakt so verwendet werden.

```sql
-- Users (von Supabase Auth verwaltet)
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    email         VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Keywords
CREATE TABLE keywords (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    label       VARCHAR NOT NULL,
    description VARCHAR,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    color       VARCHAR NOT NULL           -- Hex-Code, z.B. "#7700F4"
);

-- Events (Lernzeiteinträge)
CREATE TABLE events (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    label       VARCHAR,
    description VARCHAR,
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Goals (Lernziele)
CREATE TABLE goals (
    id                UUID PRIMARY KEY,
    user_id           UUID NOT NULL REFERENCES users(id),
    label             VARCHAR,
    description       VARCHAR,
    start_time        TIMESTAMP,           -- optional!
    end_time          TIMESTAMP,           -- optional!
    target_study_time INTERVAL,            -- z.B. '20:00:00' für 20 Stunden
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

-- Verknüpfungstabellen (n:m)
CREATE TABLE event_keywords (
    event_id    UUID NOT NULL REFERENCES events(id),
    keyword_id  UUID NOT NULL REFERENCES keywords(id),
    PRIMARY KEY (event_id, keyword_id)
);

CREATE TABLE goal_keywords (
    goal_id     UUID NOT NULL REFERENCES goals(id),
    keyword_id  UUID NOT NULL REFERENCES keywords(id),
    PRIMARY KEY (goal_id, keyword_id)
);
```
---

## 4. Module und Abhängigkeiten

Das System hat 6 Module. Die einzigen echten Abhängigkeiten bestehen zwischen den API-Endpunkten — kein UI-Modul hängt von einem anderen UI-Modul ab.

### Übersicht

| Modul         | Eigene DB-Tabellen     | Eigene API                         | Braucht APIs von |
|-------        |-------------------     |------------                        |-----------------|
| M1 Auth       | users (via Supabase)   | /api/auth/*                        | — |
| M2 Keywords   | keywords               | /api/keywords                      | M1 |
| M3 Events     | events, event_keywords | /api/events, /api/events/aggregate | M1 M2 |
| M4 Kalender   | keine                  | keine eigene                       | M3 (/api/events) |
| M5 Statistiken| keine                  | keine eigene                       | M3 (/api/events/aggregate), M2 (Farben) |
| M6 Ziele      | goals, goal_keywords   | /api/goals                         | M1, M2, M3 |

### Was jedes Modul macht

**M1 Auth** — Login, Register, Logout, Passwort-Reset. Konfiguriert Supabase Auth und die Row-Level Security Policies auf allen Tabellen (damit jeder User nur seine eigenen Daten sieht). Anforderungen: F1–F6, C1, C2.

**M2 Keywords** — Keywords erstellen, bearbeiten, löschen, Farbe zuweisen. Stellt auch die shared Komponenten `KeywordSelect` (Multi-Select Dropdown) und `KeywordBadge` (farbiges Label) bereit, die M3, M5 und M6 im UI einbinden. Anforderungen: F18–F24.

**M3 Events** — Lernzeiteinträge CRUD. Automatische Dauerberechnung (end_time - start_time), Überschneidungsprüfung, Keyword-Zuordnung. Stellt den Aggregations-Endpunkt bereit den M5 und M6 nutzen. Das Herzstück der App. Anforderungen: F10–F17.

**M4 Kalender** — Reine Darstellung. Zeigt Events in Tages-/Wochen-/Monatsansicht mit FullCalendar. Hat keinen eigenen API-Endpunkt, ruft nur `GET /api/events` aus M3 auf. Anforderungen: F7–F9.

**M5 Statistiken** — Reine Darstellung. Zeigt Gesamtlernzeit, Balkendiagramm (pro Keyword), Liniendiagramm (Verlauf). Ruft `GET /api/events/aggregate` aus M3 und die Keyword-Farben aus M2 auf. Anforderungen: F25–F28.

**M6 Ziele** — Lernziele definieren (Stundenzahl, Zeitraum), Keywords zuordnen, Fortschritt automatisch berechnen. Hat eigene DB-Tabellen UND nutzt die Events-API für die Fortschrittsberechnung. Überlappende Ziel-Zeiträume sind erlaubt. Anforderungen: F29–F33.

---

## 5. API-Contracts

Jeder API-Endpunkt mit Request und Response. Das ist der Vertrag an den sich Frontend und Backend halten.

### Auth (M1)
```
POST   /api/auth/register     →  { email, password }               →  AuthResponse
POST   /api/auth/login         →  { email, password }               →  AuthResponse
POST   /api/auth/logout        →  (empty)                           →  { success }
POST   /api/auth/reset         →  { email }                         →  { success }
```

### Keywords (M2)
```
GET    /api/keywords           →                                    →  Keyword[]
POST   /api/keywords           →  { label, color, description? }    →  Keyword
PUT    /api/keywords/:id       →  { label?, color?, description? }  →  Keyword
DELETE /api/keywords/:id       →                                    →  { success }
```

### Events (M3)
```
GET    /api/events             →  ?start_date&end_date&keyword_ids  →  EventWithKeywords[]
POST   /api/events             →  { start_time, end_time,
                                    keyword_ids[], label?,
                                    description? }                  →  EventWithKeywords
PUT    /api/events/:id         →  { start_time?, end_time?,
                                    keyword_ids?, label?,
                                    description? }                  →  EventWithKeywords
DELETE /api/events/:id         →                                    →  { success }
GET    /api/events/aggregate   →  ?start_date&end_date
                                   &keyword_ids&granularity         →  AggregatedTime[]
```

### Goals (M6)
```
GET    /api/goals              →                                    →  GoalWithProgress[]
POST   /api/goals              →  { target_study_time,
                                    start_time?, end_time?,
                                    label?, description?,
                                    keyword_ids? }                  →  GoalWithProgress
PUT    /api/goals/:id          →  (partial update)                  →  GoalWithProgress
DELETE /api/goals/:id          →                                    →  { success }
```

### Standardisierter Response-Wrapper

Jede API-Antwort kommt in diesem Format:
```typescript
interface ApiResponse<T> {
  data: T | null;       // Ergebnis bei Erfolg
  error: ApiError | null; // Fehler bei Misserfolg
}

interface ApiError {
  code: string;         // z.B. "OVERLAP", "UNAUTHORIZED", "KEYWORD_REQUIRED"
  message: string;      // Benutzerfreundliche Fehlermeldung
}
```

---

## 6. TypeScript Interfaces

Diese Interfaces bilden das Datenbankschema 1:1 ab. Sie stehen in `src/lib/types/index.ts` und werden überall importiert.

### Kern-Entitäten (= Datenbanktabellen)

```typescript
interface Keyword {
  id: string;
  user_id: string;
  label: string;              // NOT NULL
  description?: string;
  color: string;              // Hex-Code, NOT NULL
  created_at: string;
}

interface Event {
  id: string;
  user_id: string;
  label?: string;
  description?: string;
  start_time: string;         // ISO 8601, NOT NULL
  end_time: string;           // ISO 8601, NOT NULL
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  label?: string;
  description?: string;
  start_time?: string;        // optional
  end_time?: string;          // optional
  target_study_time?: string; // INTERVAL, z.B. "20:00:00"
  created_at: string;
}
```

### Erweiterte Types (= API-Antworten mit berechneten Feldern)

```typescript
// Event + aufgelöste Keywords + berechnete Dauer
interface EventWithKeywords extends Event {
  keywords: Keyword[];
  duration_minutes: number;   // Berechnet im Backend, nicht in der DB
}

// Goal + Fortschritt
interface GoalWithProgress extends Goal {
  keywords: Keyword[];
  logged_minutes: number;
  target_minutes: number;     // Aus target_study_time konvertiert
  percentage: number;         // 0–100+
  is_achieved: boolean;
}

// Aggregierte Lernzeiten (für Statistiken)
interface AggregatedTime {
  period: string;             // z.B. "2026-03-24" oder "2026-W13"
  total_minutes: number;
  by_keyword: {
    keyword_id: string;
    keyword_label: string;
    keyword_color: string;
    minutes: number;
  }[];
}
```

---

## 7. Entwicklungsplan — API zuerst, dann UI parallel

### Phase 1: API-Schicht bauen (nacheinander)

Nur die `route.ts` + `service.ts` Dateien. Kein UI, keine Komponenten, kein Styling. Pro Modul wenige Dateien, geht schnell.

```
M1 Auth API  →  M2 Keywords API  →  M3 Events API
                                          ↓
                                    M6 Goals API (kann parallel zu M3)
```

Reihenfolge ist nötig weil Events die Keywords-Tabelle brauchen und Goals die Events-API für Fortschrittsberechnung.

### Phase 2: UI + Frontend (alle parallel!)

Sobald die APIs stehen, gibt es keine Abhängigkeiten mehr. Drei Leute können gleichzeitig arbeiten:

**Person A** baut: Auth-Seiten (Login, Register), Keywords-Verwaltung, Event-Formulare

**Person B** baut: Kalenderansicht (FullCalendar), Statistik-Seite (Recharts)

**Person C** baut: Ziele-Seite, Dashboard-Layout, Sidebar, Navigation

Niemand blockiert niemanden — alle rufen nur die fertigen APIs auf.

---

## 8. Ordnerstruktur

### Gesamtübersicht

Legende: ✅ existiert, 📁 muss noch erstellt werden

```
timewise/
├── src/
│   ├── app/
│   │   ├── globals.css                 ✅
│   │   ├── layout.tsx                  ✅ Root-Layout
│   │   ├── page.tsx                    ✅ Startseite
│   │   ├── (auth)/                     📁 Auth-Seiten (eigenes Layout, kein Sidebar)
│   │   ├── (dashboard)/                📁 Geschützte Seiten (Sidebar + Navigation)
│   │   │   ├── calendar/
│   │   │   ├── keywords/
│   │   │   ├── stats/
│   │   │   └── goals/
│   │   └── api/                        📁 API-Endpunkte
│   ├── components/
│   │   ├── ui/                         ✅ shadcn/ui Komponenten
│   │   ├── auth/                       📁
│   │   ├── keywords/                   📁
│   │   ├── events/                     📁
│   │   ├── calendar/                   📁
│   │   ├── stats/                      📁
│   │   └── goals/                      📁
│   ├── hooks/                          📁
│   ├── lib/
│   │   ├── supabase/                   ✅ client.ts, server.ts, middleware.ts
│   │   ├── types/index.ts             ✅ Shared Interfaces
│   │   ├── utils.ts                    ✅
│   │   ├── services/                   📁
│   │   └── validators/                 📁
│   └── middleware.ts                   ✅
├── CLAUDE.md                           ✅
├── AGENTS.md                           ✅
└── .github/copilot-instructions.md     ✅
```

### Pro Modul — was muss wo hin?

Jedes Modul besteht aus den gleichen Bausteinen. Hier ist erklärt was wo reingehört:

#### `app/api/[modul]/route.ts` — API-Endpunkte

Hier landet der Code der HTTP-Requests entgegennimmt. Eine route.ts macht drei Dinge und nicht mehr: Auth prüfen, Daten aus dem Request lesen, an den Service weiterleiten. Keine Geschäftslogik, keine Datenbankabfragen direkt hier.

Betrifft: M1 Auth, M2 Keywords, M3 Events, M6 Goals
Nicht betroffen: M4 Kalender und M5 Statistiken (die haben keine eigene API)

#### `app/(dashboard)/[modul]/page.tsx` — Seiten

Die Seite die der User im Browser sieht. Bindet Komponenten und Hooks zusammen. Hier steht kein Styling und keine Logik — die Seite importiert nur die Teile und steckt sie zusammen.

Jedes Modul das eine eigene Ansicht hat bekommt eine Seite hier: Keywords, Calendar, Stats, Goals.

#### `components/[modul]/` — UI-Bausteine

Alles was der User sieht und womit er interagiert: Formulare, Listen, Karten, Buttons, Dialoge. Eine Komponente bekommt ihre Daten über Props und gibt Events nach oben (z.B. `onSave`, `onClick`). Sie holt sich nie selbst Daten von der API — das macht der Hook.

Faustregel: Wenn du HTML/JSX schreibst, gehört es hierhin.

#### `hooks/use[Modul].ts` — Frontend-Logik

Der Vermittler zwischen Komponenten und API. Ein Hook ruft `fetch("/api/events")` auf, speichert das Ergebnis in React State, und gibt es an die Komponente weiter. Hier landet auch Logik wie "welche Kalenderansicht ist aktiv" oder "welcher Zeitraum-Filter ist gesetzt".

Faustregel: Wenn du `useState`, `useEffect` oder `fetch` schreibst, gehört es in einen Hook.

#### `lib/services/[modul].service.ts` — Backend-Logik

Die eigentliche Geschäftslogik. Wird von den API-Routes aufgerufen, redet mit Supabase, macht Validierungen, berechnet Werte. Hier passiert der Overlap-Check, die Dauerberechnung, die Fortschrittsberechnung.

Faustregel: Wenn du mit der Datenbank redest oder Geschäftsregeln umsetzt, gehört es hierhin.

#### `lib/validators/` — Prüfregeln

Aus den Services extrahierte Validierungslogik. Z.B. "liegt die Endzeit nach der Startzeit?" oder "ist mindestens ein Keyword zugeordnet?". Wird vom Service aufgerufen, kann aber auch vom Frontend importiert werden um Formulare vor dem Absenden zu prüfen.

#### `lib/types/index.ts` — TypeScript Interfaces

Die gemeinsame Sprache zwischen Frontend und Backend. Jede Komponente, jeder Hook, jeder Service importiert die gleichen Interfaces. Wenn sich ein Feld ändert, muss es nur hier geändert werden und TypeScript zeigt überall Fehler wo es nicht passt.

#### `lib/supabase/` — Datenbankverbindung

Bereits eingerichtet. `client.ts` für den Browser, `server.ts` für die API-Routes. Nicht anfassen außer es gibt einen Grund.

#### `components/ui/` — shadcn/ui Basiskomponenten

Bereits eingerichtet. Buttons, Inputs, Dialoge etc. die von shadcn/ui kommen. Werden von den Modul-Komponenten importiert, nicht direkt in Seiten genutzt.

#### Zusammengefasst

```
Ich will...                          → Datei gehört in...
─────────────────────────────────────────────────────────
HTML/JSX schreiben (UI)              → components/[modul]/
Daten von der API holen (Frontend)   → hooks/use[Modul].ts
HTTP-Request entgegennehmen          → app/api/[modul]/route.ts
Geschäftslogik / DB-Query            → lib/services/[modul].service.ts
Eingaben prüfen                      → lib/validators/
Datenstruktur definieren             → lib/types/index.ts
Eine neue Seite anlegen              → app/(dashboard)/[modul]/page.tsx
```

---

## 9. Validierungsregeln

Diese Regeln müssen in den Services implementiert werden:

### Events
- `end_time` muss nach `start_time` liegen → sonst Fehler `INVALID_TIME_RANGE`
- `end_time` darf nicht in der Zukunft liegen → sonst Fehler `FUTURE_NOT_ALLOWED`
- Keine zeitliche Überschneidung mit bestehenden Events → sonst Fehler `OVERLAP`
- Mindestens 1 Keyword muss zugeordnet sein → sonst Fehler `KEYWORD_REQUIRED`
- `duration_minutes` wird im Backend berechnet, nie vom User gesetzt, nicht in der DB gespeichert

### Keywords
- `label`: min 1 Zeichen, max 50 Zeichen, unique pro User
- `color`: valider Hex-Code (#RRGGBB), Pflichtfeld

### Goals
- `target_study_time` als PostgreSQL INTERVAL (z.B. "20:00:00")
- `start_time` und `end_time` sind optional
- Überlappende Ziel-Zeiträume sind erlaubt (F31)

---

## 10. Farbkonzept

```
Primär (Lila):     #5500B0, #7700F4, #9B3FF7, #C98BFB, #EDD9FE
Akzent (Türkis):   #00957F, #00C2A8, #33CDB7, #99E8DE, #CCFAF4
Success:           #22C55E
Warning:           #F59E0B
Error:             #EF4444
Info:              #3B82F6
Text Primary:      #1A1A2E
Text Secondary:    #6B7280
Border:            #E5E7EB
Surface:           #F7F4FF
Background:        #FFFFFF
```

---

## 11. UI-Anforderungen

- Schriftart: Atkinson Hyperlegible
- Fließtext: mindestens 16px
- Überschriften: mindestens 20px
- Interaktive Elemente: mindestens 44×44px
- Kontrast: mindestens 4,5:1 (WCAG 2.1)
- Responsive: Desktop + Tablet (Smartphone optional)
- Hauptfunktionen in max. 3 Klicks erreichbar
- Fehlermeldungen: immer Fehlergrund + Korrekturhinweis
- Visuelle Bestätigung nach Speichern/Löschen

---

## 12. Coding-Regeln

- Jede API-Route macht zuerst einen Auth-Check (JWT validieren)
- Alle API-Antworten nutzen den `ApiResponse<T>` Wrapper
- Komponenten kommunizieren nur über Props — keine internen Details anderer Komponenten
- Verständlichkeit vor Optimierung
- Nicht-triviale Zeilen im Code kommentieren
- SOLID-Prinzipien einhalten
- Keine Methoden länger als 20 Zeilen (ExtractMethod)
- Keine Magic Numbers (ExtractConstant)
- Kein Copy-Paste (ExtractMethod / ExtractClass)
- Alle Zeiten in ISO 8601
- Alle IDs als UUID