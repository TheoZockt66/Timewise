from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

from schema import (
  Coverage,
  CoverageFile,
  Failure,
  RunRecord,
  Suite,
  Summary,
  coerce_float,
  coerce_int,
  coerce_str,
)
from storage import append_history, ensure_paths, write_latest, write_snapshot

REPO_ROOT = Path(__file__).resolve().parent.parent


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


def normalize_coverage_path(value: Any) -> str:
  raw = coerce_str(value)
  if not raw:
    return ""

  normalized = raw.replace("\\", "/")
  repo_root = REPO_ROOT.as_posix()

  if normalized.lower().startswith(repo_root.lower() + "/"):
    return normalized[len(repo_root) + 1 :]

  return normalized


def count_hits(counter_map: Any) -> tuple[int, int]:
  if not isinstance(counter_map, dict):
    return 0, 0

  covered = 0
  total = 0
  for value in counter_map.values():
    total += 1
    if coerce_int(value) > 0:
      covered += 1

  return covered, total


def count_branch_hits(counter_map: Any) -> tuple[int, int]:
  if not isinstance(counter_map, dict):
    return 0, 0

  covered = 0
  total = 0
  for values in counter_map.values():
    if not isinstance(values, list):
      continue

    total += len(values)
    covered += sum(1 for value in values if coerce_int(value) > 0)

  return covered, total


def collect_line_hits(statement_map: Any, statement_counts: Any) -> tuple[int, int]:
  if not isinstance(statement_map, dict) or not isinstance(statement_counts, dict):
    return 0, 0

  total_lines: set[int] = set()
  covered_lines: set[int] = set()

  for key, location in statement_map.items():
    if not isinstance(location, dict):
      continue

    start = location.get("start")
    end = location.get("end")
    if not isinstance(start, dict) or not isinstance(end, dict):
      continue

    start_line = coerce_int(start.get("line"))
    end_line = coerce_int(end.get("line"), start_line)
    if start_line <= 0:
      continue

    if end_line < start_line:
      end_line = start_line

    line_numbers = range(start_line, end_line + 1)
    total_lines.update(line_numbers)

    if coerce_int(statement_counts.get(key)) > 0:
      covered_lines.update(line_numbers)

  return len(covered_lines), len(total_lines)


def percent(covered: int, total: int) -> float:
  if total <= 0:
    return 0.0
  return round((covered / total) * 100, 2)


def build_coverage_from_map(coverage_map: Any) -> tuple[Coverage, list[CoverageFile]]:
  if not isinstance(coverage_map, dict):
    return Coverage(), []

  coverage_files: list[CoverageFile] = []
  total_line_covered = 0
  total_line_count = 0
  total_function_covered = 0
  total_function_count = 0
  total_branch_covered = 0
  total_branch_count = 0
  total_statement_covered = 0
  total_statement_count = 0

  for path, payload in coverage_map.items():
    if not isinstance(payload, dict):
      continue

    normalized_path = normalize_coverage_path(path)
    if not normalized_path.startswith("src/"):
      continue

    line_covered, line_count = collect_line_hits(payload.get("statementMap"), payload.get("s"))
    function_covered, function_count = count_hits(payload.get("f"))
    branch_covered, branch_count = count_branch_hits(payload.get("b"))
    statement_covered, statement_count = count_hits(payload.get("s"))

    if max(line_count, function_count, branch_count, statement_count) == 0:
      continue

    coverage_files.append(
      CoverageFile(
        file=normalized_path,
        lines=percent(line_covered, line_count),
        functions=percent(function_covered, function_count),
        branches=percent(branch_covered, branch_count),
        statements=percent(statement_covered, statement_count),
        uncovered_lines=max(line_count - line_covered, 0),
        uncovered_functions=max(function_count - function_covered, 0),
        uncovered_branches=max(branch_count - branch_covered, 0),
        uncovered_statements=max(statement_count - statement_covered, 0),
      )
    )

    total_line_covered += line_covered
    total_line_count += line_count
    total_function_covered += function_covered
    total_function_count += function_count
    total_branch_covered += branch_covered
    total_branch_count += branch_count
    total_statement_covered += statement_covered
    total_statement_count += statement_count

  coverage_files.sort(
    key=lambda item: (
      item.branches,
      item.statements,
      item.functions,
      item.lines,
      item.file,
    )
  )

  return (
    Coverage(
      lines=percent(total_line_covered, total_line_count) if total_line_count else percent(total_statement_covered, total_statement_count),
      functions=percent(total_function_covered, total_function_count),
      branches=percent(total_branch_covered, total_branch_count),
      statements=percent(total_statement_covered, total_statement_count),
    ),
    coverage_files,
  )


def parse_coverage_summary_files(payload: dict[str, Any]) -> list[CoverageFile]:
  coverage_files: list[CoverageFile] = []

  for path, metrics in payload.items():
    if path == "total" or not isinstance(metrics, dict):
      continue

    normalized_path = normalize_coverage_path(path)
    if not normalized_path.startswith("src/"):
      continue

    lines = metrics.get("lines", {}) if isinstance(metrics.get("lines"), dict) else {}
    functions = metrics.get("functions", {}) if isinstance(metrics.get("functions"), dict) else {}
    branches = metrics.get("branches", {}) if isinstance(metrics.get("branches"), dict) else {}
    statements = metrics.get("statements", {}) if isinstance(metrics.get("statements"), dict) else {}

    coverage_files.append(
      CoverageFile(
        file=normalized_path,
        lines=coerce_float(lines.get("pct")),
        functions=coerce_float(functions.get("pct")),
        branches=coerce_float(branches.get("pct")),
        statements=coerce_float(statements.get("pct")),
        uncovered_lines=max(coerce_int(lines.get("total")) - coerce_int(lines.get("covered")), 0),
        uncovered_functions=max(coerce_int(functions.get("total")) - coerce_int(functions.get("covered")), 0),
        uncovered_branches=max(coerce_int(branches.get("total")) - coerce_int(branches.get("covered")), 0),
        uncovered_statements=max(coerce_int(statements.get("total")) - coerce_int(statements.get("covered")), 0),
      )
    )

  coverage_files.sort(
    key=lambda item: (
      item.branches,
      item.statements,
      item.functions,
      item.lines,
      item.file,
    )
  )
  return coverage_files


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
  coverage, coverage_files = build_coverage_from_map(payload.get("coverageMap"))

  return RunRecord.from_dict(
    {
      "schema_version": 1,
      "timestamp": payload.get("startTime"),
      "workflow": "local-vitest",
      "run_id": payload.get("startTime"),
      "branch": "unknown",
      "commit": "unknown",
      "status": status,
      "summary": Summary(
        total=total,
        passed=passed,
        failed=failed,
        skipped=skipped,
        duration_seconds=duration_seconds,
      ).to_dict(),
      "coverage": coverage.to_dict(),
      "coverage_files": [coverage_file.to_dict() for coverage_file in coverage_files],
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
  summary_files = parse_coverage_summary_files(coverage_payload)
  if summary_files:
    record.coverage_files = summary_files

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
