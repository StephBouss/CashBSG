import { describe, expect, it } from "vitest";
import { cleanErrorUrl } from "@/lib/errorLogging";

describe("cleanErrorUrl (P1.4)", () => {
  it("strips a query string containing an access_token", () => {
    expect(
      cleanErrorUrl("https://app.iwaducash.com/reinitialiser-mot-de-passe?access_token=SECRET&type=recovery")
    ).toBe("https://app.iwaducash.com/reinitialiser-mot-de-passe");
  });

  it("strips a fragment containing a refresh_token", () => {
    expect(cleanErrorUrl("https://app.iwaducash.com/login#refresh_token=SECRET&expires_in=3600")).toBe(
      "https://app.iwaducash.com/login"
    );
  });

  it("strips a code query param (flux OAuth/PKCE)", () => {
    expect(cleanErrorUrl("https://app.iwaducash.com/app?code=abc123")).toBe("https://app.iwaducash.com/app");
  });

  it("leaves an already-clean URL untouched", () => {
    expect(cleanErrorUrl("https://app.iwaducash.com/app/dashboard")).toBe(
      "https://app.iwaducash.com/app/dashboard"
    );
  });

  it("falls back to a manual split when the string isn't a valid URL", () => {
    expect(cleanErrorUrl("/app/dashboard?token=SECRET#frag")).toBe("/app/dashboard");
  });
});
