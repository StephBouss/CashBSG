import { describe, expect, it } from "vitest";
import { computeSuggestedContribution } from "@/lib/savingsContribution";

const incomes = [
  { categoryId: "salaire", montant: 200000 },
  { categoryId: "salaire", montant: 50000 },
  { categoryId: "freelance", montant: 30000 },
];

describe("computeSuggestedContribution", () => {
  it("returns 0 for a fixed-amount account", () => {
    expect(computeSuggestedContribution(incomes, { mode: "montant", pourcentage: null, categoryId: null })).toBe(0);
  });

  it("returns 0 when pourcentage is unset", () => {
    expect(computeSuggestedContribution(incomes, { mode: "pourcentage", pourcentage: null, categoryId: null })).toBe(0);
  });

  it("computes a share of all incomes when no category is targeted", () => {
    expect(computeSuggestedContribution(incomes, { mode: "pourcentage", pourcentage: 10, categoryId: null })).toBe(28000);
  });

  it("computes a share of only the targeted category's incomes", () => {
    expect(computeSuggestedContribution(incomes, { mode: "pourcentage", pourcentage: 10, categoryId: "salaire" })).toBe(25000);
  });

  it("rounds the result", () => {
    expect(computeSuggestedContribution(incomes, { mode: "pourcentage", pourcentage: 33, categoryId: "freelance" })).toBe(9900);
  });
});
