from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

SCHEMA_VERSION = 1
VALID_STATUSES = {"passed", "failed", "warning", "unknown"}


def utc_now_iso() -> str:
  return (
    datetime.now(timezone.utc)
    .replace(microsecond=0)
    .isoformat()
    .replace("+00:00", "Z")
  )


def coerce_int(value: Any, default: int = 0) -> int:
  try:
    return int(value)
  except (TypeError, ValueError):
    return default


def coerce_float(value: Any, default: float = 0.0) -> float:
  try:
    return round(float(value), 2)
  except (TypeError, ValueError):
    return default


def coerce_str(value: Any, default: str = "") -> str:
  if isinstance(value, str):
    cleaned = value.strip()
    return cleaned or default
  return default


def normalize_timestamp(value: Any) -> str:
  if isinstance(value, (int, float)):
    timestamp = float(value)
    if timestamp > 1_000_000_000_000:
      timestamp /= 1000
    return (
      datetime.fromtimestamp(timestamp, tz=timezone.utc)
      .replace(microsecond=0)
      .isoformat()
      .replace("+00:00", "Z")
    )

  if isinstance(value, str) and value.strip():
    candidate = value.strip()
    try:
      normalized = candidate.replace("Z", "+00:00")
      parsed = datetime.fromisoformat(normalized)
      if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
      return parsed.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
      )
    except ValueError:
      return utc_now_iso()

  return utc_now_iso()


@dataclass
class Summary:
  total: int = 0
  passed: int = 0
  failed: int = 0
  skipped: int = 0
  duration_seconds: float = 0.0

  @classmethod
  def from_dict(cls, payload: Any) -> "Summary":
    if not isinstance(payload, dict):
      return cls()

    return cls(
      total=coerce_int(payload.get("total")),
      passed=coerce_int(payload.get("passed")),
      failed=coerce_int(payload.get("failed")),
      skipped=coerce_int(payload.get("skipped")),
      duration_seconds=coerce_float(payload.get("duration_seconds")),
    )

  def to_dict(self) -> dict[str, Any]:
    return {
      "total": self.total,
      "passed": self.passed,
      "failed": self.failed,
      "skipped": self.skipped,
      "duration_seconds": self.duration_seconds,
    }


@dataclass
class Coverage:
  lines: float = 0.0
  functions: float = 0.0
  branches: float = 0.0
  statements: float = 0.0

  @classmethod
  def from_dict(cls, payload: Any) -> "Coverage":
    if not isinstance(payload, dict):
      return cls()

    if "total" in payload and isinstance(payload.get("total"), dict):
      total = payload["total"]
      return cls(
        lines=coerce_float(total.get("lines", {}).get("pct")),
        functions=coerce_float(total.get("functions", {}).get("pct")),
        branches=coerce_float(total.get("branches", {}).get("pct")),
        statements=coerce_float(total.get("statements", {}).get("pct")),
      )

    return cls(
      lines=coerce_float(payload.get("lines")),
      functions=coerce_float(payload.get("functions")),
      branches=coerce_float(payload.get("branches")),
      statements=coerce_float(payload.get("statements")),
    )

  def to_dict(self) -> dict[str, Any]:
    return {
      "lines": self.lines,
      "functions": self.functions,
      "branches": self.branches,
      "statements": self.statements,
    }


@dataclass
class CoverageFile:
  file: str = ""
  lines: float = 0.0
  functions: float = 0.0
  branches: float = 0.0
  statements: float = 0.0
  uncovered_lines: int = 0
  uncovered_functions: int = 0
  uncovered_branches: int = 0
  uncovered_statements: int = 0

  @classmethod
  def from_dict(cls, payload: Any) -> "CoverageFile":
    if not isinstance(payload, dict):
      return cls()

    return cls(
      file=coerce_str(payload.get("file")),
      lines=coerce_float(payload.get("lines")),
      functions=coerce_float(payload.get("functions")),
      branches=coerce_float(payload.get("branches")),
      statements=coerce_float(payload.get("statements")),
      uncovered_lines=coerce_int(payload.get("uncovered_lines")),
      uncovered_functions=coerce_int(payload.get("uncovered_functions")),
      uncovered_branches=coerce_int(payload.get("uncovered_branches")),
      uncovered_statements=coerce_int(payload.get("uncovered_statements")),
    )

  def to_dict(self) -> dict[str, Any]:
    return {
      "file": self.file,
      "lines": self.lines,
      "functions": self.functions,
      "branches": self.branches,
      "statements": self.statements,
      "uncovered_lines": self.uncovered_lines,
      "uncovered_functions": self.uncovered_functions,
      "uncovered_branches": self.uncovered_branches,
      "uncovered_statements": self.uncovered_statements,
    }


