import { describe, expect, it } from "vitest";
import { categoryColor, categoryIcon } from "@/lib/categoryStyle";

describe("categoryColor", () => {
  it("returns the stored couleur when provided", () => {
    expect(categoryColor("Alimentation", "#123456")).toBe("#123456");
  });

  it("returns a deterministic color when none is stored", () => {
    const a = categoryColor("Alimentation");
    const b = categoryColor("Alimentation");
    expect(a).toBe(b);
  });

  it("returns a value from the palette for an unknown category name", () => {
    const color = categoryColor("Catégorie totalement inconnue xyz");
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe("categoryIcon", () => {
  it("returns the stored icone when provided", () => {
    expect(categoryIcon("Alimentation", "custom-icon")).toBe("custom-icon");
  });

  it("matches transport-related keywords", () => {
    expect(categoryIcon("Transport")).toBe("bus");
  });

  it("matches nourriture/alimentation keywords", () => {
    expect(categoryIcon("Nourriture")).toBe("shopping-bag");
  });

  it("falls back to a generic icon for unmatched names", () => {
    expect(categoryIcon("Catégorie mystère")).toBe("dollar-sign");
  });
});
