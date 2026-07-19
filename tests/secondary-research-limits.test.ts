import { describe, expect, it } from "vitest";
import { SECONDARY_RESEARCH_LIMITS } from "../lib/secondary-research-types";

describe("secondary research limits", () => {
  it("keeps the faster retrieval pass sufficient for downstream synthesis", () => {
    expect(SECONDARY_RESEARCH_LIMITS).toEqual({ queries: 3, pageFetches: 12, sources: 6 });
    expect(SECONDARY_RESEARCH_LIMITS.sources).toBeGreaterThanOrEqual(4);
    expect(SECONDARY_RESEARCH_LIMITS.pageFetches).toBeGreaterThanOrEqual(SECONDARY_RESEARCH_LIMITS.sources);
  });
});
