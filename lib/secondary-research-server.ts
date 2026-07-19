import "server-only";

import { hfStructured } from "./huggingface";
import { inferenceConfigured } from "./env";
import { secondarySynthesisSchema } from "./schemas";
import { fetchEvidenceCandidate, searchWithOxylabs } from "./oxylabs";
import { extractResearchTerms } from "./research-web-utils";
import type { ResearchPlan } from "./research-plan";
import { SECONDARY_RESEARCH_LIMITS, type EvidenceSource, type ResearchCandidate, type ResearchQuery, type SecondarySynthesis, type StoredSecondaryResearchState } from "./secondary-research-types";

const RESEARCH_LIMITS = SECONDARY_RESEARCH_LIMITS;

export function buildResearchQueries(plan: ResearchPlan, project: { industry?: string | null; geography?: string | null; business_question?: string | null }) {
  const geographyTerms = extractResearchTerms(project.geography, 5);
  const industryTerms = extractResearchTerms(project.industry, 6);
  const decisionTerms = extractResearchTerms(project.business_question, 14).filter((term) => !geographyTerms.includes(term));
  const geography = project.geography ? `"${project.geography}"` : "";
  const queries: ResearchQuery[] = plan.secondaryWorkstreams.slice(0, 5).map((workstream) => {
    const workstreamTerms = extractResearchTerms(`${workstream.title} ${workstream.evidenceExpected.join(" ")}`, 10);
    const topicTerms = [...new Set([...industryTerms, ...decisionTerms, ...workstreamTerms])].slice(0, 18);
    const searchTerms = [...new Set([...industryTerms.slice(0, 3), ...workstreamTerms.slice(0, 7), ...decisionTerms.slice(0, 3)])];
    return {
      query: `${geography} ${searchTerms.join(" ")} statistics benchmark`.replace(/\s+/g, " ").trim().slice(0, 220),
      workstream: workstream.title,
      expectedEvidence: workstream.evidenceExpected,
      geographyTerms,
      topicTerms,
      status: "pending" as const,
    };
  });
  if (queries.length < RESEARCH_LIMITS.queries && project.business_question) queries.push({
    query: `${geography} ${[...industryTerms, ...decisionTerms].slice(0, 12).join(" ")} comparison`.replace(/\s+/g, " ").trim().slice(0, 220),
    workstream: "Decision context",
    expectedEvidence: [plan.decisionStatement],
    geographyTerms,
    topicTerms: [...new Set([...industryTerms, ...decisionTerms])].slice(0, 18),
    status: "pending",
  });
  return queries.slice(0, RESEARCH_LIMITS.queries);
}

function dedupeCandidates(existing: ResearchCandidate[], incoming: ResearchCandidate[]) {
  const seen = new Set(existing.map((candidate) => canonicalUrl(candidate.url)));
  const next = [...existing];
  for (const candidate of incoming) {
    const key = canonicalUrl(candidate.url);
    if (!seen.has(key)) { seen.add(key); next.push(candidate); }
  }
  return next.sort((a, b) => (b.searchRelevanceScore ?? 0) - (a.searchRelevanceScore ?? 0)).slice(0, 40);
}

function canonicalUrl(value: string) {
  try { const url = new URL(value); url.hash = ""; ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach((key) => url.searchParams.delete(key)); return url.toString(); }
  catch { return value; }
}

function deterministicSynthesis(sources: EvidenceSource[], gaps: string[]): SecondarySynthesis {
  const strongest = [...sources].sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  return {
    emergingView: strongest.length ? `Maya found ${strongest.length} relevant public sources. The strongest available evidence is concentrated around ${[...new Set(strongest.map((source) => source.workstream))].join(", ")}.` : "Maya did not find enough inspectable public evidence to form an emerging view.",
    agreements: strongest.slice(0, 3).map((source) => `${source.id}: ${source.excerpt}`),
    contradictions: ["No contradiction is asserted unless it is visible across the retained source excerpts."],
    remainingGaps: gaps,
    claims: strongest.slice(0, 4).map((source) => ({ statement: source.supportedClaim, sourceIds: [source.id] })),
  };
}

async function synthesize(state: StoredSecondaryResearchState) {
  const compactInput = {
    decision: state.plan.decisionStatement,
    evidenceGaps: state.plan.evidenceGaps,
    sources: state.sources.map(({ id, title, publisher, publicationDate, excerpt, workstream, reliability }) => ({ id, title, publisher, publicationDate, excerpt, workstream, reliability })),
  };
  const estimatedInputTokens = Math.ceil(JSON.stringify(compactInput).length / 4);
  if (!inferenceConfigured || state.sources.length < 2) return { synthesis: deterministicSynthesis(state.sources, state.plan.evidenceGaps), llmCalls: 0, estimatedInputTokens: 0 };
  try {
    const synthesis = await hfStructured(
      "You are Maya Chen, an evidence-disciplined secondary research analyst. Synthesize only the supplied source excerpts. Every claim must cite supplied source IDs. Do not invent figures, sources or URLs. Preserve uncertainty and unresolved evidence gaps.",
      compactInput,
      secondarySynthesisSchema,
      "{emergingView:string,agreements:string[],contradictions:string[],remainingGaps:string[],claims:{statement:string,sourceIds:string[]}[]}",
      { maxTokens: 700, attempts: 1 },
    ) as SecondarySynthesis;
    return { synthesis, llmCalls: 1, estimatedInputTokens };
  } catch {
    return { synthesis: deterministicSynthesis(state.sources, state.plan.evidenceGaps), llmCalls: 1, estimatedInputTokens };
  }
}

