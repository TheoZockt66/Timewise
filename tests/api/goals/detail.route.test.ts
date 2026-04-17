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

function createContext(id = "goal-1") {
  return {
    params: Promise.resolve({ id }),
  };
}

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
      createContext()
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
      createContext()
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateGoal).toHaveBeenCalledWith("goal-1", "user-1", body);
  });

  test("PUT maps service unauthorized errors to 401", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedUpdateGoal.mockResolvedValue({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    });

    const response = await PUT(
      new Request("http://localhost/api/goals/goal-1", {
        method: "PUT",
        body: JSON.stringify({ label: "Update" }),
      }),
      createContext()
    );

    expect(response.status).toBe(401);
  });

  test("PUT maps validation errors to 400", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedUpdateGoal.mockResolvedValue({
      data: null,
      error: {
        code: "KEYWORD_VALIDATION_FAILED",
        message: "Keywords konnten nicht geprüft werden.",
      },
    });

    const response = await PUT(
      new Request("http://localhost/api/goals/goal-1", {
        method: "PUT",
        body: JSON.stringify({ label: "Update" }),
      }),
      createContext()
    );

    expect(response.status).toBe(400);
  });

  test("PUT returns 400 for invalid JSON bodies", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await PUT(
      new Request("http://localhost/api/goals/goal-1", {
        method: "PUT",
        body: "{",
      }),
      createContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "INVALID_REQUEST",
      },
    });
  });

  test("DELETE returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1", {
        method: "DELETE",
      }),
      createContext()
    );

    expect(response.status).toBe(401);
    expect(mockedDeleteGoal).not.toHaveBeenCalled();
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
      createContext()
    );

    expect(response.status).toBe(404);
    expect(mockedDeleteGoal).toHaveBeenCalledWith("goal-1", "user-1");
  });

  test("DELETE maps unhandled service errors to 500", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedDeleteGoal.mockResolvedValue({
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Ziel konnte nicht gelöscht werden.",
      },
    });

    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1", {
        method: "DELETE",
      }),
      createContext()
    );

    expect(response.status).toBe(500);
  });
});