@dataclass
class Suite:
  name: str = ""
  file: str = ""
  status: str = "unknown"
  duration_seconds: float = 0.0
  total: int = 0
  passed: int = 0
  failed: int = 0
  skipped: int = 0

  @classmethod
  def from_dict(cls, payload: Any) -> "Suite":
    if not isinstance(payload, dict):
      return cls()

    return cls(
      name=coerce_str(payload.get("name")),
      file=coerce_str(payload.get("file")),
      status=normalize_status(payload.get("status")),
      duration_seconds=coerce_float(payload.get("duration_seconds")),
      total=coerce_int(payload.get("total")),
      passed=coerce_int(payload.get("passed")),
      failed=coerce_int(payload.get("failed")),
      skipped=coerce_int(payload.get("skipped")),
    )

  def to_dict(self) -> dict[str, Any]:
    return {
      "name": self.name,
      "file": self.file,
      "status": self.status,
      "duration_seconds": self.duration_seconds,
      "total": self.total,
      "passed": self.passed,
      "failed": self.failed,
      "skipped": self.skipped,
    }


@dataclass
class Failure:
  name: str = ""
  suite: str = ""
  file: str = ""
  message: str = ""
  details: str = ""

  @classmethod
  def from_dict(cls, payload: Any) -> "Failure":
    if not isinstance(payload, dict):
      return cls()

    return cls(
      name=coerce_str(payload.get("name")),
      suite=coerce_str(payload.get("suite")),
      file=coerce_str(payload.get("file")),
      message=coerce_str(payload.get("message")),
      details=coerce_str(payload.get("details")),
    )

  def to_dict(self) -> dict[str, Any]:
    return {
      "name": self.name,
      "suite": self.suite,
      "file": self.file,
      "message": self.message,
      "details": self.details,
    }


def normalize_status(value: Any) -> str:
  candidate = coerce_str(value, "unknown").lower()
  return candidate if candidate in VALID_STATUSES else "unknown"


@dataclass
class RunRecord:
  schema_version: int = SCHEMA_VERSION
  timestamp: str = field(default_factory=utc_now_iso)
  workflow: str = "local-manual"
  run_id: str = ""
  branch: str = "unknown"
  commit: str = "unknown"
  status: str = "unknown"
  summary: Summary = field(default_factory=Summary)
  coverage: Coverage = field(default_factory=Coverage)
  coverage_files: list[CoverageFile] = field(default_factory=list)
  suites: list[Suite] = field(default_factory=list)
  failures: list[Failure] = field(default_factory=list)

  @classmethod
  def from_dict(cls, payload: Any) -> "RunRecord":
    if not isinstance(payload, dict):
      return cls(run_id=f"run-{utc_now_iso().replace(':', '').replace('-', '')}")

    summary = Summary.from_dict(payload.get("summary"))
    failures = [Failure.from_dict(item) for item in payload.get("failures", []) if isinstance(item, dict)]
    coverage_files = [
      CoverageFile.from_dict(item)
      for item in payload.get("coverage_files", [])
      if isinstance(item, dict)
    ]
    suites = [Suite.from_dict(item) for item in payload.get("suites", []) if isinstance(item, dict)]

    status = normalize_status(payload.get("status"))
    if status == "unknown":
      if summary.failed > 0 or any(failure.name for failure in failures):
        status = "failed"
      elif summary.total > 0:
        status = "passed"

    timestamp = normalize_timestamp(payload.get("timestamp"))
    run_id = coerce_str(payload.get("run_id"))
    if not run_id:
      run_id = f"run-{timestamp.replace(':', '').replace('-', '')}"

    return cls(
      schema_version=coerce_int(payload.get("schema_version"), SCHEMA_VERSION),
      timestamp=timestamp,
      workflow=coerce_str(payload.get("workflow"), "local-manual"),
      run_id=run_id,
      branch=coerce_str(payload.get("branch"), "unknown"),
      commit=coerce_str(payload.get("commit"), "unknown"),
      status=status,
      summary=summary,
      coverage=Coverage.from_dict(payload.get("coverage")),
      coverage_files=coverage_files,
      suites=suites,
      failures=failures,
    )

  def to_dict(self) -> dict[str, Any]:
    return {
      "schema_version": self.schema_version,
      "timestamp": self.timestamp,
      "workflow": self.workflow,
      "run_id": self.run_id,
      "branch": self.branch,
      "commit": self.commit,
      "status": self.status,
      "summary": self.summary.to_dict(),
      "coverage": self.coverage.to_dict(),
      "coverage_files": [coverage_file.to_dict() for coverage_file in self.coverage_files],
      "suites": [suite.to_dict() for suite in self.suites],
      "failures": [failure.to_dict() for failure in self.failures],
    }
