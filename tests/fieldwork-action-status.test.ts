import { describe, expect, it } from "vitest";
import { fieldworkStageAt } from "../components/fieldwork-action-status";

describe("fieldwork action progress", () => {
  it("advances Aisha's design status with elapsed time", () => {
    expect(fieldworkStageAt("design", 0).label).toContain("approved plan");
    expect(fieldworkStageAt("design", 31).label).toContain("clarity");
  });

  it("provides distinct publication and interview states", () => {
    expect(fieldworkStageAt("publish", 8).label).toContain("consent");
    expect(fieldworkStageAt("approve", 8).label).toContain("Locking");
    expect(fieldworkStageAt("start", 8).label).toContain("consent");
  });
});
