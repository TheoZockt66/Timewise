# Dashboard

Das Dashboard ist eine lokale, manuelle Auswertung der Testhistorie fuer dieses Repository. Es liest nur JSON-Dateien aus dem Repo und fuehrt keine Datenbankanbindung oder CI/CD-Automatisierung ein.

Fuer neue Teammitglieder zeigt das Dashboard nicht nur rohe Testdaten, sondern auch:

- was wahrscheinlich schiefgelaufen ist
- welcher Meilenstein betroffen ist
- mit welcher Datei die Fehlersuche sinnvoll beginnen sollte
- ob der letzte Lauf gruen oder rot war
- welche Testart lokal als Naechstes sinnvoll gestartet werden kann

## Datenquellen

- `dashboard/data/latest.json`: letzter normalisierter Lauf
- `dashboard/data/history.jsonl`: Verlauf mehrerer Laeufe
- `dashboard/data/snapshots/`: abgelegte Einzel-Snapshots aus `dashboard:prepare`
- `dashboard/sample_data/sample-run.json`: Fallback-Datensatz, falls noch keine echten Reports vorliegen
- optional `reports/vitest-report.json`: JSON-Report aus Vitest
- optional `coverage/coverage-summary.json`: Coverage-Summary aus Vitest

## Internes Schema

Jeder Lauf verwendet dieselbe JSON-Struktur:

- `schema_version`
- `timestamp`
- `workflow`
- `run_id`
- `branch`
- `commit`
- `status`
- `summary.total`
- `summary.passed`
- `summary.failed`
- `summary.skipped`
- `summary.duration_seconds`
- `coverage.lines`
- `coverage.functions`
- `coverage.branches`
- `coverage.statements`
- `suites[]`
- `failures[]`

## Lokaler Start

1. Python-Abhaengigkeit installieren:
   `py -3.13 -m pip install -r dashboard/requirements.txt`
   Hinweis: Unter Windows wird dafuer eine 64-Bit-Python-Installation empfohlen. In einer 32-Bit-Python-Umgebung scheitert die Streamlit-Abhaengigkeit `pyarrow`.
2. Optional echte Testreports erzeugen:
   `npm run test:coverage`
   oder komplett mit Speicherung:
   `npm run test:all`
3. Dashboard-Daten normalisieren oder mit Sample-Daten auffuellen:
   `npm run dashboard:prepare`
4. Dashboard lokal starten:
   `npm run dashboard:run`

Wenn `npm run dashboard:run` in einer 32-Bit-Windows-Python-Umgebung ausgefuehrt wird, bricht der Wrapper mit einer klaren Diagnose ab und nennt die noetigen naechsten Schritte.

## Manueller Ablauf

- Ohne vorhandene Reports verwendet `dashboard:prepare` automatisch `dashboard/sample_data/sample-run.json`.
- Mit vorhandenem Vitest-Report und Coverage-Summary werden diese ins interne Schema ueberfuehrt, als `latest.json` gespeichert, an `history.jsonl` angehaengt und unter `dashboard/data/snapshots/` versioniert.
- Das Dashboard ist in mehrere Seiten aufgeteilt: Uebersicht, Aktiver Lauf, Historie und Teststeuerung.
- In der Sidebar kann das Dashboard optional automatisch neu laden, damit neue JSON-Daten ohne manuellen Browser-Refresh sichtbar werden.
- Statuskarten und Hinweise sind bewusst farblich auf gruen und rot ausgelegt, damit neue Leute den Zustand schneller lesen koennen.
- Die Teststeuerung im Dashboard kann lokal `lint`, `typecheck`, `test:run`, `test:unit`, `test:api`, `test:component`, `test:integration`, `test:coverage` und `dashboard:prepare` starten.
- Zusaetzlich gibt es jetzt `Alles testen`: Das startet `lint`, `typecheck`, `test:coverage` und danach automatisch `dashboard:prepare`.
- Beim Button `Alles testen` wird also nicht nur geprueft, sondern der Lauf wird auch in `dashboard/data/latest.json`, `dashboard/data/history.jsonl` und `dashboard/data/snapshots/` gespeichert.
- Zu jeder Testart zeigt die Teststeuerung zusaetzlich an, was dabei konkret geprueft wird.
- Die Seite `Aktiver Lauf` zeigt nur Fehler aus dem letzten Testlauf. Wenn der letzte Lauf erfolgreich war, werden dort keine alten Fehler eingeblendet.
- Die Seite `Historie` zeigt gespeicherte Laeufe, Trends, Meilensteine und die Detailansicht eines ausgewaehlten Laufs.
- Zu fehlgeschlagenen Tests wird die passende Testfunktion aus dem Repository angezeigt, inklusive Assertions und der Fehlermeldung aus dem Lauf.
- Zu auswaehlbaren Testdateien kann zusaetzlich die vollstaendige Datei eingeblendet werden.
- Die Handlungsempfehlungen ordnen Fehler heuristisch einem Meilenstein und einer empfohlenen Startdatei im Repo zu. Die Zuordnung basiert auf Testpfaden wie `tests/api/goals/...` oder `tests/component/events/...`.
