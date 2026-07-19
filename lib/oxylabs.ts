import "server-only";

import { ProxyAgent, fetch as undiciFetch } from "undici";
import * as cheerio from "cheerio";
import { env } from "./env";
import type { EvidenceSource, ResearchCandidate } from "./secondary-research-types";
import { cleanHtmlText, countResearchTermHits, extractResearchTerms, isSafePublicUrl, parseSearchRss, scoreSearchCandidate } from "./research-web-utils";

const SEARCH_LIMIT = 8;

let dispatcher: ProxyAgent | undefined;
function proxyAgent() {
  if (!env.OXYLABS_PROXY_URL || !env.OXYLABS_USERNAME || !env.OXYLABS_PASSWORD) throw new Error("Oxylabs proxy is not configured");
  const token = Buffer.from(`${env.OXYLABS_USERNAME}:${env.OXYLABS_PASSWORD}`).toString("base64");
  dispatcher ??= new ProxyAgent({ uri: env.OXYLABS_PROXY_URL, token: `Basic ${token}` });
  return dispatcher;
}

function proxyConfigured() {
  return Boolean(env.OXYLABS_PROXY_URL && env.OXYLABS_USERNAME && env.OXYLABS_PASSWORD);
}

async function fetchPublicText(url: string, timeoutMs: number, requestDispatcher?: ProxyAgent) {
  if (!isSafePublicUrl(url)) throw new Error("Unsafe source URL");
  let currentUrl = url;
  let response;
  for (let redirect = 0; redirect <= 3; redirect++) {
    response = await undiciFetch(currentUrl, { dispatcher: requestDispatcher, redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "FieldAndSignalResearch/1.0 (+https://fieldandsignal.vercel.app)" } });
    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get("location");
    if (!location) throw new Error("Source redirect was incomplete");
    currentUrl = new URL(location, currentUrl).toString();
    if (!isSafePublicUrl(currentUrl)) throw new Error("Source redirected to an unsafe URL");
    if (redirect === 3) throw new Error("Source redirected too many times");
  }
  if (!response) throw new Error("Source could not be fetched");
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("xml") && !contentType.includes("text")) throw new Error("Unsupported source format");
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > 1_500_000) throw new Error("Source is too large");
  const text = await response.text();
  if (text.length > 1_500_000) throw new Error("Source is too large");
  return text;
}

async function proxiedText(url: string, timeoutMs = 18_000) {
  if (proxyConfigured()) {
    try { return await fetchPublicText(url, timeoutMs, proxyAgent()); }
    catch { /* Retry directly when a residential endpoint or target site refuses the proxy. */ }
  }
  return fetchPublicText(url, timeoutMs);
}

export async function searchWithOxylabs(query: string, workstream: string, expectedEvidence: string[], geographyTerms: string[], topicTerms: string[]): Promise<ResearchCandidate[]> {
  const url = `https://www.bing.com/search?format=rss&setlang=en-SG&cc=sg&q=${encodeURIComponent(query)}`;
  const xml = await proxiedText(url);
  return parseSearchRss(xml)
    .map((item) => ({ item, relevance: scoreSearchCandidate(item, geographyTerms, topicTerms) }))
    .filter(({ relevance }) => relevance.relevant)
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, SEARCH_LIMIT)
    .map(({ item, relevance }) => ({ ...item, workstream, expectedEvidence, geographyTerms, topicTerms, searchRelevanceScore: relevance.score, status: "pending" }));
}

function termsFor(candidate: ResearchCandidate) {
  return candidate.topicTerms?.length ? candidate.topicTerms : extractResearchTerms(`${candidate.workstream} ${candidate.expectedEvidence.join(" ")}`, 18);
}

function reliabilityFor(url: URL, publicationDate: string | undefined, excerpt: string) {
  const host = url.hostname.toLowerCase();
  let score = 4;
  const reasons: string[] = [];
  if (/\.gov(?:\.|$)|\.edu(?:\.|$)|\.ac(?:\.|$)/.test(host)) { score += 4; reasons.push("official or institutional publisher"); }
  else if (/\.org(?:\.|$)/.test(host)) { score += 2; reasons.push("organisation publisher"); }
  else reasons.push("public web publisher");
  if (publicationDate) { score += 1; reasons.push("publication date identified"); }
  if (/\d/.test(excerpt)) { score += 1; reasons.push("contains a directly inspectable data point"); }
  const reliability = score >= 8 ? "High" : score >= 6 ? "Medium" : "Directional";
  return { score, reliability: reliability as EvidenceSource["reliability"], note: reasons.join("; ") };
}

