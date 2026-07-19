import { describe, expect, it } from "vitest";
import { analysisStageAt } from "@/components/analysis-generation-status";

describe("Sofia analysis progress", () => {
  it("advances through evidence-integration stages", () => {
    expect(analysisStageAt(0).label).toContain("inventory");
    expect(analysisStageAt(18).label).toContain("transcript");
    expect(analysisStageAt(80).label).toContain("Still working");
  });
});
