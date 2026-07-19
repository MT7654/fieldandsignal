import { afterEach, describe, expect, it } from "vitest";
import { publicUrl, resolvePublicOrigin } from "@/lib/public-url";

const originalEnv = { ...process.env };
afterEach(() => { process.env = { ...originalEnv }; });

describe("public respondent URL resolution", () => {
  it("prefers the deployed request origin over a stale localhost setting", () => {
    expect(resolvePublicOrigin({ requestUrl: "https://fieldandsignal.vercel.app/api/fieldwork/status", configuredOrigin: "http://localhost:3000" })).toBe("https://fieldandsignal.vercel.app");
  });

  it("uses proxy headers when the internal request URL is local", () => {
    const headers = new Headers({ "x-forwarded-host": "fieldandsignal.vercel.app", "x-forwarded-proto": "https" });
    expect(resolvePublicOrigin({ requestUrl: "http://localhost:3000/api/fieldwork/status", headers })).toBe("https://fieldandsignal.vercel.app");
  });

  it("uses Vercel's production domain when no public request origin is available", () => {
    expect(resolvePublicOrigin({ configuredOrigin: "http://localhost:3000", vercelProductionUrl: "fieldandsignal.vercel.app" })).toBe("https://fieldandsignal.vercel.app");
  });

  it("constructs an app-hosted public route", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "fieldandsignal.vercel.app";
    expect(publicUrl("/survey/token-123")).toBe("https://fieldandsignal.vercel.app/survey/token-123");
  });
});
