from __future__ import annotations

from collections import Counter
from datetime import datetime
from html import escape
from pathlib import Path
import shutil
import subprocess
import sys

import streamlit as st
import streamlit.components.v1 as components

from schema import Failure, RunRecord
from storage import load_history, load_latest

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
LATEST_PATH = DATA_DIR / "latest.json"
HISTORY_PATH = DATA_DIR / "history.jsonl"
MILESTONE_ORDER = ["M1", "M2", "M3", "M4", "M5", "M6"]
MILESTONE_INFO = {
  "M1": {
    "label": "Auth und Benutzerverwaltung",
    "description": "Login, Registrierung, Logout, Session und Route-Protection",
  },
  "M2": {
    "label": "Keyword-System",
    "description": "Keywords, Farben, CRUD und Zuweisungen",
  },
  "M3": {
    "label": "Lernzeiterfassung",
    "description": "Events, Validierung, Überschneidungen und Event-Services",
  },
  "M4": {
    "label": "Kalenderansicht",
    "description": "Kalender-UI, Detailansicht und Kalender-Hooks",
  },
  "M5": {
    "label": "Datenvisualisierung",
    "description": "Statistiken, Aggregate, Filter und Diagramm-Logik",
  },
  "M6": {
    "label": "Zielsystem",
    "description": "Goals, Fortschritt, Goal-Services und Goal-UI",
  },
}
STATUS_LABELS = {
  "passed": "Erfolgreich",
  "failed": "Fehlgeschlagen",
  "warning": "Warnung",
  "unknown": "Unbekannt",
}
TEST_COMMANDS = [
  {
    "script": "test:all",
    "label": "Alles testen",
    "category": "Komplettlauf",
    "description": "Lint, Typecheck, Coverage-Lauf und Dashboard-Daten in einem Schritt starten.",
    "details": [
      "Prüft ESLint und TypeScript vor dem eigentlichen Testlauf.",
      "Führt danach alle Vitest-Tests mit Coverage aus und schreibt echte Reports.",
      "Aktualisiert zum Schluss latest.json, history.jsonl und Snapshots automatisch.",
    ],
    "timeout_seconds": 2400,
  },
  {
    "script": "lint",
    "label": "Lint",
    "category": "Statische Prüfungen",
    "description": "ESLint über das gesamte Repository laufen lassen.",
    "details": [
      "Prüft Stilregeln, problematische Patterns und ungenutzte Variablen.",
      "Findet Fehler früh, ohne Tests oder Build auszuführen.",
    ],
    "timeout_seconds": 600,
  },
  {
    "script": "typecheck",
    "label": "Typecheck",
    "category": "Statische Prüfungen",
    "description": "TypeScript-Typen ohne Build prüfen.",
    "details": [
      "Prüft Props, Rückgabewerte, Imports und gemeinsame Typen.",
      "Hilft bei API- und Komponentenfehlern, bevor Laufzeittests starten.",
    ],
    "timeout_seconds": 600,
  },
  {
    "script": "test:run",
    "label": "Vitest-Gesamtlauf",
    "category": "Tests",
    "description": "Einmaliger Gesamtlauf über alle Vitest-Testordner ohne JSON-Speicherung.",
    "details": [
      "Führt Unit-, API-, Component- und Integrationstests zusammen aus.",
      "Gut für eine schnelle Komplettprüfung, wenn latest.json und history.jsonl nicht neu geschrieben werden müssen.",
    ],
    "timeout_seconds": 900,
  },
  {
    "script": "test:unit",
    "label": "Unit-Tests",
    "category": "Tests",
    "description": "Validatoren, Services, Utils und Hooks isoliert ausführen.",
    "details": [
      "Prüft reine Logik ohne echte UI und ohne echte Datenbank.",
      "Fokussiert auf Validatoren, Hilfsfunktionen und kleine Fachlogik.",
    ],
    "timeout_seconds": 900,
  },
  {
    "script": "test:api",
    "label": "API-Tests",
    "category": "Tests",
    "description": "Route-Tests für Auth, Events, Goals und Keywords starten.",
    "details": [
      "Prüft Auth-Checks, Request-Parsing, Query-Parameter und Statuscodes.",
      "Kontrolliert den Response-Wrapper und die Übergabe an Services.",
    ],
    "timeout_seconds": 900,
  },
  {
    "script": "test:component",
    "label": "Component-Tests",
    "category": "Tests",
    "description": "Interaktionen wichtiger UI-Komponenten prüfen.",
    "details": [
      "Prüft Rendering, Nutzerinteraktionen, Fehlermeldungen und Submit-Verhalten.",
      "Hilft bei Formularen und UI-Bausteinen wie EventForm oder Stats-Komponenten.",
    ],
    "timeout_seconds": 900,
  },
  {
    "script": "test:integration",
    "label": "Integrationstests",
    "category": "Tests",
    "description": "Mehrschichtige Flows lokal ausführen.",
    "details": [
      "Prüft sinnvolle End-to-End-Flows über mehrere Schichten im Repo.",
      "Zeigt, ob Route, Service und Validierung zusammen konsistent arbeiten.",
    ],
    "timeout_seconds": 900,
  },
  {
    "script": "test:coverage",
    "label": "Coverage-Lauf",
    "category": "Tests",
    "description": "Tests mit Coverage-Report und Vitest-JSON-Report starten.",
    "details": [
      "Führt Tests aus und schreibt Coverage- sowie Vitest-Reports für das Dashboard.",
      "Wichtig, wenn `latest.json` und `history.jsonl` mit echten Daten aktualisiert werden sollen.",
    ],
    "timeout_seconds": 1200,
  },
  {
    "script": "dashboard:prepare",
    "label": "Dashboard-Daten",
    "category": "Dashboard-Daten",
    "description": "latest.json, history.jsonl und Snapshots aus Reports aktualisieren.",
    "details": [
      "Liest Vitest- und Coverage-Reports oder Sample-Daten ein.",
      "Schreibt den letzten Lauf, die Historie und Snapshots für das Dashboard neu.",
    ],
    "timeout_seconds": 600,
  },
]


def format_duration(seconds: float) -> str:
  return f"{seconds:.2f}s"


