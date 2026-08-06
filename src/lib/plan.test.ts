import { describe, expect, it } from "vitest";
import { canAccessGoals, canAccessFullHistory, effectivePlan, AI_MESSAGE_QUOTA, PLAN_LABELS } from "@/lib/plan";

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

describe("effectivePlan", () => {
  it("downgrades a paid plan without expiry date (P0.9 — NULL n'est plus un accès à vie)", () => {
    expect(effectivePlan("pro", null)).toBe("free");
  });

  it("keeps a paid plan that has not expired yet", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(effectivePlan("essentiel", future)).toBe("essentiel");
  });

  it("downgrades a paid plan whose expiry date is in the past", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(effectivePlan("pro", past)).toBe("free");
  });

  it("leaves the free plan untouched regardless of expiry", () => {
    expect(effectivePlan("free", null)).toBe("free");
  });
});

describe("AI_MESSAGE_QUOTA", () => {
  it("has an increasing quota for every plan", () => {
    expect(AI_MESSAGE_QUOTA.free).toBeLessThan(AI_MESSAGE_QUOTA.essentiel);
    expect(AI_MESSAGE_QUOTA.essentiel).toBeLessThanOrEqual(AI_MESSAGE_QUOTA.pro);
  });
});
