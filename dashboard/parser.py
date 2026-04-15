from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

from schema import Coverage, Failure, RunRecord, Suite, Summary, coerce_float, coerce_int, coerce_str
from storage import append_history, ensure_paths, write_latest, write_snapshot


def read_json(path: Path | None) -> dict[str, Any] | None:
  if path is None or not path.exists() or path.stat().st_size == 0:
    return None

  try:
    payload = json.loads(path.read_text(encoding="utf-8"))
  except (OSError, json.JSONDecodeError):
    return None

  return payload if isinstance(payload, dict) else None


def parse_failure_messages(messages: Any) -> list[str]:
  if not isinstance(messages, list):
    return []

  cleaned: list[str] = []
  for message in messages:
    if isinstance(message, str) and message.strip():
      cleaned.append(message.strip())
  return cleaned


def flatten_tasks(tasks: Any) -> list[dict[str, Any]]:
  if not isinstance(tasks, list):
    return []

  flattened: list[dict[str, Any]] = []
  for task in tasks:
    if not isinstance(task, dict):
      continue

    nested = flatten_tasks(task.get("tasks"))
    if nested:
      flattened.extend(nested)
      continue

    if task.get("type") == "test" or "result" in task:
      flattened.append(task)

  return flattened


def parse_vitest_suite(payload: dict[str, Any]) -> tuple[Suite, list[Failure]]:
  file_name = coerce_str(payload.get("name") or payload.get("filepath") or payload.get("file"))
  suite_name = Path(file_name).name or file_name or "unknown-suite"

  assertion_results = payload.get("assertionResults")
  if not isinstance(assertion_results, list):
    assertion_results = flatten_tasks(payload.get("tasks"))

  passed = 0
  failed = 0
  skipped = 0
  failures: list[Failure] = []

  for assertion in assertion_results:
    if not isinstance(assertion, dict):
      continue

    result = assertion.get("result")
    status = coerce_str(assertion.get("status") or (result or {}).get("state")).lower()
    if status in {"pending", "skipped", "todo"}:
      skipped += 1
    elif status == "failed":
      failed += 1
    elif status in {"passed", "pass"}:
      passed += 1

    if status == "failed":
      failure_messages = parse_failure_messages(assertion.get("failureMessages"))
      if not failure_messages and isinstance(result, dict):
        failure_messages = parse_failure_messages(result.get("errors"))

      failures.append(
        Failure(
          name=coerce_str(assertion.get("fullName") or assertion.get("title") or assertion.get("name")),
          suite=suite_name,
          file=file_name,
          message=failure_messages[0] if failure_messages else "Test fehlgeschlagen.",
          details="\n\n".join(failure_messages[1:]),
        )
      )

  total = passed + failed + skipped
  duration_ms = coerce_float(payload.get("duration"), 0.0)
  if duration_ms == 0.0:
    duration_ms = coerce_float(payload.get("endTime"), 0.0) - coerce_float(payload.get("startTime"), 0.0)

  status = coerce_str(payload.get("status")).lower()
  if status not in {"passed", "failed", "skipped"}:
    if failed > 0:
      status = "failed"
    elif total > 0:
      status = "passed"
    else:
      status = "unknown"

  suite = Suite(
    name=suite_name,
    file=file_name,
    status=status,
    duration_seconds=round(max(duration_ms, 0.0) / 1000, 2),
    total=total,
    passed=passed,
    failed=failed,
    skipped=skipped,
  )

  return suite, failures


