import { describe, expect, it } from "vitest";
import { monthRange } from "@/lib/month";

describe("monthRange", () => {
  it("returns the first and last day of the given month", () => {
    const { start, end } = monthRange(new Date(2026, 6, 15)); // 15 juillet 2026
    expect(start).toBe("2026-07-01");
    expect(end).toBe("2026-07-31");
  });

  it("handles a leap-year February correctly", () => {
    const { start, end } = monthRange(new Date(2028, 1, 10)); // février 2028 (bissextile)
    expect(start).toBe("2028-02-01");
    expect(end).toBe("2028-02-29");
  });

  it("handles a non-leap-year February correctly", () => {
    const { end } = monthRange(new Date(2026, 1, 10)); // février 2026
    expect(end).toBe("2026-02-28");
  });

  it("defaults to the current month when no reference date is given", () => {
    const { start } = monthRange();
    expect(start).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
