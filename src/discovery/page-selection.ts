const PRIORITY_PATHS = [
  "/",
  "/about",
  "/about-us",
  "/company",
  "/products",
  "/services",
  "/solutions",
  "/industries",
  "/projects",
  "/customers",
  "/contact",
  "/careers",
  "/team",
  "/news",
];

const SKIP_RE =
  /(login|signin|signup|cart|checkout|search|calendar|privacy|terms|cookie|wp-admin|cart|account)/i;

export function selectPagesToFetch(input: {
  origin: string;
  html?: string;
  maxPages: number;
}): string[] {
  const origin = input.origin.replace(/\/$/, "");
  const selected: string[] = [`${origin}/`];

  for (const path of PRIORITY_PATHS) {
    if (path === "/") continue;
    selected.push(`${origin}${path}`);
  }

  if (input.html) {
    const linkRe = /<a[^>]+href=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRe.exec(input.html))) {
      try {
        const url = new URL(match[1]!, origin);
        if (url.origin !== new URL(origin).origin) continue;
        if (url.hash && !url.pathname) continue;
        if (SKIP_RE.test(url.pathname)) continue;
        if ([...url.searchParams.keys()].length > 2) continue;
        const clean = `${url.origin}${url.pathname}`.replace(/\/$/, "") || `${url.origin}/`;
        selected.push(clean.endsWith("/") ? clean : `${clean}`);
      } catch {
        // ignore bad href
      }
    }
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const url of selected) {
    const key = url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(url);
    if (deduped.length >= input.maxPages) break;
  }
  return deduped;
}
