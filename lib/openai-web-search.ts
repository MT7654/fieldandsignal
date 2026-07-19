import "server-only";

import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "./env";
import { getOpenAIClient } from "./inference";
import { isSafePublicUrl } from "./research-web-utils";
import { searchWithOxylabs } from "./oxylabs";

const sourceDiscoverySchema = z.object({
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    evidence: z.string(),
    publisher: z.string(),
    publicationDate: z.string().nullable(),
  })).min(3).max(6),
});

export async function searchPublishedSources(query: string, workstream: string, expectedEvidence: string[], geographyTerms: string[], topicTerms: string[]) {
  if (env.OPENAI_API_KEY) {
    try {
      const response = await getOpenAIClient().responses.parse({
        model: env.OPENAI_MODEL,
        instructions: "You are Maya Chen, a market research source finder. Use web search to find public evidence directly relevant to the query. Prefer official statistics, property consultancies, mall or REIT reports, academic research and reputable business reporting. Exclude Wikipedia, travel guides, generic destination pages and unrelated countries. Every returned item must be a source you found and inspected with the web search tool. Evidence must be a concise factual paraphrase of what that source supports, never an invented quotation.",
        input: query,
        tools: [{ type: "web_search", search_context_size: "low", user_location: { type: "approximate", country: "SG", city: "Singapore", region: "Singapore", timezone: "Asia/Singapore" } }],
        tool_choice: "required",
        max_output_tokens: 1800,
        reasoning: { effort: "low" },
        store: false,
        text: { format: zodTextFormat(sourceDiscoverySchema, "research_sources") },
      });
      const sources = response.output_parsed?.sources
        .filter((source) => isSafePublicUrl(source.url))
        .filter((source) => !/wikipedia\.org|tripadvisor\.|disfrutasingapur|universal-studios/i.test(source.url)) ?? [];
      if (sources.length) return {
        provider: "openai" as const,
        candidates: sources.map((source) => ({
          title: source.title,
          url: source.url,
          snippet: source.evidence,
          workstream,
          expectedEvidence,
          geographyTerms,
          topicTerms,
          searchRelevanceScore: 10,
          discoveryProvider: "openai" as const,
          webEvidence: source.evidence,
          webPublisher: source.publisher,
          webPublicationDate: source.publicationDate ?? undefined,
          status: "pending" as const,
        })),
      };
    } catch { /* fall through to the independent search transport */ }
  }
  return { provider: "oxylabs" as const, candidates: (await searchWithOxylabs(query, workstream, expectedEvidence, geographyTerms, topicTerms)).map((candidate) => ({ ...candidate, discoveryProvider: "oxylabs" as const })) };
}