def format_coverage(value: float) -> str:
  return f"{value:.1f}%"


def format_status_label(status: str) -> str:
  return STATUS_LABELS.get(status, STATUS_LABELS["unknown"])


def tone_for_status(status: str) -> str:
  if status in {"passed", "failed", "warning"}:
    return status
  return "neutral"


def normalize_repo_path(value: str) -> str:
  if not value:
    return "unbekannt"

  normalized = value.replace("\\", "/")
  repo_root = REPO_ROOT.as_posix()

  if normalized.lower().startswith(repo_root.lower() + "/"):
    return normalized[len(repo_root) + 1 :]

  return normalized


def unique_preserve_order(values: list[str]) -> list[str]:
  seen: set[str] = set()
  result: list[str] = []

  for value in values:
    if not value or value in seen:
      continue
    seen.add(value)
    result.append(value)

  return result


def milestone_label(code: str) -> str:
  info = MILESTONE_INFO.get(code)
  if not info:
    return code
  return f"{code} – {info['label']}"


def infer_milestones_from_path(path: str) -> list[str]:
  normalized = normalize_repo_path(path).lower()
  milestones: list[str] = []

  if "/auth/" in normalized or normalized.endswith("auth.service.ts") or "proxy.ts" in normalized:
    milestones.append("M1")

  if "/goals/" in normalized or "goal.service" in normalized or "goal.validator" in normalized or "usegoals" in normalized:
    milestones.append("M6")

  if "/stats/" in normalized or "/events/aggregate/" in normalized or "usestats" in normalized:
    milestones.append("M5")

  if "/calendar/" in normalized or "usecalendar" in normalized:
    milestones.append("M4")

  if "/events/" in normalized or "event.service" in normalized or "event.validator" in normalized:
    milestones.append("M3")

  if "/keywords/" in normalized or "keyword.service" in normalized or "keyword.validator" in normalized:
    milestones.append("M2")

  return [code for code in MILESTONE_ORDER if code in milestones]


def infer_source_files(path: str) -> list[str]:
  normalized = normalize_repo_path(path)

  if normalized.startswith("src/"):
    return [normalized]

  if normalized.startswith("tests/api/"):
    remainder = normalized[len("tests/api/") :]
    parts = remainder.split("/")
    directory = parts[:-1]
    filename = parts[-1]

    if filename == "route.test.ts":
      route_path = "/".join(directory)
    elif filename.endswith(".route.test.ts"):
      route_name = filename[: -len(".route.test.ts")]
      route_path = "/".join([*directory, route_name])
    else:
      route_path = "/".join([*directory, filename[: -len(".test.ts")]])

    files = [f"src/app/api/{route_path}/route.ts"]

    if route_path.startswith("auth/"):
      files.append("src/lib/services/auth.service.ts")
    elif route_path.startswith("events"):
      files.extend(
        [
          "src/lib/services/event.service.ts",
          "src/lib/validators/event.validator.ts",
        ]
      )
    elif route_path.startswith("goals"):
      files.extend(
        [
          "src/lib/services/goal.service.ts",
          "src/lib/validators/goal.validator.ts",
        ]
      )
    elif route_path.startswith("keywords"):
      files.extend(
        [
          "src/lib/services/keyword.service.ts",
          "src/lib/validators/keyword.validator.ts",
        ]
      )

    return unique_preserve_order(files)

  if normalized.startswith("tests/component/"):
    remainder = normalized[len("tests/component/") :]
    parts = remainder.split("/")
    category = "/".join(parts[:-1])
    component_name = parts[-1][: -len(".test.tsx")]
    files = [f"src/components/{category}/{component_name}.tsx"]

    if category == "events" and component_name == "EventForm":
      files.extend(
        [
          "src/components/events/TimeRangePicker.tsx",
          "src/components/events/KeywordSelector.tsx",
        ]
      )

    return unique_preserve_order(files)

  if normalized.startswith("tests/unit/services/") and normalized.endswith(".service.test.ts"):
    service_name = Path(normalized).name[: -len(".test.ts")]
    files = [f"src/lib/services/{service_name}"]

    if service_name == "event.service.ts":
      files.append("src/lib/validators/event.validator.ts")
    elif service_name == "goal.service.ts":
      files.append("src/lib/validators/goal.validator.ts")
    elif service_name == "keyword.service.ts":
      files.append("src/lib/validators/keyword.validator.ts")

    return unique_preserve_order(files)

  if normalized.startswith("tests/unit/validators/") and normalized.endswith(".validator.test.ts"):
    validator_name = Path(normalized).name[: -len(".test.ts")]
    return [f"src/lib/validators/{validator_name}"]

  if normalized == "tests/unit/utils/utils.test.ts":
    return ["src/lib/utils.ts"]

  if normalized.startswith("tests/unit/hooks/"):
    if "useGoals" in normalized:
      return ["src/hooks/useGoals.ts"]
    if "useStats" in normalized:
      return ["src/hooks/useStats.ts"]
    if "useCalendar" in normalized:
      return ["src/hooks/useCalendar.ts"]

  if normalized.startswith("tests/integration/goals/"):
    return [
      "src/app/api/goals/route.ts",
      "src/lib/services/goal.service.ts",
      "src/lib/validators/goal.validator.ts",
    ]

  if normalized.startswith("tests/integration/events/"):
    return [
      "src/app/api/events/route.ts",
      "src/lib/services/event.service.ts",
      "src/lib/validators/event.validator.ts",
    ]

  return [normalized]


