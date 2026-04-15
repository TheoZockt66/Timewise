import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/api/goals/route";
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

describe("goal progress flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns progress based on overlapping event minutes", async () => {
    const keyword = buildKeyword();
    const goal = buildGoal({
      target_study_time: "02:00:00",
      start_time: "2026-04-02T09:30:00.000Z",
      end_time: "2026-04-02T10:30:00.000Z",
    });

    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        goals: {
          select: {
            await: [createSupabaseResult([goal])],
          },
        },
        goal_keywords: {
          select: {
            await: [createSupabaseResult([{ keywords: keyword }])],
          },
        },
        event_keywords: {
          select: {
            await: [createSupabaseResult([{ event_id: "event-1" }])],
          },
        },
        events: {
          select: {
            await: [
              createSupabaseResult([
                {
                  start_time: "2026-04-02T09:00:00.000Z",
                  end_time: "2026-04-02T11:00:00.000Z",
                },
              ]),
            ],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          id: goal.id,
          logged_minutes: 60,
          target_minutes: 120,
          percentage: 50,
          remaining_minutes: 60,
        },
      ],
      error: null,
    });
  });
});