def parse_vitest_report(payload: dict[str, Any]) -> RunRecord:
  suite_payloads = payload.get("testResults")
  if not isinstance(suite_payloads, list):
    suite_payloads = payload.get("files") if isinstance(payload.get("files"), list) else []

  suites: list[Suite] = []
  failures: list[Failure] = []
  for suite_payload in suite_payloads:
    if not isinstance(suite_payload, dict):
      continue
    suite, suite_failures = parse_vitest_suite(suite_payload)
    suites.append(suite)
    failures.extend(suite_failures)

  total = coerce_int(payload.get("numTotalTests"))
  passed = coerce_int(payload.get("numPassedTests"))
  failed = coerce_int(payload.get("numFailedTests"))
  skipped = coerce_int(payload.get("numPendingTests"))

  if total == 0:
    total = sum(suite.total for suite in suites)
    passed = sum(suite.passed for suite in suites)
    failed = sum(suite.failed for suite in suites)
    skipped = sum(suite.skipped for suite in suites)

  duration_seconds = coerce_float(payload.get("duration"), 0.0)
  if duration_seconds > 1000:
    duration_seconds = round(duration_seconds / 1000, 2)
  elif duration_seconds == 0.0:
    duration_seconds = round(sum(suite.duration_seconds for suite in suites), 2)

  status = "passed" if payload.get("success", failed == 0) else "failed"

  return RunRecord.from_dict(
    {
      "schema_version": 1,
      "timestamp": payload.get("startTime"),
      "workflow": "local-vitest",
      "run_id": payload.get("startTime"),
      "status": status,
      "summary": Summary(
        total=total,
        passed=passed,
        failed=failed,
        skipped=skipped,
        duration_seconds=duration_seconds,
      ).to_dict(),
      "coverage": Coverage().to_dict(),
      "suites": [suite.to_dict() for suite in suites],
      "failures": [failure.to_dict() for failure in failures],
    }
  )


def load_sample_record(sample_path: Path | None) -> RunRecord | None:
  payload = read_json(sample_path)
  if payload is None:
    return None
  return RunRecord.from_dict(payload)


def infer_git_value(*args: str, default: str = "unknown") -> str:
  try:
    result = subprocess.run(
      ["git", *args],
      check=False,
      capture_output=True,
      text=True,
    )
  except OSError:
    return default

  value = result.stdout.strip()
  return value or default


def merge_coverage(record: RunRecord, coverage_payload: dict[str, Any] | None) -> RunRecord:
  if coverage_payload is None:
    return record
  record.coverage = Coverage.from_dict(coverage_payload)
  return record


def build_record(
  vitest_report: Path | None,
  coverage_report: Path | None,
  sample_path: Path | None,
) -> tuple[RunRecord, str]:
  vitest_payload = read_json(vitest_report)
  if vitest_payload is not None:
    record = parse_vitest_report(vitest_payload)
    source = "vitest"
  else:
    record = load_sample_record(sample_path) or RunRecord.from_dict({})
    source = "sample"

  coverage_payload = read_json(coverage_report)
  record = merge_coverage(record, coverage_payload)

  if record.branch == "unknown":
    record.branch = infer_git_value("branch", "--show-current")
  if record.commit == "unknown":
    record.commit = infer_git_value("rev-parse", "--short", "HEAD")
  if not record.run_id:
    record.run_id = f"{record.workflow}-{record.timestamp.replace(':', '').replace('-', '')}"

  return record, source


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Normalize local test reports into dashboard JSON.")
  parser.add_argument("--vitest-report", type=Path, default=None)
  parser.add_argument("--coverage-report", type=Path, default=None)
  parser.add_argument("--latest", type=Path, required=True)
  parser.add_argument("--history", type=Path, required=True)
  parser.add_argument("--snapshots", type=Path, required=True)
  parser.add_argument("--sample", type=Path, default=None)
  return parser.parse_args()


def main() -> int:
  args = parse_args()
  ensure_paths(args.latest, args.history, args.snapshots)

  record, source = build_record(args.vitest_report, args.coverage_report, args.sample)

  write_latest(args.latest, record)
  was_appended = append_history(args.history, record)
  snapshot_path = write_snapshot(args.snapshots, record)

  print(f"source={source}")
  print(f"latest={args.latest}")
  print(f"history_appended={was_appended}")
  print(f"snapshot={snapshot_path}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
