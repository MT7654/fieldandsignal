import { describe, expect, it } from "vitest";
import { formatGenerationElapsed, generationStageAt } from "@/components/plan-generation-status";

describe("plan generation status", () => {
  it("advances through honest activity stages as time passes", () => {
    expect(generationStageAt("create", 0).label).toContain("Reviewing");
    expect(generationStageAt("create", 40).label).toContain("Estimating");
    expect(generationStageAt("create", 95).label).toContain("Still working");
  });

  it("formats elapsed time for short and long generations", () => {
    expect(formatGenerationElapsed(9)).toBe("9s");
    expect(formatGenerationElapsed(72)).toBe("1m 12s");
  });
});
