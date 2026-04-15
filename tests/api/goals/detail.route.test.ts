import { beforeEach, describe, expect, test, vi } from "vitest";
import { DELETE, PUT } from "@/app/api/goals/[id]/route";
import { createClient } from "@/lib/supabase/server";
import { deleteGoal, updateGoal } from "@/lib/services/goal.service";
import { buildGoalWithProgress } from "../../factories/goals";
import { createSupabaseClientMock } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/goal.service", () => ({
  deleteGoal: vi.fn(),
  updateGoal: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedDeleteGoal = vi.mocked(deleteGoal);
const mockedUpdateGoal = vi.mocked(updateGoal);

const context = {
  params: Promise.resolve({ id: "goal-1" }),
};

describe("goals detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("PUT returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await PUT(
      new Request("http://localhost/api/goals/goal-1", {
        method: "PUT",
        body: JSON.stringify({ label: "Update" }),
      }),
      context
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });

  test("PUT forwards id, user id and parsed body to updateGoal", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedUpdateGoal.mockResolvedValue({
      data: buildGoalWithProgress({ id: "goal-1", user_id: "user-1" }),
      error: null,
    });

    const body = { label: "Physik", keyword_ids: ["keyword-1"] };

    const response = await PUT(
      new Request("http://localhost/api/goals/goal-1", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateGoal).toHaveBeenCalledWith("goal-1", "user-1", body);
  });

  test("DELETE maps service not-found errors to 404", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedDeleteGoal.mockResolvedValue({
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Ziel wurde nicht gefunden.",
      },
    });

    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1", {
        method: "DELETE",
      }),
      context
    );

    expect(response.status).toBe(404);
    expect(mockedDeleteGoal).toHaveBeenCalledWith("goal-1", "user-1");
  });
});
