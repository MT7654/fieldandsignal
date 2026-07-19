import { describe, expect, it } from "vitest";
import { briefStageAt } from "@/components/brief-generation-status";

describe("Marcus brief progress", () => {
  it("advances through brief assembly stages", () => {
    expect(briefStageAt(0).label).toContain("findings");
    expect(briefStageAt(31).label).toContain("evidence gaps");
    expect(briefStageAt(80).label).toContain("Still working");
  });
});
