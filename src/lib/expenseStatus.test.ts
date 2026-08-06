import { describe, expect, it } from "vitest";
import { effectiveExpenseStatus } from "@/lib/expenseStatus";

const reference = new Date(2026, 7, 6); // 6 août 2026

describe("effectiveExpenseStatus", () => {
  it("bascule en retard une échéance d'hier non payée", () => {
    expect(effectiveExpenseStatus({ statut: "a_venir", dateEcheance: "2026-08-05" }, reference)).toBe(
      "en_retard"
    );
  });

  it("laisse à venir une échéance future", () => {
    expect(effectiveExpenseStatus({ statut: "a_venir", dateEcheance: "2026-08-10" }, reference)).toBe(
      "a_venir"
    );
  });

  it("laisse à venir une échéance du jour même", () => {
    expect(effectiveExpenseStatus({ statut: "a_venir", dateEcheance: "2026-08-06" }, reference)).toBe(
      "a_venir"
    );
  });

  it("reste en retard une échéance du mois précédent toujours impayée", () => {
    expect(effectiveExpenseStatus({ statut: "en_retard", dateEcheance: "2026-06-15" }, reference)).toBe(
      "en_retard"
    );
  });

  it("ne repasse jamais en retard une dépense payée, même très en retard", () => {
    expect(effectiveExpenseStatus({ statut: "paye", dateEcheance: "2026-01-01" }, reference)).toBe("paye");
  });
});
