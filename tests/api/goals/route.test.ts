import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "@/app/api/goals/route";
import { createClient } from "@/lib/supabase/server";
import { createGoal, getGoals } from "@/lib/services/goal.service";
import { buildGoalWithProgress } from "../../factories/goals";
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

  test("GET forwards the authenticated user id and returns 200 on success", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    const goal = buildGoalWithProgress({ user_id: "user-1" });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedGetGoals.mockResolvedValue({
      data: [goal],
      error: null,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockedGetGoals).toHaveBeenCalledWith("user-1");
    await expect(response.json()).resolves.toEqual({
      data: [goal],
      error: null,
    });
  });

  test("GET maps a NOT_FOUND service error to 404", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedGetGoals.mockResolvedValue({
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Ziel wurde nicht gefunden.",
      },
    });

    const response = await GET();

    expect(response.status).toBe(404);
  });

  test("POST returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ label: "Klausur" }),
      })
    );

    expect(response.status).toBe(401);
    expect(mockedCreateGoal).not.toHaveBeenCalled();
  });

  test("POST attaches user_id and returns 201 on success", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateGoal.mockResolvedValue({
      data: buildGoalWithProgress({
        id: "goal-1",
        user_id: "user-1",
        label: "Klausur",
      }),
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

  test("POST maps validation-style service errors to 400", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateGoal.mockResolvedValue({
      data: null,
      error: {
        code: "KEYWORD_VALIDATION_FAILED",
        message: "Keywords konnten nicht geprüft werden.",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ label: "Klausur" }),
      })
    );

    expect(response.status).toBe(400);
  });

  test("POST maps unknown service errors to 500", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateGoal.mockResolvedValue({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Ziel konnte nicht erstellt werden.",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ label: "Klausur" }),
      })
    );

    expect(response.status).toBe(500);
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
  });
});