def explain_failure(message: str, test_file: str, source_files: list[str]) -> str:
  lower_message = message.lower()
  normalized_test_file = normalize_repo_path(test_file).lower()
  joined_sources = " ".join(source_files).lower()

  if "expected 400 but received 500" in lower_message:
    return "HTTP-Status oder Request-Parsing passt nicht zur API-Erwartung. Prüfe den Route-Handler und das Fehler-Mapping zuerst."
  if "toast" in lower_message or "validation" in lower_message:
    return "UI-Feedback oder Validierungslogik verhält sich anders als erwartet. Prüfe zuerst die betroffene Komponente und ihre Fehleranzeige."
  if "progress" in lower_message or "got 0" in lower_message:
    return "Die Fachlogik für Berechnung oder Aggregation liefert ein falsches Ergebnis. Service und Validator sind hier die erste Spur."
  if "filter" in lower_message or "filtered" in lower_message:
    return "Filter- oder Auswahlzustand wird nicht korrekt verarbeitet. Prüfe die Komponente und ihre State-Updates."
  if "/api/" in normalized_test_file or "route.ts" in joined_sources:
    return "Der Fehler liegt wahrscheinlich in der API-Schicht oder in der Übergabe an den Service."
  if "/component/" in normalized_test_file:
    return "Der Fehler liegt wahrscheinlich in der UI-Interaktion oder im gerenderten Zustand der Komponente."
  if "/services/" in normalized_test_file:
    return "Der Fehler liegt wahrscheinlich in der Business-Logik des Services."
  if "/validators/" in normalized_test_file:
    return "Der Fehler liegt wahrscheinlich in einer Validierungsregel oder Fehlermeldung."
  return "Test und Implementierung laufen auseinander. Beginne mit der zuerst vorgeschlagenen Datei."


def build_failure_action(record: RunRecord, failure: Failure) -> dict[str, object]:
  test_file = normalize_repo_path(failure.file)
  source_files = infer_source_files(test_file)

  milestone_candidates: list[str] = []
  for path in [test_file, *source_files]:
    milestone_candidates.extend(infer_milestones_from_path(path))

  milestones = [code for code in MILESTONE_ORDER if code in milestone_candidates]
  primary_file = source_files[0] if source_files else "unbekannt"

  return {
    "timestamp": record.timestamp,
    "branch": record.branch,
    "test_name": failure.name or "Unbenannter Fehler",
    "test_file": test_file,
    "message": failure.message or "Keine Fehlermeldung vorhanden.",
    "details": failure.details or "",
    "milestones": milestones,
    "primary_file": primary_file,
    "source_files": source_files,
    "explanation": explain_failure(failure.message, test_file, source_files),
  }


def build_history_rows(records: list[RunRecord]) -> list[dict[str, object]]:
  return [
    {
      "Zeitstempel": record.timestamp,
      "Status": format_status_label(record.status),
      "Branch": record.branch,
      "Commit": record.commit,
      "Workflow": record.workflow,
      "Tests": record.summary.total,
      "Fehler": record.summary.failed,
      "Dauer": format_duration(record.summary.duration_seconds),
      "Coverage": format_coverage(record.coverage.lines),
      "Run ID": record.run_id,
    }
    for record in sorted(records, key=lambda item: item.timestamp, reverse=True)
  ]


def find_focus_failure_record(latest: RunRecord | None, records: list[RunRecord]) -> RunRecord | None:
  if latest and latest.failures:
    return latest

  sorted_records = sorted(records, key=lambda item: item.timestamp, reverse=True)
  for record in sorted_records:
    if record.failures:
      return record

  return None


def build_milestone_summary(records: list[RunRecord]) -> list[dict[str, object]]:
  grouped: dict[str, dict[str, object]] = {}

  for record in records:
    for failure in record.failures:
      action = build_failure_action(record, failure)
      for milestone in action["milestones"]:
        current = grouped.setdefault(
          milestone,
          {
            "Meilenstein": milestone_label(milestone),
            "Vorfälle": 0,
            "Zuletzt gesehen": record.timestamp,
            "Beschreibung": MILESTONE_INFO[milestone]["description"],
            "Erste Datei": action["primary_file"],
          },
        )
        current["Vorfälle"] = int(current["Vorfälle"]) + 1
        current["Zuletzt gesehen"] = max(str(current["Zuletzt gesehen"]), record.timestamp)

  summary_rows = [grouped[code] for code in MILESTONE_ORDER if code in grouped]
  summary_rows.sort(key=lambda row: int(row["Vorfälle"]), reverse=True)
  return summary_rows


def get_npm_executable() -> str | None:
  if sys.platform == "win32":
    return shutil.which("npm.cmd") or shutil.which("npm")
  return shutil.which("npm")


def run_local_script(script: str, timeout_seconds: int) -> dict[str, object]:
  started_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  npm_executable = get_npm_executable()

  if npm_executable is None:
    return {
      "script": script,
      "command": f"npm run {script}",
      "started_at": started_at,
      "success": False,
      "exit_code": None,
      "output": "npm wurde in dieser Umgebung nicht gefunden. Prüfe deine lokale Node.js-Installation.",
    }

  try:
    completed = subprocess.run(
      [npm_executable, "run", script],
      cwd=REPO_ROOT,
      capture_output=True,
      text=True,
      encoding="utf-8",
      errors="replace",
      timeout=timeout_seconds,
      check=False,
    )
  except subprocess.TimeoutExpired as error:
    timeout_output = "\n".join(part for part in [error.stdout or "", error.stderr or ""] if part).strip()
    return {
      "script": script,
      "command": f"npm run {script}",
      "started_at": started_at,
      "success": False,
      "exit_code": None,
      "output": timeout_output or "Der Prozess hat das Zeitlimit überschritten und wurde abgebrochen.",
    }

  combined_output = "\n".join(part for part in [completed.stdout, completed.stderr] if part).strip()
  return {
    "script": script,
    "command": f"npm run {script}",
    "started_at": started_at,
    "success": completed.returncode == 0,
    "exit_code": completed.returncode,
    "output": combined_output or "Kein Konsolen-Output vorhanden.",
  }


def enable_auto_refresh(interval_seconds: int) -> None:
  interval_ms = max(interval_seconds, 5) * 1000
  components.html(
    f"""
    <script>
      const timerKey = "__timewise_dashboard_auto_refresh__";
      const intervalMs = {interval_ms};

      if (window.parent) {{
        if (window.parent[timerKey]) {{
          clearTimeout(window.parent[timerKey]);
        }}

        window.parent[timerKey] = setTimeout(() => {{
          window.parent.location.reload();
        }}, intervalMs);
      }}
    </script>
    """,
    height=0,
    width=0,
  )