async function fetchScrapedEvidenceCandidate(candidate: ResearchCandidate, sourceIndex: number): Promise<EvidenceSource> {
  const html = await proxiedText(candidate.url);
  const $ = cheerio.load(html);
  const text = cleanHtmlText(html);
  if (text.length < 250) throw new Error("Source contained too little readable text");

  const terms = termsFor(candidate);
  const lowerPage = text.toLowerCase();
  const geographyHits = countResearchTermHits(lowerPage, candidate.geographyTerms ?? []);
  const pageTopicHits = countResearchTermHits(lowerPage, terms);
  const requiredTopicHits = candidate.discoveryProvider === "openai" ? Math.min(1, terms.length) : Math.min(2, terms.length);
  if ((candidate.geographyTerms?.length ?? 0) > 0 && geographyHits === 0) throw new Error("Source did not match the geographic market");
  if (pageTopicHits < requiredTopicHits) throw new Error("Source did not match the business decision");

  const sentences = text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length >= 55 && sentence.length <= 520);
  const ranked = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    const topicHits = countResearchTermHits(lower, terms);
    const geography = countResearchTermHits(lower, candidate.geographyTerms ?? []) > 0 ? 2 : 0;
    const data = /(?:%|\b\d[\d,.]*\s?(?:million|billion|thousand|people|customers|stores|outlets|years?|months?|sq\s?ft)\b|(?:S\$|US\$|[$£€])\s?\d)/i.test(sentence) ? 3 : 0;
    return { sentence, topicHits, score: topicHits * 2 + geography + data };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.topicHits < requiredTopicHits) throw new Error("Source contained no decision-relevant evidence excerpt");

  const excerpt = best.sentence.slice(0, 500);
  const title = ($("title").first().text().trim() || candidate.title).replace(/\s+/g, " ").slice(0, 220);
  const publicationDate = ["article:published_time", "datePublished", "date", "pubdate"].map((name) => $(`meta[name="${name}"],meta[property="${name}"]`).first().attr("content")).find(Boolean);
  const url = new URL(candidate.url);
  const reliability = reliabilityFor(url, publicationDate, excerpt);
  const dataPoints = [...excerpt.matchAll(/(?:S\$|US\$|[$£€])?\s?\d[\d,.]*(?:\s?(?:%|million|billion|thousand|people|customers|stores|outlets|years?|months?|sq\s?ft))?/gi)]
    .map((match) => match[0].trim()).filter((value) => value.length > 1).slice(0, 4);
  return {
    id: `S${String(sourceIndex).padStart(2, "0")}`,
    title,
    publisher: url.hostname.replace(/^www\./, ""),
    url: candidate.url,
    publicationDate,
    retrievedAt: new Date().toISOString(),
    excerpt,
    supportedClaim: excerpt,
    reliability: reliability.reliability,
    reliabilityScore: reliability.score,
    reliabilityNote: reliability.note,
    workstream: candidate.workstream,
    dataPoints,
  };
}

function evidenceFromWebSearch(candidate: ResearchCandidate, sourceIndex: number): EvidenceSource {
  if (!candidate.webEvidence) throw new Error("Source could not be inspected");
  const url = new URL(candidate.url);
  const excerpt = candidate.webEvidence.slice(0, 500);
  const reliability = reliabilityFor(url, candidate.webPublicationDate, excerpt);
  const dataPoints = [...excerpt.matchAll(/(?:S\$|US\$|[$£€])?\s?\d[\d,.]*(?:\s?(?:%|million|billion|thousand|people|customers|stores|outlets|years?|months?|sq\s?ft))?/gi)]
    .map((match) => match[0].trim()).filter((value) => value.length > 1).slice(0, 4);
  return {
    id: `S${String(sourceIndex).padStart(2, "0")}`,
    title: candidate.title,
    publisher: candidate.webPublisher || url.hostname.replace(/^www\./, ""),
    url: candidate.url,
    publicationDate: candidate.webPublicationDate,
    retrievedAt: new Date().toISOString(),
    excerpt,
    supportedClaim: excerpt,
    reliability: reliability.reliability,
    reliabilityScore: reliability.score,
    reliabilityNote: `${reliability.note}; evidence located through OpenAI web search because the publisher page was not machine-readable`,
    workstream: candidate.workstream,
    dataPoints,
  };
}

export async function fetchEvidenceCandidate(candidate: ResearchCandidate, sourceIndex: number): Promise<EvidenceSource> {
  try { return await fetchScrapedEvidenceCandidate(candidate, sourceIndex); }
  catch (error) {
    if (candidate.discoveryProvider === "openai" && candidate.webEvidence) return evidenceFromWebSearch(candidate, sourceIndex);
    throw error;
  }
}
