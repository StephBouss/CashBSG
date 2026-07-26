import { describe, expect, it } from "vitest";
import { resolveTimeZone, COUNTRY_TIMEZONES } from "@/lib/timezones";

describe("resolveTimeZone", () => {
  it("resolves a known country code to its IANA timezone", () => {
    expect(resolveTimeZone("MA")).toBe("Africa/Casablanca");
    expect(resolveTimeZone("FR")).toBe("Europe/Paris");
  });

  it("falls back to the browser timezone for an unknown country code", () => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(resolveTimeZone("XX")).toBe(browserTz);
  });

  it("falls back to the browser timezone when no country is given", () => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(resolveTimeZone(null)).toBe(browserTz);
    expect(resolveTimeZone(undefined)).toBe(browserTz);
  });

  it("every mapped timezone is a valid IANA identifier", () => {
    for (const tz of Object.values(COUNTRY_TIMEZONES)) {
      expect(() => new Intl.DateTimeFormat("fr-FR", { timeZone: tz })).not.toThrow();
    }
  });
});