def inject_styles() -> None:
  st.markdown(
    """
    <style>
      div.block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
      }

      .tw-status-card {
        border-radius: 18px;
        border: 1px solid #dbe4ee;
        padding: 1rem 1rem 0.95rem;
        margin-bottom: 0.5rem;
      }

      .tw-status-card--neutral {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .tw-status-card--passed {
        background: #ecfdf5;
        border-color: #22c55e;
      }

      .tw-status-card--failed {
        background: #fef2f2;
        border-color: #ef4444;
      }

      .tw-status-card--warning {
        background: #fffbeb;
        border-color: #f59e0b;
      }

      .tw-status-card__label {
        color: #475569;
        font-size: 0.82rem;
        margin-bottom: 0.35rem;
      }

      .tw-status-card__value {
        color: #0f172a;
        font-size: 1.35rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .tw-status-card__meta {
        color: #475569;
        font-size: 0.9rem;
        margin-top: 0.45rem;
      }

      .tw-notice {
        border-radius: 18px;
        border: 1px solid;
        padding: 0.95rem 1rem;
        margin: 0.85rem 0;
      }

      .tw-notice strong {
        display: block;
        margin-bottom: 0.2rem;
      }

      .tw-notice--neutral {
        background: #eff6ff;
        border-color: #60a5fa;
        color: #1d4ed8;
      }

      .tw-notice--passed {
        background: #ecfdf5;
        border-color: #22c55e;
        color: #166534;
      }

      .tw-notice--failed {
        background: #fef2f2;
        border-color: #ef4444;
        color: #991b1b;
      }

      .tw-notice--warning {
        background: #fffbeb;
        border-color: #f59e0b;
        color: #92400e;
      }

      .tw-badge {
        display: inline-block;
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.78rem;
        font-weight: 700;
        margin-bottom: 0.35rem;
      }

      .tw-badge--neutral {
        background: #e2e8f0;
        color: #334155;
      }

      .tw-badge--passed {
        background: #dcfce7;
        color: #166534;
      }

      .tw-badge--failed {
        background: #fee2e2;
        color: #991b1b;
      }

      .tw-badge--warning {
        background: #fef3c7;
        color: #92400e;
      }

      .tw-command-card {
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 1rem;
        background: #ffffff;
        min-height: 215px;
        margin-bottom: 0.75rem;
      }

      .tw-command-title {
        color: #111827;
        font-size: 1.02rem;
        font-weight: 700;
        margin-bottom: 0.35rem;
      }

      .tw-command-description {
        color: #374151;
        min-height: 3.5rem;
        margin-bottom: 0.65rem;
      }

      .tw-command-code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 0.84rem;
        background: #f8fafc;
        color: #334155;
        border-radius: 12px;
        padding: 0.45rem 0.6rem;
      }
    </style>
    """,
    unsafe_allow_html=True,
  )


def render_status_card(column, title: str, value: str, tone: str, meta: str = "") -> None:
  column.markdown(
    f"""
    <div class="tw-status-card tw-status-card--{tone}">
      <div class="tw-status-card__label">{escape(title)}</div>
      <div class="tw-status-card__value">{escape(value)}</div>
      <div class="tw-status-card__meta">{escape(meta)}</div>
    </div>
    """,
    unsafe_allow_html=True,
  )


def render_notice(tone: str, title: str, text: str) -> None:
  st.markdown(
    f"""
    <div class="tw-notice tw-notice--{tone}">
      <strong>{escape(title)}</strong>
      <div>{escape(text)}</div>
    </div>
    """,
    unsafe_allow_html=True,
  )


def render_badge(label: str, tone: str) -> str:
  return f'<span class="tw-badge tw-badge--{tone}">{escape(label)}</span>'


def render_command_card(spec: dict[str, object], result: dict[str, object] | None) -> None:
  if result is None:
    badge_html = render_badge("Noch nicht ausgeführt", "neutral")
    status_note = "Kein lokaler Lauf gespeichert."
  else:
    tone = "passed" if result["success"] else "failed"
    label = "Zuletzt erfolgreich" if result["success"] else "Zuletzt fehlgeschlagen"
    badge_html = render_badge(label, tone)
    status_note = f"Letzter Lauf: {result['started_at']}"

  detail_items = "".join(
    f"<li>{escape(str(item))}</li>" for item in spec.get("details", [])
  )

  st.markdown(
    f"""
    <div class="tw-command-card">
      {badge_html}
      <div class="tw-command-title">{escape(str(spec['label']))}</div>
      <div class="tw-command-description">{escape(str(spec['description']))}</div>
      <ul class="tw-status-card__meta" style="margin: 0 0 0.7rem 1rem; padding-left: 0.2rem;">{detail_items}</ul>
      <div class="tw-command-code">npm run {escape(str(spec['script']))}</div>
      <div class="tw-status-card__meta" style="margin-top: 0.75rem;">{escape(status_note)}</div>
    </div>
    """,
    unsafe_allow_html=True,
  )


def code_language_for_path(path: str) -> str:
  suffix = Path(path).suffix.lower()
  if suffix == ".tsx":
    return "tsx"
  if suffix == ".ts":
    return "ts"
  if suffix == ".py":
    return "python"
  return "text"


def load_repo_text(path: str) -> tuple[str | None, str | None]:
  normalized = normalize_repo_path(path)
  candidate = (REPO_ROOT / normalized).resolve()

  try:
    candidate.relative_to(REPO_ROOT.resolve())
  except ValueError:
    return None, f"Datei liegt außerhalb des Repositories: {normalized}"

  if not candidate.exists() or not candidate.is_file():
    return None, f"Testdatei konnte nicht gefunden werden: {normalized}"

  try:
    return candidate.read_text(encoding="utf-8"), None
  except OSError as error:
    return None, f"Testdatei konnte nicht gelesen werden: {error}"


def build_test_name_candidates(test_name: str) -> list[str]:
  parts = [part.strip() for part in test_name.split(">") if part.strip()]
  candidates: list[str] = []

  for part in reversed(parts):
    if part not in candidates:
      candidates.append(part)

  stripped = test_name.strip()
  if stripped and stripped not in candidates:
    candidates.append(stripped)

  return candidates


def tokenize_text(value: str) -> list[str]:
  normalized = value.lower()
  for character in ["(", ")", "{", "}", "[", "]", ",", ".", ";", ":", '"', "'", "`", "=", ">", "<", "/", "\\"]:
    normalized = normalized.replace(character, " ")
  return [token for token in normalized.split() if token]


