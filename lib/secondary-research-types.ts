import type { ResearchPlan } from "./research-plan";

export const SECONDARY_RESEARCH_LIMITS = { queries: 3, pageFetches: 12, sources: 6 } as const;

export type ResearchQuery = {
  query: string;
  workstream: string;
  expectedEvidence: string[];
  geographyTerms?: string[];
  topicTerms?: string[];
  status: "pending" | "complete" | "failed";
};

export type ResearchCandidate = {
  title: string;
  url: string;
  snippet: string;
  workstream: string;
  expectedEvidence: string[];
  geographyTerms?: string[];
  topicTerms?: string[];
  searchRelevanceScore?: number;
  discoveryProvider?: "openai" | "oxylabs";
  webEvidence?: string;
  webPublisher?: string;
  webPublicationDate?: string;
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string;
};

export type EvidenceSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publicationDate?: string;
  retrievedAt: string;
  excerpt: string;
  supportedClaim: string;
  reliability: "High" | "Medium" | "Directional";
  reliabilityScore: number;
  reliabilityNote: string;
  workstream: string;
  dataPoints: string[];
};

export type SecondarySynthesis = {
  emergingView: string;
  agreements: string[];
  contradictions: string[];
  remainingGaps: string[];
  claims: { statement: string; sourceIds: string[] }[];
};

export type SecondaryResearchState = {
  status: "queued" | "in_progress" | "complete" | "failed";
  phase: "queued" | "searching" | "reviewing" | "synthesizing" | "complete" | "failed";
  currentActivity: string;
  plan: Pick<ResearchPlan, "decisionStatement" | "secondaryWorkstreams" | "evidenceGaps">;
  researchMode: "secondary" | "primary_secondary";
  queries: ResearchQuery[];
  candidates: ResearchCandidate[];
  sources: EvidenceSource[];
  synthesis?: SecondarySynthesis;
  usage: {
    searchRequests: number;
    pageFetches: number;
    proxyRequests: number;
    llmCalls: number;
    estimatedInputTokens: number;
    maxOutputTokens: number;
  };
  startedAt?: string;
  completedAt?: string;
  error?: string;
};

export type StoredSecondaryResearchState = SecondaryResearchState & { accessHash: string };
