/**
 * Generic company-name normalization for alias matching.
 * Brand-agnostic — no company-specific branches.
 */
export function compactCompanyName(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s_\-‌.]+/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/آ/g, "ا");
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length]!;
}

/** True when names are the same after compaction or a tiny spelling variation. */
export function isLikelySameCompanyName(a: string, b: string): boolean {
  const x = compactCompanyName(a);
  const y = compactCompanyName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (Math.abs(x.length - y.length) > 2) return false;
  if (x.slice(0, 3) !== y.slice(0, 3)) return false;
  return editDistance(x, y) <= 2;
}