def is_test_definition_line(line: str) -> bool:
  stripped = line.strip()
  return stripped.startswith(("test(", "it(", "test.each(", "it.each("))


def find_test_definition_index(lines: list[str], test_name: str) -> int | None:
  candidates = build_test_name_candidates(test_name)

  for candidate in candidates:
    lowered_candidate = candidate.lower()
    for index, line in enumerate(lines):
      if lowered_candidate in line.lower() and is_test_definition_line(line):
        return index

  best_index: int | None = None
  best_score = 0
  candidate_tokens = [set(tokenize_text(candidate)) for candidate in candidates if candidate.strip()]

  for index, line in enumerate(lines):
    if not is_test_definition_line(line):
      continue

    line_tokens = set(tokenize_text(line))
    for tokens in candidate_tokens:
      score = len(tokens & line_tokens)
      if score > best_score:
        best_score = score
        best_index = index

  return best_index if best_score >= 2 else None


def extract_test_block(source: str, test_name: str) -> tuple[str, str, list[str]] | None:
  lines = source.splitlines()
  start_index = find_test_definition_index(lines, test_name)
  if start_index is None:
    return None

  paren_depth = 0
  brace_depth = 0
  saw_open_brace = False

  for end_index in range(start_index, len(lines)):
    for character in lines[end_index]:
      if character == "(":
        paren_depth += 1
      elif character == ")":
        paren_depth -= 1
      elif character == "{":
        brace_depth += 1
        saw_open_brace = True
      elif character == "}":
        brace_depth -= 1

    if saw_open_brace and brace_depth <= 0 and paren_depth <= 0 and end_index > start_index:
      snippet = "\n".join(lines[start_index : end_index + 1])
      return snippet, f"Zeilen {start_index + 1} bis {end_index + 1}", lines[start_index : end_index + 1]

  fallback_end = min(len(lines), start_index + 30)
  snippet = "\n".join(lines[start_index:fallback_end])
  return snippet, f"Zeilen {start_index + 1} bis {fallback_end}", lines[start_index:fallback_end]


def collect_statement(lines: list[str], start_index: int) -> tuple[str, int]:
  collected: list[str] = []
  paren_depth = 0
  for index in range(start_index, len(lines)):
    stripped = lines[index].strip()
    if not stripped and collected:
      break

    if stripped:
      collected.append(stripped)
      for character in stripped:
        if character == "(":
          paren_depth += 1
        elif character == ")":
          paren_depth -= 1

      if paren_depth <= 0 and stripped.endswith(";"):
        return " ".join(collected), index

  return " ".join(collected), len(lines) - 1


def extract_assertion_summaries(block_lines: list[str]) -> list[str]:
  summaries: list[str] = []
  index = 0
  while index < len(block_lines):
    if "expect(" not in block_lines[index]:
      index += 1
      continue

    statement, last_index = collect_statement(block_lines, index)
    if statement and statement not in summaries:
      summaries.append(statement)
    index = last_index + 1

  return summaries


def render_test_source(
  test_file: str,
  test_name: str,
  key_suffix: str,
  failure_message: str | None = None,
  failure_details: str | None = None,
  expanded: bool = False,
) -> None:
  source, error = load_repo_text(test_file)

  if error:
    render_notice("warning", "Test-Quellcode nicht verfügbar", error)
    return

  normalized = normalize_repo_path(test_file)
  language = code_language_for_path(normalized)
  block = extract_test_block(source or "", test_name)

  st.markdown("**Test-Quellcode**")
  st.caption(f"`{normalized}`")

  if failure_message:
    st.markdown("**Was beim Lauf passiert ist**")
    st.code(failure_message, language="text")
    if failure_details:
      with st.expander("Zusätzliche Laufdetails"):
        st.code(failure_details, language="text")

  if block is not None:
    block_content, line_info, block_lines = block
    assertion_summaries = extract_assertion_summaries(block_lines)
    if assertion_summaries:
      st.markdown("**Was der Test geprüft hat**")
      for summary in assertion_summaries:
        st.markdown(f"- `{summary}`")

    st.markdown("**Betroffene Testfunktion**")
    st.caption(line_info)
    st.code(block_content, language=language)
  else:
    render_notice(
      "neutral",
      "Keine passende Testfunktion gefunden",
      "Die vollständige Testdatei ist unten einsehbar.",
    )

  with st.expander("Vollständige Testdatei", expanded=expanded or block is None):
    st.code(source or "", language=language)


def build_run_option(record: RunRecord) -> str:
  return (
    f"{record.timestamp} | {format_status_label(record.status)} | "
    f"{record.branch} | {record.commit}"
  )


def render_run_snapshot(record: RunRecord, heading: str) -> None:
  st.markdown(f"#### {heading}")
  columns = st.columns(4)
  render_status_card(columns[0], "Status", format_status_label(record.status), tone_for_status(record.status))
  render_status_card(columns[1], "Tests", str(record.summary.total), "neutral", f"{record.summary.passed} erfolgreich")
  render_status_card(
    columns[2],
    "Fehler",
    str(record.summary.failed),
    "failed" if record.summary.failed else "passed",
    f"{record.summary.skipped} übersprungen",
  )
  render_status_card(columns[3], "Coverage", format_coverage(record.coverage.lines), "neutral", record.commit)

  info_columns = st.columns(3)
  render_status_card(info_columns[0], "Branch", record.branch, "neutral")
  render_status_card(info_columns[1], "Workflow", record.workflow, "neutral")
  render_status_card(
    info_columns[2],
    "Dauer",
    format_duration(record.summary.duration_seconds),
    "neutral",
  )


def render_suites_table(record: RunRecord) -> None:
  if not record.suites:
    render_notice("warning", "Keine Suite-Daten vorhanden", "Für diesen Lauf wurden keine Suiten gespeichert.")
    return

  suite_rows = [
    {
      "Suite": suite.name,
      "Datei": normalize_repo_path(suite.file),
      "Status": format_status_label(suite.status),
      "Tests": suite.total,
      "Fehler": suite.failed,
      "Dauer": format_duration(suite.duration_seconds),
    }
    for suite in record.suites
  ]
  st.dataframe(suite_rows, width="stretch", hide_index=True)


