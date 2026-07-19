import * as cheerio from "cheerio";

const RESEARCH_STOP_WORDS = new Set([
  "about", "acceptable", "against", "along", "analysis", "based", "business", "could", "data", "decision", "evidence", "expected", "first", "from", "have", "into", "large", "likely", "market", "most", "next", "official", "open", "report", "research", "should", "their", "there", "these", "this", "through", "versus", "what", "where", "which", "with", "would", "years",
]);

export function extractResearchTerms(value: string | null | undefined, limit = 16) {
  const words = (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return [...new Set(words.filter((word) => !RESEARCH_STOP_WORDS.has(word) && !/^\d+$/.test(word)))].slice(0, limit);
}

export function countResearchTermHits(value: string, terms: string[]) {
  const tokens = new Set(value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  return terms.filter((term) => tokens.has(term)).length;
}

export function scoreSearchCandidate(input: { title: string; snippet: string; url: string }, geographyTerms: string[], topicTerms: string[]) {
  const title = input.title.toLowerCase();
  const snippet = input.snippet.toLowerCase();
  const combined = `${title} ${snippet}`;
  const geographyHits = countResearchTermHits(combined, geographyTerms);
  const titleTopicHits = countResearchTermHits(title, topicTerms);
  const snippetTopicHits = countResearchTermHits(snippet, topicTerms);
  const topicHits = countResearchTermHits(combined, topicTerms);
  let host = "";
  try { host = new URL(input.url).hostname.toLowerCase(); } catch { /* invalid URLs are removed separately */ }
  const authorityBonus = /(?:^|\.)(?:gov\.sg|edu\.sg|org\.sg)$/.test(host) || /(?:^|\.)(?:statista\.com|jll\.com|cbre\.com|savills\.com)$/.test(host) ? 4 : 0;
  const genericPenalty = /wikipedia\.org$/.test(host) || /\b(?:travel guide|tourism|tourist attraction|universal studios)\b/.test(combined) ? 10 : 0;
  const relevant = (geographyTerms.length === 0 || geographyHits > 0) && topicHits >= Math.min(2, topicTerms.length) && genericPenalty === 0;
  return { relevant, score: geographyHits * 5 + titleTopicHits * 4 + snippetTopicHits * 2 + authorityBonus - genericPenalty, geographyHits, topicHits };
}

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function cleanHtmlText(html: string) {
  const $ = cheerio.load(html);
  $("script,style,noscript,svg,nav,footer").remove();
  $("p,h1,h2,h3,h4,h5,h6,li,article,section,div,br,tr").each((_, element) => { $(element).append(" "); });
  return decodeEntities($.root().text()).replace(/\s+/g, " ").trim();
}

export function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
    if (/^(?:127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname)) return false;
    if (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd")) return false;
    return true;
  } catch { return false; }
}

export function parseSearchRss(xml: string) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("item").map((_, item) => {
    const node = $(item);
    return { title: cleanHtmlText(node.find("title").text()), url: node.find("link").text().trim(), snippet: cleanHtmlText(node.find("description").text()) };
  }).get().filter((item) => item.title && isSafePublicUrl(item.url));
}
