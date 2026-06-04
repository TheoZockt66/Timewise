import { describe, expect, test } from "vitest";
import { validateGoal } from "@/lib/validators/goal.validator";

describe("validateGoal", () => {
  test("returns valid for a complete goal on create", () => {
    expect(
      validateGoal(
        {
          label: "Klausurphase",
          target_study_time: "20:00:00",
          start_time: "2026-04-01T00:00:00.000Z",
          end_time: "2026-04-30T23:59:59.999Z",
        },
        {
          requireLabel: true,
          requireTargetStudyTime: true,
        }
      )
    ).toEqual({
      valid: true,
      error: null,
    });
  });

  test("returns valid for a goal without target study time", () => {
    expect(
      validateGoal(
        {
          label: "Klausurphase",
        },
        {
          requireLabel: true,
        }
      )
    ).toEqual({
      valid: true,
      error: null,
    });
  });

  test("rejects a missing label on create", () => {
    expect(
      validateGoal(
        {
          label: "",
          target_study_time: "10:00:00",
        },
        {
          requireLabel: true,
        }
      )
    ).toEqual({
      valid: false,
      error: "Bezeichnung ist erforderlich. Bitte gib eine Bezeichnung an.",
    });
  });

  test("rejects an empty label on update", () => {
    expect(
      validateGoal({
        label: "   ",
      })
    ).toEqual({
      valid: false,
      error: "Bezeichnung ist erforderlich. Bitte gib eine Bezeichnung an.",
    });
  });

  test("rejects a label longer than 100 characters", () => {
    expect(
      validateGoal({
        label: "A".repeat(101),
      })
    ).toEqual({
      valid: false,
      error: "Bezeichnung darf maximal 100 Zeichen lang sein.",
    });
  });

  test("rejects an interval with invalid format", () => {
    expect(
      validateGoal({
        label: "Klausurphase",
        target_study_time: "20h",
      })
    ).toEqual({
      valid: false,
      error: "Zielzeit muss im Format HH:MM:SS sein.",
    });
  });

  test("rejects a target study time of zero", () => {
    expect(
      validateGoal({
        label: "Klausurphase",
        target_study_time: "0:00:00",
      })
    ).toEqual({
      valid: false,
      error: "Zielzeit muss größer als 0 Minuten sein.",
    });
  });

  test("rejects an invalid start date", () => {
    expect(
      validateGoal({
        label: "Klausurphase",
        start_time: "kein-datum",
      })
    ).toEqual({
      valid: false,
      error: "Startdatum ist ungültig. Bitte wähle ein gültiges Datum.",
    });
  });

  test("rejects an invalid end date", () => {
    expect(
      validateGoal({
        label: "Klausurphase",
        end_time: "kein-datum",
      })
    ).toEqual({
      valid: false,
      error: "Enddatum ist ungültig. Bitte wähle ein gültiges Datum.",
    });
  });

  test("rejects an end date before the start date", () => {
    expect(
      validateGoal({
        label: "Klausurphase",
        start_time: "2026-04-10T00:00:00.000Z",
        end_time: "2026-04-01T23:59:59.999Z",
      })
    ).toEqual({
      valid: false,
      error: "Enddatum muss nach dem Startdatum liegen.",
    });
  });

  test("allows a partial update with only a valid label", () => {
    expect(
      validateGoal({
        label: "Neue Bezeichnung",
      })
    ).toEqual({
      valid: true,
      error: null,
    });
  });

  // ── Äquivalenzklassen (EQ) ──────────────────────────────────────────────────

  test("accepts a goal with overlapping time periods since the validator does not enforce uniqueness (EQ_GO_08)", () => {
    // Der Validator prüft keine zeitlichen Überlappungen zwischen verschiedenen Zielen.
    // Überlappende Zielzeiträume sind laut Projektanforderung erlaubt.
    expect(
      validateGoal({
        label: "Zweites Ziel im selben Zeitraum",
        start_time: "2026-06-01T00:00:00.000Z",
        end_time: "2026-06-30T23:59:59.999Z",
      })
    ).toEqual({ valid: true, error: null });
  });

  // ── Grenzwertanalyse (BV) ───────────────────────────────────────────────────

  test("accepts a label with exactly one character as the minimum (BV_GO_01)", () => {
    expect(validateGoal({ label: "X" })).toEqual({ valid: true, error: null });
  });

  test("accepts a label with exactly 100 characters at the upper boundary (BV_GO_02)", () => {
    expect(validateGoal({ label: "A".repeat(100) })).toEqual({
      valid: true,
      error: null,
    });
  });

  test("accepts a target study time of 0:01:00 as the minimum value above zero (BV_GO_04)", () => {
    expect(
      validateGoal({ label: "Test", target_study_time: "0:01:00" })
    ).toEqual({ valid: true, error: null });
  });

  test("accepts a goal where end date equals start date since the validator uses strict less-than (BV_GO_06)", () => {
    expect(
      validateGoal({
        label: "Test",
        start_time: "2026-06-01T00:00:00.000Z",
        end_time: "2026-06-01T00:00:00.000Z",
      })
    ).toEqual({ valid: true, error: null });
  });
});