def render_suite_source_browser(record: RunRecord, key_prefix: str) -> None:
  selectable_suites = [
    suite
    for suite in record.suites
    if normalize_repo_path(suite.file).endswith((".ts", ".tsx", ".js", ".jsx"))
  ]

  if not selectable_suites:
    render_notice(
      "neutral",
      "Keine Testdatei auswählbar",
      "Für diesen Lauf wurden nur gruppierte Suite-Pfade ohne einzelne Testdateien gespeichert.",
    )
    return

  option_map = {
    f"{suite.name} | {normalize_repo_path(suite.file)}": suite
    for suite in selectable_suites
  }
  selected_label = st.selectbox(
    "Testdatei auswählen",
    list(option_map.keys()),
    key=f"{key_prefix}-suite-select",
  )
  selected_suite = option_map[selected_label]
  render_test_source(
    selected_suite.file,
    selected_suite.name,
    key_suffix=f"{key_prefix}-suite-source",
  )


def render_failure_card(action: dict[str, object], key_prefix: str) -> None:
  milestone_text = ", ".join(milestone_label(code) for code in action["milestones"]) or "keine klare Zuordnung"

  with st.container(border=True):
    st.markdown(f"#### {action['test_name']}")
    st.write(action["explanation"])

    info_columns = st.columns(3)
    info_columns[0].markdown(f"**Betroffener Meilenstein**\n\n{milestone_text}")
    info_columns[1].markdown(f"**Zuerst ansehen**\n\n`{action['primary_file']}`")
    info_columns[2].markdown(f"**Testdatei**\n\n`{action['test_file']}`")

    st.markdown("**Fehlermeldung**")
    st.code(str(action["message"]), language="text")

    additional_files = action["source_files"][1:]
    if additional_files:
      st.markdown("**Danach prüfen**")
      for path in additional_files:
        st.markdown(f"- `{path}`")

    render_test_source(
      str(action["test_file"]),
      str(action["test_name"]),
      key_suffix=f"{key_prefix}-{action['test_file']}",
      failure_message=str(action["message"]),
      failure_details=str(action["details"]),
    )

    if action["details"]:
      with st.expander("Weitere Details"):
        st.code(str(action["details"]), language="text")


def render_overview(latest: RunRecord, records: list[RunRecord]) -> None:
  st.subheader("Übersicht")
  metric_columns = st.columns(4)
  render_status_card(
    metric_columns[0],
    "Status",
    format_status_label(latest.status),
    tone_for_status(latest.status),
    "letzter Testlauf",
  )
  render_status_card(
    metric_columns[1],
    "Tests",
    str(latest.summary.total),
    "neutral",
    f"{latest.summary.passed} erfolgreich",
  )
  render_status_card(
    metric_columns[2],
    "Fehler",
    str(latest.summary.failed),
    "failed" if latest.summary.failed else "passed",
    f"{latest.summary.skipped} übersprungen",
  )
  render_status_card(
    metric_columns[3],
    "Coverage",
    format_coverage(latest.coverage.lines),
    "passed" if latest.coverage.lines > 0 else "neutral",
    "Zeilenabdeckung",
  )

  info_columns = st.columns(4)
  render_status_card(info_columns[0], "Branch", latest.branch, "neutral")
  render_status_card(info_columns[1], "Commit", latest.commit, "neutral")
  render_status_card(info_columns[2], "Zeitstempel", latest.timestamp, "neutral")
  render_status_card(
    info_columns[3],
    "Dauer",
    format_duration(latest.summary.duration_seconds),
    "neutral",
  )

  if latest.failures:
    render_notice(
      "failed",
      "Aktiver Fehlerlauf",
      "Im letzten Lauf sind Fehler vorhanden. Die Handlungsempfehlungen darunter zeigen die wahrscheinlich betroffenen Dateien und Meilensteine.",
    )
  else:
    render_notice(
      "passed",
      "Keine bekannten Fehler",
      "Im letzten Lauf sind keine aktiven Fehler aufgetreten. Frühere Fehler findest du nur noch auf der Seite „Historie“.",
    )


def render_test_controls() -> None:
  st.subheader("Teststeuerung")
  render_notice(
    "neutral",
    "Alles lokal und manuell",
    "Hier kannst du Lint, Typecheck und die verschiedenen Testarten direkt aus dem Dashboard starten. Es wird nichts an eine CI übergeben, aber der Komplettlauf kann die Dashboard-Daten jetzt automatisch mitschreiben.",
  )

  stored_results = st.session_state.setdefault("dashboard_test_results", {})
  grouped_commands: dict[str, list[dict[str, object]]] = {}
  for spec in TEST_COMMANDS:
    grouped_commands.setdefault(str(spec["category"]), []).append(spec)

  category_order = ["Komplettlauf", "Statische Prüfungen", "Tests", "Dashboard-Daten"]

  for category in category_order:
    commands = grouped_commands.get(category, [])
    if not commands:
      continue

    st.markdown(f"#### {category}")
    columns = st.columns(min(3, len(commands)))

    for index, spec in enumerate(commands):
      column = columns[index % len(columns)]
      result = stored_results.get(spec["script"])

      with column:
        render_command_card(spec, result)
        if st.button(
          f"{spec['label']} starten",
          key=f"run-{spec['script']}",
          width="stretch",
        ):
          with st.spinner(f"`npm run {spec['script']}` wird ausgeführt ..."):
            command_result = run_local_script(
              str(spec["script"]),
              int(spec["timeout_seconds"]),
            )

          stored_results[str(spec["script"])] = command_result
          st.session_state["dashboard_test_results"] = stored_results
          st.session_state["dashboard_last_command"] = command_result
          st.rerun()

  last_result = st.session_state.get("dashboard_last_command")
  if not last_result:
    return

  last_tone = "passed" if last_result["success"] else "failed"
  exit_code = "kein Exit-Code" if last_result["exit_code"] is None else f"Exit-Code {last_result['exit_code']}"
  render_notice(
    last_tone,
    f"Zuletzt ausgeführt: {last_result['command']}",
    f"Gestartet am {last_result['started_at']} – {exit_code}.",
  )

  if last_result["script"] == "test:all" and last_result["success"]:
    render_notice(
      "passed",
      "Komplettlauf gespeichert",
      "Dieser Lauf hat Lint, Typecheck, alle Vitest-Tests mit Coverage und danach automatisch dashboard:prepare ausgeführt. latest.json, history.jsonl und Snapshots sind damit aktualisiert.",
    )
  elif last_result["script"] == "test:coverage" and last_result["success"]:
    render_notice(
      "neutral",
      "Nächster Schritt",
      "Nach einem erfolgreichen Coverage-Lauf solltest du zusätzlich „Dashboard-Daten“ ausführen, damit latest.json und history.jsonl aktualisiert werden.",
    )
  elif last_result["script"] == "dashboard:prepare" and last_result["success"]:
    render_notice(
      "passed",
      "Dashboard-Daten aktualisiert",
      "Die Übersicht, Historie und Fehleranalyse nutzen jetzt die frisch geschriebenen JSON-Dateien.",
    )

  with st.expander("Konsolen-Ausgabe des letzten Laufs", expanded=not bool(last_result["success"])):
    st.code(str(last_result["output"]), language="text")


