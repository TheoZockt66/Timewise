# Tests

Alle neuen Tests liegen zentral unter `tests/`. Fachlogik in `src/` bekommt ab jetzt keine neuen `.test.ts`- oder `.test.tsx`-Dateien mehr daneben.

## Test-IDs (TC_XX_YY_NN)

Viele Tests tragen eine ID aus dem Testplan (Anhang B des Projektberichts). Die IDs sind nach folgendem Schema aufgebaut:

```
TC _ AU _ E2E _ 01
│    │    │      └─ Laufende Nummer
│    │    └──────── Testart (SV / RT / INT / E2E oder leer für Unit/Validator)
│    └───────────── Modulkürzel
└────────────────── "Test Case"
```

### Modulkürzel

| Kürzel | Modul |
|--------|-------|
| `AU`   | M1 – Auth & Benutzerverwaltung |
| `KW`   | M2 – Keyword-System |
| `ER`   | M3 – Lernzeiterfassung (Events) |
| `KA`   | M4 – Kalenderansicht |
| `ST`   | M5 – Datenvisualisierung (Statistiken) |
| `GO`   | M6 – Zielsystem (Goals) |

### Testart-Suffixe

| Suffix | Bedeutung | Testdatei-Ordner |
|--------|-----------|-----------------|
| _(kein Suffix)_ | Unit-Test des Validators oder der Kernlogik | `tests/unit/validators/` |
| `SV`   | Service-Layer-Test (Supabase gemockt) | `tests/unit/services/` |
| `RT`   | Route-Handler-Test (HTTP-Request/Response) | `tests/api/` |
| `INT`  | Integrationstest (mehrere Schichten zusammen) | `tests/integration/` |
| `E2E`  | End-to-End-Test im echten Browser (Playwright) | `tests/playwright/` |

### Beispiele

| Test-ID | Bedeutung |
|---------|-----------|
| `TC_AU_01` | Validator-Test M1: Erfolgreiche Registrierung |
| `TC_KW_RT_02` | Route-Handler-Test M2: POST /api/keywords → 201 Created |
| `TC_ER_SV_01` | Service-Test M3: Event anlegen mit Keyword-Anreicherung |
| `TC_GO_E2E_01` | Playwright-Test M6: Ziel-CRUD im Browser |
| `TC_KA_07` | Playwright-Test M4: Vollständiger Kalender-Ablauf |

Die vollständigen Tabellen mit allen IDs, Äquivalenzklassen und Grenzwerten stehen in **Anhang B (Testplan)** des Projektberichts.

## Struktur

- `tests/unit/validators`: reine Validierungslogik
- `tests/unit/services`: Service-Logik mit gemocktem Supabase
- `tests/unit/utils`: kleine Hilfslogik
- `tests/unit/hooks`: exportierte Hook-Helfer
- `tests/api`: Route-Handler-Tests für Request, Auth und Response-Wrapper
- `tests/component`: React-Komponenten mit Interaktion
- `tests/integration`: kleine Flows über mehrere Schichten
- `tests/e2e`: reserviert für spätere Smoke- oder Browser-Tests
- `tests/fixtures`: feste Beispiel-Daten für reproduzierbare Testfälle
- `tests/factories`: Testdaten-Erzeuger
- `tests/mocks`: gemeinsame Mocks
- `tests/setup`: gemeinsames Vitest-Setup

## Lokale Befehle

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:all`
- `npm run test:unit`
- `npm run test:api`
- `npm run test:component`
- `npm run test:integration`
- `npm run test:coverage`

## Regeln für neue Tests

- Validator-, Helper- und Berechnungslogik nach `tests/unit/`
- Route-Handler nach `tests/api/`
- UI-Interaktionen nach `tests/component/`
- Mehrschichtige Flows nach `tests/integration/`
- Gemeinsame Daten und Mock-Helfer in `tests/factories/` und `tests/mocks/`
- Feste Request- oder Beispielobjekte, die unverändert wiederverwendet werden sollen, nach `tests/fixtures/`
- `tests/e2e/` bleibt bewusst leichtgewichtig; dort liegt aktuell nur eine kleine Smoke-Vorlage ohne grosse Browser-Infrastruktur
- `npm run test:all` ist der lokale Komplettlauf für Lint, Typecheck, Coverage und Dashboard-Speicherung

## E2E-Status

Die `tests/e2e/`-Struktur ist vorbereitet, aber bewusst noch nicht mit schwerer Infrastruktur ausgebaut. Für dieses Repository steht zuerst die stabile lokale Unit-, Service-, API-, Component- und Integrationsbasis im Vordergrund.
