# Tests

Alle neuen Tests liegen zentral unter `tests/`. Fachlogik in `src/` bekommt ab jetzt keine neuen `.test.ts`- oder `.test.tsx`-Dateien mehr daneben.

## Struktur

- `tests/unit/validators`: reine Validierungslogik
- `tests/unit/services`: Service-Logik mit gemocktem Supabase
- `tests/unit/utils`: kleine Hilfslogik
- `tests/unit/hooks`: exportierte Hook-Helfer
- `tests/api`: Route-Handler-Tests fuer Request, Auth und Response-Wrapper
- `tests/component`: React-Komponenten mit Interaktion
- `tests/integration`: kleine Flows ueber mehrere Schichten
- `tests/e2e`: reserviert fuer spaetere Smoke- oder Browser-Tests
- `tests/fixtures`: feste Beispiel-Daten fuer reproduzierbare Testfaelle
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

## Regeln fuer neue Tests

- Validator-, Helper- und Berechnungslogik nach `tests/unit/`
- Route-Handler nach `tests/api/`
- UI-Interaktionen nach `tests/component/`
- Mehrschichtige Flows nach `tests/integration/`
- Gemeinsame Daten und Mock-Helfer in `tests/factories/` und `tests/mocks/`
- Feste Request- oder Beispielobjekte, die unveraendert wiederverwendet werden sollen, nach `tests/fixtures/`
- `tests/e2e/` bleibt bewusst leichtgewichtig; dort liegt aktuell nur eine kleine Smoke-Vorlage ohne grosse Browser-Infrastruktur
- `npm run test:all` ist der lokale Komplettlauf fuer Lint, Typecheck, Coverage und Dashboard-Speicherung

## E2E-Status

Die `tests/e2e/`-Struktur ist vorbereitet, aber bewusst noch nicht mit schwerer Infrastruktur ausgebaut. Fuer dieses Repository steht zuerst die stabile lokale Unit-, Service-, API-, Component- und Integrationsbasis im Vordergrund.
