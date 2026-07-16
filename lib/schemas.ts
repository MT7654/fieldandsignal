import { z } from "zod";

const textValue = z.preprocess((value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join("; ");
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return value;
}, z.string().min(1));

const textList = z.preprocess((value) => {
  if (typeof value === "string") return [value];
  return value;
}, z.array(textValue));

export const projectInputSchema = z.object({
  businessQuestion: z.string().min(12).max(2000), businessDescription: z.string().min(12).max(5000),
  industry: z.string().min(2).max(120), geography: z.string().min(2).max(160),
  objective: z.string().max(1000).optional(), researchMode: z.enum(["secondary", "primary_secondary"]),
});
export const researchPlanSchema = z.object({
  decisionStatement: textValue, objectives: textList.pipe(z.array(z.string()).min(2)), hypotheses: textList,
  secondaryWorkstreams: z.array(z.object({ title: textValue, evidenceExpected: textList })),
  evidenceGaps: textList, primaryMethodology: textValue, targetRespondents: textValue,
  sampleSizeRecommendation: textValue, timeline: textValue, estimatedOperationalCosts: textValue,
  deliverables: textList, limitations: textList,
});
export const surveySubmissionSchema = z.object({ token: z.string().min(10).max(128), consent: z.literal(true), answers: z.record(z.string(), z.unknown()) });
export const interviewConsentSchema = z.object({ token: z.string().min(10).max(128), consent: z.literal(true), disclosureVersion: z.string() });
export const evidenceLinkSchema = z.object({ claimId: z.string(), evidenceType: z.enum(["source","survey_result","transcript_excerpt"]), evidenceId: z.string(), interpretation: z.string().optional() });
export const briefSchema = z.object({ executiveRecommendation: z.string(), rationale: z.array(z.string()), risks: z.array(z.string()), changeConditions: z.array(z.string()), nextActions: z.array(z.string()), evidenceLinks: z.array(evidenceLinkSchema) });
