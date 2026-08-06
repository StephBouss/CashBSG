import { describe, expect, it } from "vitest";
import {
  canAccessGoals,
  canAccessFullHistory,
  effectivePlan,
  AI_MESSAGE_QUOTA,
  TRACKER_ENTRY_LIMIT,
  SAVINGS_ACCOUNT_LIMIT,
  PLAN_LABELS,
  PLAN_ORDER,
} from "@/lib/plan";

// P1.2 — ce test contredisait l'implémentation réelle (canAccessGoals
// renvoie toujours true, cf. le commentaire dans plan.ts : gating désactivé
// "à la demande"). Règle produit la plus récente = le code, pas l'audit
// daté : le test est aligné dessus. DÉCISION PRODUIT REQUISE : si le gating
// doit être réactivé (return plan !== "free"), remettre `false` ici et
// ajuster à nouveau les mentions marketing/CGU qui n'en parlent plus.
describe("canAccessGoals", () => {
  it("allows every plan while the gate is disabled by product request", () => {
    for (const plan of PLAN_ORDER) {
      expect(canAccessGoals(plan)).toBe(true);
    }
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

// P1.2 — matrice de tests par plan pour les entitlements majeurs : un plan
// supérieur ne doit jamais être plus restrictif qu'un plan inférieur, ce qui
// aurait immédiatement révélé le type d'incohérence relevé par l'audit
// ("25 messages IA Free dans un endroit et 10 ailleurs"). null = illimité,
// toujours considéré comme la valeur la plus haute.
describe("Matrice d'entitlements par plan (monotone croissante)", () => {
  const rank = (limit: number | null) => (limit === null ? Infinity : limit);

  it("AI_MESSAGE_QUOTA ne décroît jamais quand on monte de plan", () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      expect(AI_MESSAGE_QUOTA[PLAN_ORDER[i]]).toBeGreaterThanOrEqual(AI_MESSAGE_QUOTA[PLAN_ORDER[i - 1]]);
    }
  });

  it("TRACKER_ENTRY_LIMIT ne décroît jamais quand on monte de plan", () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      expect(rank(TRACKER_ENTRY_LIMIT[PLAN_ORDER[i]])).toBeGreaterThanOrEqual(rank(TRACKER_ENTRY_LIMIT[PLAN_ORDER[i - 1]]));
    }
  });

  it("SAVINGS_ACCOUNT_LIMIT (épargne et investissement) ne décroît jamais quand on monte de plan", () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      const prev = SAVINGS_ACCOUNT_LIMIT[PLAN_ORDER[i - 1]];
      const curr = SAVINGS_ACCOUNT_LIMIT[PLAN_ORDER[i]];
      expect(rank(curr.epargne)).toBeGreaterThanOrEqual(rank(prev.epargne));
      expect(rank(curr.investissement)).toBeGreaterThanOrEqual(rank(prev.investissement));
    }
  });

  it("canAccessFullHistory : seul le plan free est restreint", () => {
    for (const plan of PLAN_ORDER) {
      expect(canAccessFullHistory(plan)).toBe(plan !== "free");
    }
  });
});
