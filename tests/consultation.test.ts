import { describe, expect, it } from "vitest";
import { directorConsultationInstructions } from "@/lib/agents";

describe("John's consultation guidance", () => {
  it("asks client-answerable questions and explicitly permits uncertainty", () => {
    expect(directorConsultationInstructions).toContain("current knowledge");
    expect(directorConsultationInstructions).toContain("I don't know");
    expect(directorConsultationInstructions).toContain("Do not require exact financial models");
    expect(directorConsultationInstructions).toContain("Do not ask the client to solve the research problem");
  });
});
