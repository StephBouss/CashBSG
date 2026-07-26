import { describe, expect, it } from "vitest";
import { canAccessGoals, canAccessFullHistory, PLAN_LABELS } from "@/lib/plan";

describe("canAccessGoals", () => {
  it("denies the free plan", () => {
    expect(canAccessGoals("free")).toBe(false);
  });

  it("allows the essentiel and pro plans", () => {
    expect(canAccessGoals("essentiel")).toBe(true);
    expect(canAccessGoals("pro")).toBe(true);
  });
});

describe("canAccessFullHistory", () => {
  it("denies the free plan", () => {
    expect(canAccessFullHistory("free")).toBe(false);
  });

  it("allows the essentiel and pro plans", () => {
    expect(canAccessFullHistory("essentiel")).toBe(true);
    expect(canAccessFullHistory("pro")).toBe(true);
  });
});

describe("PLAN_LABELS", () => {
  it("has a human-readable label for every plan", () => {
    expect(PLAN_LABELS.free).toBe("Iwadu Free");
    expect(PLAN_LABELS.essentiel).toBe("Iwadu Essentiel");
    expect(PLAN_LABELS.pro).toBe("Iwadu Pro");
  });
});
