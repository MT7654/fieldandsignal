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
  secondaryWorkstreams: z.array(z.object({ title: textValue, evidenceExpected: textList, rationale: textValue.optional() })),
  evidenceGaps: textList, primaryMethodology: textValue, primaryRationale: textValue.optional(), targetRespondents: textValue,
  sampleSizeRecommendation: textValue, timeline: textValue, estimatedOperationalCosts: textValue,
  costBreakdown: z.object({
    currency: textValue,
    items: z.array(z.object({ category: textValue, description: textValue, amount: z.coerce.number().nonnegative(), basis: textValue })).min(1),
    total: z.coerce.number().nonnegative(),
    assumptions: textList,
  }).optional(),
  deliverables: textList, limitations: textList,
});

export const planRevisionRequestSchema = z.object({
  currentPlan: researchPlanSchema,
  project: projectInputSchema.passthrough().optional(),
  revisionRequest: z.object({
    budgetPreference: z.enum(["maintain", "reduce", "cap"]),
    budgetCap: z.string().max(80).optional(),
    timingPreference: z.enum(["maintain", "faster", "specific_date"]),
    targetDate: z.string().max(80).optional(),
    businessPriorities: z.string().min(3).max(1500),
    scopeTradeoffs: z.string().max(1500).optional(),
    newContext: z.string().max(2000).optional(),
  }),
});

export const secondarySynthesisSchema = z.object({
  emergingView: textValue,
  agreements: textList,
  contradictions: textList,
  remainingGaps: textList,
  claims: z.array(z.object({ statement: textValue, sourceIds: textList })).max(5),
});
export const surveySubmissionSchema = z.object({ token: z.string().min(10).max(128), consent: z.literal(true), responseKey: z.string().uuid().optional(), answers: z.record(z.string(), z.unknown()) });
export const interviewConsentSchema = z.object({ token: z.string().min(10).max(128), consent: z.literal(true), disclosureVersion: z.string(), retainAudio: z.boolean().optional().default(false) });
export const evidenceLinkSchema = z.object({ claimId: z.string(), evidenceType: z.enum(["source","survey_result","transcript_excerpt"]), evidenceId: z.string(), interpretation: z.string().optional() });
export const briefSchema = z.object({ executiveRecommendation: z.string(), rationale: z.array(z.string()), risks: z.array(z.string()), changeConditions: z.array(z.string()), nextActions: z.array(z.string()), evidenceLinks: z.array(evidenceLinkSchema) });

export const generatedInstrumentSchema = z.object({
  survey: z.object({
    title: textValue,
    introduction: textValue,
    estimatedMinutes: z.coerce.number().int().min(2).max(15),
    questions: z.array(z.object({
      type: z.enum(["single", "multiple", "rating", "text"]),
      question: textValue,
      options: z.array(textValue).optional().default([]),
      required: z.boolean().default(false),
      rationale: textValue,
    })).min(6).max(14),
  }),
  interviewGuide: z.object({
    title: textValue,
    introduction: textValue,
    objectives: textList.pipe(z.array(z.string()).min(2).max(8)),
    questions: z.array(z.object({ question: textValue, rationale: textValue, probes: textList.optional().default([]) })).min(5).max(10),
  }),
});

export const analysisOutputSchema = z.object({
  overview: textValue,
  findings: z.array(z.object({
    type: z.enum(["secondary", "survey", "interview", "integrated"]),
    title: textValue,
    observation: textValue,
    interpretation: textValue,
    implication: textValue,
    confidence: z.enum(["High", "Medium", "Directional"]),
    evidenceIds: textList,
    limitations: textList,
  })).min(2).max(8),
  agreements: textList,
  contradictions: textList,
  remainingGaps: textList,
});

export const decisionBriefSchema = z.object({
  title: textValue,
  executiveRecommendation: textValue,
  rationale: textList,
  evidenceSummary: z.array(z.object({ claim: textValue, support: textValue, evidenceIds: textList })).min(2),
  risks: textList,
  changeConditions: textList,
  nextActions: textList,
  methodology: textValue,
  limitations: textList,
});
