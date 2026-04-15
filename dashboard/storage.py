from __future__ import annotations

import json
from pathlib import Path

from schema import RunRecord


def ensure_paths(*paths: Path) -> None:
  for path in paths:
    target = path if path.suffix == "" else path.parent
    target.mkdir(parents=True, exist_ok=True)


def load_latest(path: Path) -> tuple[RunRecord | None, str | None]:
  if not path.exists() or path.stat().st_size == 0:
    return None, None

  try:
    payload = json.loads(path.read_text(encoding="utf-8"))
  except (OSError, json.JSONDecodeError) as error:
    return None, f"latest.json konnte nicht gelesen werden: {error}"

  return RunRecord.from_dict(payload), None


def write_latest(path: Path, record: RunRecord) -> None:
  ensure_paths(path)
  path.write_text(
    json.dumps(record.to_dict(), indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
  )


def load_history(path: Path) -> tuple[list[RunRecord], list[str]]:
  if not path.exists() or path.stat().st_size == 0:
    return [], []

  records: list[RunRecord] = []
  warnings: list[str] = []

  try:
    content = path.read_text(encoding="utf-8")
  except OSError as error:
    return [], [f"history.jsonl konnte nicht gelesen werden: {error}"]

  for index, raw_line in enumerate(content.splitlines(), start=1):
    line = raw_line.strip()
    if not line:
      continue

    try:
      payload = json.loads(line)
    except json.JSONDecodeError:
      warnings.append(f"Ungueltige History-Zeile wurde uebersprungen: {index}")
      continue

    records.append(RunRecord.from_dict(payload))

  return records, warnings


def append_history(path: Path, record: RunRecord) -> bool:
  ensure_paths(path)
  existing_records, _ = load_history(path)

  duplicate_exists = any(
    existing.run_id == record.run_id and existing.timestamp == record.timestamp
    for existing in existing_records
  )
  if duplicate_exists:
    return False

  with path.open("a", encoding="utf-8") as handle:
    handle.write(json.dumps(record.to_dict(), ensure_ascii=False) + "\n")

  return True


def write_snapshot(directory: Path, record: RunRecord) -> Path:
  ensure_paths(directory)
  safe_timestamp = record.timestamp.replace(":", "").replace("-", "")
  safe_run_id = record.run_id.replace("/", "-").replace("\\", "-")
  snapshot_path = directory / f"{safe_timestamp}__{safe_run_id}.json"
  snapshot_path.write_text(
    json.dumps(record.to_dict(), indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
  )
  return snapshot_path
