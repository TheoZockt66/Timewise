import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoalProgressBar } from "@/components/goals/GoalProgressBar";

describe("GoalProgressBar", () => {
  test("renders human-readable progress values and clamps bar width", () => {
    const { container } = render(
      <GoalProgressBar loggedMinutes={90} targetMinutes={120} percentage={140} />
    );

    expect(screen.getByText("1h 30m von 2h")).toBeInTheDocument();
    expect(screen.getByText("140%")).toBeInTheDocument();
    expect(container.querySelector("div[style*='width: 100%']")).toBeInTheDocument();
  });
});
