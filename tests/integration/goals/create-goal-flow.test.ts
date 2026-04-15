import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/goals/route";
import { createClient } from "@/lib/supabase/server";
import { buildGoal } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";
import {
  createSupabaseClientMock,
  createSupabaseResult,
} from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("goal creation flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates a goal through route, service and progress enrichment", async () => {
    const keyword = buildKeyword();
    const newGoal = buildGoal({
      id: "goal-2",
      label: "Pruefungsvorbereitung",
      target_study_time: "05:00:00",
    });

    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        keywords: {
          select: {
            await: [createSupabaseResult([{ id: keyword.id }])],
          },
        },
        goals: {
          insert: {
            single: [createSupabaseResult(newGoal)],
          },
        },
        goal_keywords: {
          insert: {
            await: [createSupabaseResult(null)],
          },
          select: {
            await: [createSupabaseResult([{ keywords: keyword }])],
          },
        },
        event_keywords: {
          select: {
            await: [createSupabaseResult([])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({
          label: "Pruefungsvorbereitung",
          target_study_time: "05:00:00",
          keyword_ids: [keyword.id],
        }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: "goal-2",
        label: "Pruefungsvorbereitung",
        keywords: [keyword],
        logged_minutes: 0,
        percentage: 0,
      },
      error: null,
    });
  });
});
