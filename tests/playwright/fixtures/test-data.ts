/**
 * Gemeinsame Testdaten für alle E2E-Testdateien.
 * Alle Zeitangaben sind ISO-8601-Strings.
 */

export const testKeyword = {
  id: "kw-e2e-1",
  user_id: "user-e2e",
  label: "E2E-Mathe",
  color: "#5500B0",
  created_at: "2026-01-01T00:00:00.000Z",
};

/** Gibt ein Event zurück, dessen Datum heute liegt — damit es im Kalender sichtbar ist. */
export function buildTodayEvent() {
  const today = new Date();
  const start = new Date(today);
  start.setHours(9, 0, 0, 0);
  const end = new Date(today);
  end.setHours(11, 0, 0, 0);

  return {
    id: "ev-e2e-1",
    user_id: "user-e2e",
    label: "E2E-Lernblock",
    description: null,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    created_at: start.toISOString(),
    keywords: [testKeyword],
    duration_minutes: 120,
  };
}

export const testGoal = {
  id: "goal-e2e-1",
  user_id: "user-e2e",
  label: "E2E-Klausurvorbereitung",
  description: "Automatisch erzeugtes Testziel",
  start_time: "2026-06-01T00:00:00.000Z",
  end_time: "2026-06-30T23:59:59.999Z",
  target_study_time: "10:00:00",
  created_at: "2026-06-01T00:00:00.000Z",
  keywords: [testKeyword],
  logged_minutes: 120,
  target_minutes: 600,
  percentage: 20,
  is_achieved: false,
  remaining_minutes: 480,
  days_remaining: 26,
};

export const testAggregateData = [
  {
    period: "04.06.2026",
    total_minutes: 120,
    by_keyword: [{ keyword_id: testKeyword.id, label: testKeyword.label, minutes: 120 }],
  },
];
