export type CostLineItem = {
  category: string;
  description: string;
  amount: number;
  basis: string;
};

export type ResearchPlan = {
  decisionStatement: string;
  objectives: string[];
  hypotheses: string[];
  secondaryWorkstreams: { title: string; evidenceExpected: string[]; rationale?: string }[];
  evidenceGaps: string[];
  primaryMethodology: string;
  primaryRationale?: string;
  targetRespondents: string;
  sampleSizeRecommendation: string;
  timeline: string;
  estimatedOperationalCosts: string;
  costBreakdown?: {
    currency: string;
    items: CostLineItem[];
    total: number;
    assumptions: string[];
  };
  deliverables: string[];
  limitations: string[];
};

export const fallbackCostBreakdown: NonNullable<ResearchPlan["costBreakdown"]> = {
  currency: "S$",
  items: [
    {
      category: "Secondary research",
      description: "AI retrieval, synthesis, source verification and evidence traceability",
      amount: 450,
      basis: "Indicative model, search and quality-control usage",
    },
    {
      category: "Source access",
      description: "Contingency for licensed reports, datasets or paywalled sources",
      amount: 250,
      basis: "Allowance; charged only when approved and used",
    },
    {
      category: "Primary research design",
      description: "Survey and interview guide design, testing and approval setup",
      amount: 400,
      basis: "One survey and one interview guide",
    },
    {
      category: "Recruitment & incentives",
      description: "Participant sourcing and compensation",
      amount: 1200,
      basis: "Indicative allowance; varies by audience and incidence rate",
    },
    {
      category: "Fieldwork operations",
      description: "Survey hosting, AI-moderated interviews and response processing",
      amount: 450,
      basis: "Directional sample and seven interviews",
    },
    {
      category: "Analysis & brief",
      description: "Integrated analysis, evidence checks and decision-ready reporting",
      amount: 250,
      basis: "One final brief and evidence library",
    },
  ],
  total: 3000,
  assumptions: [
    "Figures are planning estimates, not charges already incurred.",
    "Secondary research is lower-cost because it is AI-led, but may still require licensed sources and verification.",
    "Recruitment and incentives are the largest variable costs and require approval before commitment.",
  ],
};

export function getCostBreakdown(plan: ResearchPlan) {
  if (plan.costBreakdown?.items?.length) return plan.costBreakdown;

  // Older saved plans predate structured costs. Scale the transparent fallback
  // to the largest amount in their summary so the table never contradicts it.
  const amounts = [...plan.estimatedOperationalCosts.matchAll(/[\d,]+(?:\.\d+)?/g)]
    .map((match) => Number(match[0].replaceAll(",", "")))
    .filter(Number.isFinite);
  const inferredTotal = Math.max(...amounts, 0);
  if (!inferredTotal) return fallbackCostBreakdown;
  const scale = inferredTotal / fallbackCostBreakdown.total;
  const items = fallbackCostBreakdown.items.map((item, index, source) => ({
    ...item,
    amount: index === source.length - 1
      ? inferredTotal - source.slice(0, -1).reduce((sum, entry) => sum + Math.round(entry.amount * scale), 0)
      : Math.round(item.amount * scale),
  }));
  return { ...fallbackCostBreakdown, items, total: inferredTotal };
}
