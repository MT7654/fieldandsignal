import { z } from "zod";

export const projectInputSchema = z.object({
  businessQuestion: z.string().min(12).max(2000), businessDescription: z.string().min(12).max(5000),
  industry: z.string().min(2).max(120), geography: z.string().min(2).max(160),
  objective: z.string().max(1000).optional(), researchMode: z.enum(["secondary", "primary_secondary"]),
});
export const researchPlanSchema = z.object({
  decisionStatement: z.string(), objectives: z.array(z.string()).min(2), hypotheses: z.array(z.string()),
  secondaryWorkstreams: z.array(z.object({ title: z.string(), evidenceExpected: z.array(z.string()) })),
  evidenceGaps: z.array(z.string()), primaryMethodology: z.string(), targetRespondents: z.string(),
  sampleSizeRecommendation: z.string(), timeline: z.string(), estimatedOperationalCosts: z.string(),
  deliverables: z.array(z.string()), limitations: z.array(z.string()),
});
export const surveySubmissionSchema = z.object({ token: z.string().min(10).max(128), consent: z.literal(true), answers: z.record(z.string(), z.unknown()) });
export const interviewConsentSchema = z.object({ token: z.string().min(10).max(128), consent: z.literal(true), disclosureVersion: z.string() });
export const evidenceLinkSchema = z.object({ claimId: z.string(), evidenceType: z.enum(["source","survey_result","transcript_excerpt"]), evidenceId: z.string(), interpretation: z.string().optional() });
export const briefSchema = z.object({ executiveRecommendation: z.string(), rationale: z.array(z.string()), risks: z.array(z.string()), changeConditions: z.array(z.string()), nextActions: z.array(z.string()), evidenceLinks: z.array(evidenceLinkSchema) });
