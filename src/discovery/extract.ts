import { createHash } from "node:crypto";
import type { DeterministicExtraction } from "./discovery-types.js";
import { stripHtmlToText } from "../security/untrusted-content.js";

function metaContent(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
      "i",
    );
    const m = html.match(re) ?? html.match(alt);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return undefined;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractJsonLd(html: string): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const parsed = JSON.parse(match[1]!.trim()) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          const type = String((item as { "@type"?: string })["@type"] ?? "");
          if (/organization|corporation|localbusiness/i.test(type) || !type) {
            out.push(item as Record<string, unknown>);
          }
        }
      }
    } catch {
      // ignore invalid json-ld
    }
  }
  return out;
}

export function extractDeterministic(html: string, pageUrl: string): DeterministicExtraction {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1] ? decodeHtml(stripHtmlToText(titleMatch[1], 300)) : undefined;
  const description =
    metaContent(html, ["description", "og:description"]) ?? undefined;
  const ogTitle = metaContent(html, ["og:title"]);
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
    metaContent(html, ["og:url"]);
  const logoUrl =
    metaContent(html, ["og:image"]) ??
    html.match(/<img[^>]+(?:id|class)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1];

  const headings: string[] = [];
  const headingRe = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = headingRe.exec(html))) {
    const text = stripHtmlToText(hm[1]!, 200);
    if (text) headings.push(text);
    if (headings.length >= 40) break;
  }

  const emails = [
    ...new Set(
      (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? []).slice(
        0,
        10,
      ),
    ),
  ];
  const phones = [
    ...new Set(
      (html.match(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g) ??
        []
      )
        .map((p) => p.trim())
        .filter((p) => p.replace(/\D/g, "").length >= 8)
        .slice(0, 10),
    ),
  ];

  const lang =
    html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ??
    metaContent(html, ["language", "og:locale"]);
  const languages = lang ? [lang] : [];

  const socialUrls = [
    ...new Set(
      (html.match(
        /https?:\/\/(?:www\.)?(?:linkedin|instagram|twitter|x|facebook|youtube)\.com\/[^\s"'<>]+/gi,
      ) ?? []).slice(0, 20),
    ),
  ];

  const productHints = headings
    .filter((h) =>
      /product|service|solution|محصول|خدمات|پروژه/i.test(h),
    )
    .slice(0, 20);

  // Also collect list items near products sections lightly
  const listItems = [
    ...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
  ]
    .map((m) => stripHtmlToText(m[1]!, 120))
    .filter((t) => t.length > 2 && t.length < 80)
    .slice(0, 30);

  const visibleTextSample = stripHtmlToText(html, 8_000);

  return {
    title,
    description,
    canonicalUrl: canonical ? new URL(canonical, pageUrl).href : undefined,
    ogTitle,
    ogDescription: description,
    headings,
    emails,
    phones,
    logoUrl: logoUrl ? new URL(logoUrl, pageUrl).href : undefined,
    languages,
    jsonLdOrganizations: extractJsonLd(html),
    socialUrls,
    productHints: [...new Set([...productHints, ...listItems.slice(0, 10)])],
    visibleTextSample,
  };
}

export function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