def render_action_center(latest: RunRecord | None, records: list[RunRecord]) -> None:
  st.subheader("Handlungsempfehlungen")
  if latest is None:
    render_notice(
      "warning",
      "Kein Testlauf geladen",
      "Es ist noch kein letzter Lauf vorhanden. Nutze zuerst die Teststeuerung oder `dashboard:prepare`.",
    )
    return

  render_run_snapshot(latest, "Letzter Lauf")

  if not latest.failures:
    render_notice(
      "passed",
      "Keine aktiven Fehler im letzten Lauf",
      "Der letzte Testlauf ist grün. Frühere Fehler werden hier bewusst nicht mehr angezeigt. Sie sind nur auf der Seite „Historie“ sichtbar.",
    )
    st.markdown("#### Test-Explorer für den letzten Lauf")
    render_suites_table(latest)
    render_suite_source_browser(latest, "latest-run")
    return

  actions = [build_failure_action(latest, failure) for failure in latest.failures]

  render_notice(
    "failed",
    "Aktiver Fehlerlauf erkannt",
    "Beginne mit den folgenden Punkten. Sie leiten aus dem fehlgeschlagenen Lauf die wahrscheinlich betroffenen Stellen im Repository ab.",
  )

  summary_columns = st.columns(3)
  render_status_card(
    summary_columns[0],
    "Fehler im Fokuslauf",
    str(len(actions)),
    "failed" if actions else "passed",
  )
  render_status_card(
    summary_columns[1],
    "Betroffene Meilensteine",
    str(len({milestone for action in actions for milestone in action["milestones"]})),
    "neutral",
  )
  render_status_card(
    summary_columns[2],
    "Empfohlene Startdateien",
    str(len({action["primary_file"] for action in actions})),
    "neutral",
  )

  for index, action in enumerate(actions, start=1):
    render_failure_card(action, key_prefix=f"active-failure-{index}")


def render_recent_runs(records: list[RunRecord]) -> None:
  st.markdown("#### Letzte Läufe")
  recent_rows = build_history_rows(sorted(records, key=lambda item: item.timestamp, reverse=True)[:5])
  if recent_rows:
    st.dataframe(recent_rows, width="stretch", hide_index=True)
  else:
    render_notice("warning", "Keine Läufe vorhanden", "Es liegen noch keine historischen Testläufe vor.")


def render_history_detail(records: list[RunRecord]) -> None:
  st.markdown("#### Lauf im Detail")
  if not records:
    render_notice("warning", "Keine Historie vorhanden", "Es sind noch keine gespeicherten Läufe vorhanden.")
    return

  sorted_records = sorted(records, key=lambda item: item.timestamp, reverse=True)
  option_map = {build_run_option(record): record for record in sorted_records}
  selected_label = st.selectbox(
    "Historischen Lauf auswählen",
    list(option_map.keys()),
    key="history-run-select",
  )
  selected_record = option_map[selected_label]

  render_run_snapshot(selected_record, "Ausgewählter Lauf")
  st.markdown("#### Suiten im ausgewählten Lauf")
  render_suites_table(selected_record)

  if selected_record.failures:
    actions = [build_failure_action(selected_record, failure) for failure in selected_record.failures]
    failure_options = {
      f"{index}. {action['test_name']}": action
      for index, action in enumerate(actions, start=1)
    }
    selected_failure_label = st.selectbox(
      "Fehler im ausgewählten Lauf",
      list(failure_options.keys()),
      key="history-failure-select",
    )
    render_failure_card(failure_options[selected_failure_label], key_prefix="history-failure")
  else:
    render_notice(
      "passed",
      "Kein Fehler in diesem Lauf",
      "Der ausgewählte Lauf war erfolgreich. Du kannst unten trotzdem die Testdateien dieses Laufs einsehen.",
    )
    render_suite_source_browser(selected_record, "history-passed-run")


def render_milestones(records: list[RunRecord]) -> None:
  st.subheader("Meilensteine")
  milestone_rows = build_milestone_summary(records)

  if not milestone_rows:
    render_notice(
      "passed",
      "Keine Meilenstein-Treffer",
      "Es gibt aktuell keine Fehlerhistorie, die einem Meilenstein zugeordnet werden kann.",
    )
    return

  st.dataframe(milestone_rows, width="stretch", hide_index=True)


def render_history(records: list[RunRecord]) -> None:
  st.subheader("Historie")
  sorted_records = sorted(records, key=lambda item: item.timestamp, reverse=True)
  status_display_to_key = {"Alle": None}
  for record in sorted_records:
    status_display_to_key.setdefault(format_status_label(record.status), record.status)

  branch_options = ["Alle", *sorted({record.branch for record in sorted_records})]

  filter_columns = st.columns(2)
  selected_status_label = filter_columns[0].selectbox("Status", list(status_display_to_key.keys()))
  selected_branch = filter_columns[1].selectbox("Branch", branch_options)
  selected_status = status_display_to_key[selected_status_label]

  filtered_records = [
    record
    for record in sorted_records
    if (selected_status is None or record.status == selected_status)
    and (selected_branch == "Alle" or record.branch == selected_branch)
  ]
  filtered_rows = build_history_rows(filtered_records)

  if filtered_rows:
    st.dataframe(filtered_rows, width="stretch", hide_index=True)
  else:
    render_notice(
      "warning",
      "Keine passenden Einträge",
      "Für die aktuelle Filterung sind keine Historien-Einträge vorhanden.",
    )


