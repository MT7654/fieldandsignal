import { describe, expect, it } from "vitest";
import { cleanHtmlText, extractResearchTerms, isSafePublicUrl, parseSearchRss, scoreSearchCandidate } from "@/lib/research-web-utils";

describe("open-source research scraper utilities", () => {
  it("parses real search candidates from RSS and excludes unsafe URLs", () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>Official &amp; current</title><link>https://data.gov.sg/report</link><description><![CDATA[<b>Population data</b> for 2025.]]></description></item><item><title>Private</title><link>http://127.0.0.1/admin</link><description>Do not fetch</description></item></channel></rss>`;
    expect(parseSearchRss(xml)).toEqual([{ title: "Official & current", url: "https://data.gov.sg/report", snippet: "Population data for 2025." }]);
  });

  it("blocks local and private network targets", () => {
    expect(isSafePublicUrl("https://example.com/report")).toBe(true);
    expect(isSafePublicUrl("http://localhost:3000/admin")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.2/secret")).toBe(false);
    expect(isSafePublicUrl("file:///etc/passwd")).toBe(false);
  });

  it("removes scripts and navigation from extracted page text", () => {
    expect(cleanHtmlText("<html><nav>Menu</nav><main><h1>Market report</h1><p>Demand rose 12%.</p></main><script>steal()</script></html>")).toBe("Market report Demand rose 12%.");
  });

  it("extracts decision-specific terms instead of generic research language", () => {
    expect(extractResearchTerms("Should a specialty coffee outlet compare CBD rent with heartland demand?"))
      .toEqual(["specialty", "coffee", "outlet", "compare", "cbd", "rent", "heartland", "demand"]);
  });

  it("retains locally relevant business evidence and rejects generic location pages", () => {
    const relevant = scoreSearchCandidate({ title: "Singapore CBD retail rents and F&B outlook", snippet: "Coffee and restaurant operators compare central rents with suburban footfall.", url: "https://www.ura.gov.sg/retail-report" }, ["singapore"], ["specialty", "coffee", "outlet", "cbd", "rent", "heartland"]);
    const generic = scoreSearchCandidate({ title: "Singapur - Wikipedia", snippet: "A BMW can cost $260,000 as vehicle taxes climb.", url: "https://es.wikipedia.org/wiki/Singapur" }, ["singapore"], ["specialty", "coffee", "outlet", "cbd", "rent", "heartland"]);
    const tourism = scoreSearchCandidate({ title: "Singapore travel guide", snippet: "Visit Universal Studios and the city's tourist attractions.", url: "https://example.com/singapore-guide" }, ["singapore"], ["specialty", "coffee", "outlet", "cbd", "rent", "heartland"]);
    expect(relevant.relevant).toBe(true);
    expect(generic.relevant).toBe(false);
    expect(tourism.relevant).toBe(false);
  });
});
