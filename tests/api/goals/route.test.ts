import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "@/app/api/goals/route";
import { createClient } from "@/lib/supabase/server";
import { createGoal, getGoals } from "@/lib/services/goal.service";
import { createSupabaseClientMock } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/goal.service", () => ({
  createGoal: vi.fn(),
  getGoals: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedCreateGoal = vi.mocked(createGoal);
const mockedGetGoals = vi.mocked(getGoals);

describe("goals route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GET returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });

  test("POST attaches user_id and returns 201 on success", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateGoal.mockResolvedValue({
      data: {
        id: "goal-1",
        user_id: "user-1",
        label: "Klausur",
        description: null,
        start_time: null,
        end_time: null,
        target_study_time: null,
        created_at: "2026-04-15T10:00:00.000Z",
        keywords: [],
        logged_minutes: 0,
        target_minutes: 0,
        percentage: 0,
        is_achieved: false,
        remaining_minutes: 0,
        days_remaining: 0,
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ label: "Klausur", keyword_ids: ["keyword-1"] }),
      })
    );

    expect(response.status).toBe(201);
    expect(mockedCreateGoal).toHaveBeenCalledWith({
      label: "Klausur",
      keyword_ids: ["keyword-1"],
      user_id: "user-1",
    });
  });

  test("POST returns 400 for invalid JSON bodies", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "INVALID_REQUEST",
      },
    });
    expect(mockedCreateGoal).not.toHaveBeenCalled();
    expect(mockedGetGoals).not.toHaveBeenCalled();
  });
});