def render_trends(records: list[RunRecord]) -> None:
  st.subheader("Trends")
  sorted_records = sorted(records, key=lambda item: item.timestamp)

  if len(sorted_records) < 2:
    render_notice(
      "warning",
      "Zu wenig Daten für Trends",
      "Für Trendansichten werden mindestens zwei Läufe benötigt.",
    )
    return

  labels = [f"{record.timestamp} | {record.commit}" for record in sorted_records]
  coverage_points = {"Coverage in %": [record.coverage.lines for record in sorted_records]}
  failure_points = {"Fehleranzahl": [record.summary.failed for record in sorted_records]}
  duration_points = {"Dauer in Sekunden": [record.summary.duration_seconds for record in sorted_records]}

  trend_columns = st.columns(3)
  trend_columns[0].caption("Coverage")
  trend_columns[0].line_chart(coverage_points)
  trend_columns[1].caption("Fehler")
  trend_columns[1].line_chart(failure_points)
  trend_columns[2].caption("Dauer")
  trend_columns[2].line_chart(duration_points)

  st.caption("Index der Trendpunkte")
  st.dataframe(
    [{"Index": index + 1, "Lauf": label} for index, label in enumerate(labels)],
    width="stretch",
    hide_index=True,
  )


def render_failures(records: list[RunRecord]) -> None:
  st.subheader("Fehler")

  all_failures = []
  for record in sorted(records, key=lambda item: item.timestamp, reverse=True):
    for failure in record.failures:
      action = build_failure_action(record, failure)
      all_failures.append(
        {
          "Zeitstempel": record.timestamp,
          "Branch": record.branch,
          "Test": action["test_name"],
          "Meilensteine": ", ".join(milestone_label(code) for code in action["milestones"]),
          "Erste Datei": action["primary_file"],
          "Fehlermeldung": action["message"],
        }
      )

  if not all_failures:
    render_notice(
      "passed",
      "Keine Fehlerhistorie",
      "Aktuell sind keine fehlgeschlagenen Tests in der Historie vorhanden.",
    )
    return

  st.markdown("#### Letzte fehlgeschlagene Tests")
  st.dataframe(all_failures[:10], width="stretch", hide_index=True)

  repeated_failures = Counter(
    f"{failure['Erste Datei']}::{failure['Test']}" for failure in all_failures
  )
  repeated_rows = [
    {"Fehlerbild": label, "Vorkommen": count}
    for label, count in repeated_failures.most_common()
    if count > 1
  ]

  if repeated_rows:
    st.markdown("#### Wiederkehrende Fehler")
    st.dataframe(repeated_rows, width="stretch", hide_index=True)
  else:
    render_notice(
      "passed",
      "Keine Wiederholungen",
      "Aktuell sind keine wiederkehrenden Fehler ableitbar.",
    )


def main() -> None:
  st.set_page_config(page_title="Timewise Test-Dashboard", layout="wide")
  inject_styles()

  st.title("Timewise Test-Dashboard")
  st.caption(
    "Lokale, manuelle Auswertung der Testhistorie. Das Dashboard zeigt Fehler farblich an, ordnet sie betroffenen Meilensteinen zu und lässt die wichtigsten Testarten direkt starten."
  )

  latest, latest_warning = load_latest(LATEST_PATH)
  history, history_warnings = load_history(HISTORY_PATH)

  if latest_warning:
    render_notice("warning", "Hinweis zu latest.json", latest_warning)

  for warning in history_warnings:
    render_notice("warning", "Hinweis zu history.jsonl", warning)

  records = history if history else ([latest] if latest else [])
  page = st.sidebar.radio(
    "Seiten",
    ["Übersicht", "Aktiver Lauf", "Historie", "Teststeuerung"],
    key="dashboard-page",
  )

  st.sidebar.markdown("---")
  auto_refresh_enabled = st.sidebar.checkbox(
    "Automatisch aktualisieren",
    value=True,
    help="Lädt das Dashboard in festen Abständen neu und zeigt neue JSON-Daten ohne manuellen Reload an.",
  )
  refresh_options = {
    "10 Sekunden": 10,
    "30 Sekunden": 30,
    "60 Sekunden": 60,
  }
  selected_refresh_label = st.sidebar.selectbox(
    "Intervall",
    list(refresh_options.keys()),
    index=1,
    disabled=not auto_refresh_enabled,
  )
  if auto_refresh_enabled:
    enable_auto_refresh(refresh_options[selected_refresh_label])
    st.sidebar.caption(f"Auto-Refresh aktiv: alle {refresh_options[selected_refresh_label]} Sekunden")
  else:
    st.sidebar.caption("Auto-Refresh ist deaktiviert.")

  if latest is not None:
    st.sidebar.markdown(f"**Letzter Status:** {format_status_label(latest.status)}")
    st.sidebar.markdown(f"**Branch:** `{latest.branch}`")
    st.sidebar.markdown(f"**Zeitstempel:** `{latest.timestamp}`")

  st.sidebar.markdown(f"**Gespeicherte Läufe:** {len(records)}")

  if latest is None and not records:
    render_notice(
      "warning",
      "Noch keine Dashboard-Daten vorhanden",
      "Führe zuerst `npm run dashboard:prepare` aus oder nutze die Teststeuerung und aktualisiere danach die Dashboard-Daten.",
    )
    if page == "Teststeuerung":
      render_test_controls()
    return

  if page == "Übersicht":
    if latest is not None:
      render_overview(latest, records)
    render_recent_runs(records)
    render_trends(records)
    return

  if page == "Aktiver Lauf":
    render_action_center(latest, records)
    return

  if page == "Historie":
    render_history(records)
    render_history_detail(records)
    render_milestones(records)
    render_failures(records)
    return

  render_test_controls()


if __name__ == "__main__":
  main()
