import * as cheerio from "cheerio";

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
