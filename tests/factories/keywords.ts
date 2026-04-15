import type { Keyword } from "@/types";

export function buildKeyword(overrides: Partial<Keyword> = {}): Keyword {
  return {
    id: "keyword-1",
    user_id: "user-1",
    label: "Mathe",
    color: "#7700F4",
    created_at: "2026-04-15T10:00:00.000Z",
    ...overrides,
  };
}
