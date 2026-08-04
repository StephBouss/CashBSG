import { describe, expect, it } from "vitest";
import { formatMontant, formatDate, formatDateTime } from "@/lib/formatters";

// Intl.NumberFormat("fr-FR") sépare les milliers avec une espace insécable
// fine (U+202F), pas une espace ASCII classique — on référence le caractère
// via son échappement unicode pour éviter toute ambiguïté d'encodage.
const NBSP = " ";

describe("formatMontant", () => {
  it("formats with thousands separators and an FCFA suffix", () => {
    expect(formatMontant(1500000)).toBe(`1${NBSP}500${NBSP}000 FCFA`);
  });

  it("rounds decimal amounts", () => {
    expect(formatMontant(999.6)).toBe(`1${NBSP}000 FCFA`);
  });

  it("formats zero", () => {
    expect(formatMontant(0)).toBe("0 FCFA");
  });

  it("formats negative amounts", () => {
    expect(formatMontant(-2500)).toBe(`-2${NBSP}500 FCFA`);
  });

  it("shows no decimals for FCFA/XAF/XOF", () => {
    expect(formatMontant(1500, "XAF")).toBe(`1${NBSP}500 XAF`);
    expect(formatMontant(1500, "XOF")).toBe(`1${NBSP}500 XOF`);
  });

  it("shows two decimals for currencies that have a subunit", () => {
    expect(formatMontant(1500, "EUR")).toBe(`1${NBSP}500,00 EUR`);
    expect(formatMontant(1500.5, "USD")).toBe(`1${NBSP}500,50 USD`);
  });
});

describe("formatDate", () => {
  it("formats an ISO date in long French format", () => {
    expect(formatDate("2026-07-23")).toBe("23 juillet 2026");
  });
});

describe("formatDateTime", () => {
  it("formats an ISO datetime with both date and time", () => {
    const formatted = formatDateTime("2026-07-23T14:32:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("juillet");
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });
});