export async function runResearchStep(session: Awaited<ReturnType<typeof import("./research-session").resolveResearchSession>>) {
  const { db, task, projectId } = session;
  let state = session.state;
  if (state.status === "complete") return state;

  if (state.phase === "searching") {
    const index = state.queries.findIndex((query) => query.status === "pending");
    if (index >= 0) {
      const query = state.queries[index];
      let found: ResearchCandidate[] = [];
      let status: ResearchQuery["status"] = "complete";
      try { found = await searchWithOxylabs(query.query, query.workstream, query.expectedEvidence, query.geographyTerms ?? [], query.topicTerms ?? []); }
      catch { status = "failed"; }
      const queries = state.queries.map((item, itemIndex) => itemIndex === index ? { ...item, status } : item);
      const candidates = dedupeCandidates(state.candidates, found);
      const moreQueries = queries.some((item) => item.status === "pending");
      state = { ...state, queries, candidates, phase: moreQueries ? "searching" : "reviewing", currentActivity: moreQueries ? `Searching for ${queries.find((item) => item.status === "pending")?.workstream}` : `Opening ${candidates.length} candidate sources`, usage: { ...state.usage, searchRequests: state.usage.searchRequests + 1, proxyRequests: state.usage.proxyRequests + 1 } };
    } else state = { ...state, phase: "reviewing", currentActivity: "Opening candidate sources" };
  } else if (state.phase === "reviewing") {
    const index = state.candidates.findIndex((candidate) => candidate.status === "pending");
    const stopReviewing = index < 0 || state.usage.pageFetches >= RESEARCH_LIMITS.pageFetches || state.sources.length >= RESEARCH_LIMITS.sources;
    if (stopReviewing) state = { ...state, phase: "synthesizing", currentActivity: "Comparing retained evidence and remaining gaps" };
    else {
      const candidate = state.candidates[index];
      let accepted: EvidenceSource | undefined;
      let rejectionReason: string | undefined;
      try { accepted = await fetchEvidenceCandidate(candidate, state.sources.length + 1); }
      catch (error) { rejectionReason = error instanceof Error ? error.message : "Source could not be inspected"; }
      const candidates = state.candidates.map((item, itemIndex) => itemIndex === index ? { ...item, status: accepted ? "accepted" as const : "rejected" as const, rejectionReason } : item);
      const sources = accepted ? [...state.sources, accepted] : state.sources;
      if (accepted) await db.from("sources").insert({ project_id: projectId, title: accepted.title, publisher: accepted.publisher, url: accepted.url, publication_date: normalizeDate(accepted.publicationDate), retrieved_at: accepted.retrievedAt, excerpt: accepted.excerpt, supported_claim: accepted.supportedClaim, reliability_note: `${accepted.reliability} (${accepted.reliabilityScore}/10): ${accepted.reliabilityNote}` });
      const pending = candidates.some((item) => item.status === "pending") && state.usage.pageFetches + 1 < RESEARCH_LIMITS.pageFetches && sources.length < RESEARCH_LIMITS.sources;
      state = { ...state, candidates, sources, phase: pending ? "reviewing" : "synthesizing", currentActivity: pending ? `Checking ${candidates.find((item) => item.status === "pending")?.title}` : "Comparing retained evidence and remaining gaps", usage: { ...state.usage, pageFetches: state.usage.pageFetches + 1, proxyRequests: state.usage.proxyRequests + 1 } };
    }
  } else if (state.phase === "synthesizing") {
    const result = await synthesize(state);
    const completedAt = new Date().toISOString();
    state = { ...state, status: "complete", phase: "complete", currentActivity: "Secondary research complete", synthesis: result.synthesis, completedAt, usage: { ...state.usage, llmCalls: result.llmCalls, estimatedInputTokens: result.estimatedInputTokens, maxOutputTokens: result.llmCalls ? 700 : 0 } };
    await db.from("research_projects").update({ status: "research", current_phase: state.researchMode === "secondary" ? "analysis" : "primary_research", updated_at: completedAt }).eq("id", projectId);
  }

  const progress = calculateProgress(state);
  const { error } = await db.from("agent_tasks").update({ status: state.status, progress, output_json: state, started_at: state.startedAt, completed_at: state.completedAt ?? null }).eq("id", task.id);
  if (error) throw error;
  return state;
}

function normalizeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function calculateProgress(state: StoredSecondaryResearchState) {
  if (state.phase === "complete") return 100;
  if (state.phase === "synthesizing") return 88;
  if (state.phase === "reviewing") return Math.min(85, 38 + state.usage.pageFetches * 6);
  const complete = state.queries.filter((query) => query.status !== "pending").length;
  return Math.min(35, 5 + complete * 8);
}
