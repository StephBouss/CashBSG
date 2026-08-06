import { describe, expect, it } from "vitest";
import { goalProgressPct, isGoalAchieved } from "@/lib/goalsProgress";

describe("goalProgressPct", () => {
  it("computes a rounded percentage", () => {
    expect(goalProgressPct(2500, 10000)).toBe(25);
  });

  it("returns 0 when the target is 0", () => {
    expect(goalProgressPct(500, 0)).toBe(0);
  });

  it("can exceed 100 when the goal is overshot", () => {
    expect(goalProgressPct(12000, 10000)).toBe(120);
  });
});

describe("isGoalAchieved", () => {
  it("is false while below target", () => {
    expect(isGoalAchieved(9999, 10000)).toBe(false);
  });

  it("is true once the target is reached exactly", () => {
    expect(isGoalAchieved(10000, 10000)).toBe(true);
  });

  it("is true once the target is exceeded", () => {
    expect(isGoalAchieved(15000, 10000)).toBe(true);
  });
});
