export type QualitySummaryInput = {
  companyDisplayName: string;
  sourceGenerationId: string;
  acceptedGenerationId?: string | null;
  baselineScore?: number | null;
  finalScore: number;
  issuesFound: number;
  issuesRepaired: number;
  issuesRemaining: number;
  typecheckOk: boolean;
  testsOk: boolean;
  buildOk: boolean;
  securityStatus: string;
  rtlStatus: string;
  accessibilityStatus: string;
  visualStatus: string;
  accepted: boolean;
  language?: "fa" | "en";
};

function fmtScore(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

function statusWord(ok: boolean, lang: "fa" | "en"): string {
  if (lang === "fa") return ok ? "موفق" : "ناموفق";
  return ok ? "passed" : "failed";
}

/**
 * Format a safe user-facing quality completion message (Persian or English).
 * Never includes absolute paths, secrets, or raw issue payloads.
 */
export function formatQualityMessage(input: QualitySummaryInput): string {
  const lang =
    input.language ??
    (/[\u0600-\u06FF]/.test(input.companyDisplayName) ? "fa" : "en");
  const acceptedId =
    input.acceptedGenerationId?.trim() ||
    (input.accepted ? input.sourceGenerationId : "unchanged");

  if (lang === "fa") {
    return [
      input.accepted
        ? "بررسی و بهبود کیفیت اپلیکیشن تکمیل شد."
        : "بررسی کیفیت اپلیکیشن تکمیل شد اما پذیرش انجام نشد.",
      "",
      `شرکت: ${input.companyDisplayName}`,
      `نسخه اولیه: ${input.sourceGenerationId}`,
      `نسخه پذیرفته‌شده: ${acceptedId}`,
      `امتیاز کیفیت اولیه: ${fmtScore(input.baselineScore)}`,
      `امتیاز کیفیت نهایی: ${fmtScore(input.finalScore)}`,
      `مشکلات شناسایی‌شده: ${input.issuesFound}`,
      `مشکلات اصلاح‌شده: ${input.issuesRepaired}`,
      `مشکلات باقی‌مانده: ${input.issuesRemaining}`,
      "",
      `Typecheck: ${statusWord(input.typecheckOk, "fa")}`,
      `Tests: ${statusWord(input.testsOk, "fa")}`,
      `Production Build: ${statusWord(input.buildOk, "fa")}`,
      `امنیت: ${input.securityStatus}`,
      `RTL: ${input.rtlStatus}`,
      `دسترسی‌پذیری: ${input.accessibilityStatus}`,
      `بررسی بصری: ${input.visualStatus}`,
      "",
      "این اپلیکیشن هنوز Deploy نشده و URL عمومی ندارد.",
    ].join("\n");
  }

  return [
    input.accepted
      ? "Application quality iteration completed."
      : "Application quality iteration finished but was not accepted.",
    "",
    `Company: ${input.companyDisplayName}`,
    `Source generation: ${input.sourceGenerationId}`,
    `Accepted generation: ${acceptedId}`,
    `Baseline score: ${fmtScore(input.baselineScore)}`,
    `Final score: ${fmtScore(input.finalScore)}`,
    `Issues found: ${input.issuesFound}`,
    `Issues repaired: ${input.issuesRepaired}`,
    `Issues remaining: ${input.issuesRemaining}`,
    "",
    `Typecheck: ${statusWord(input.typecheckOk, "en")}`,
    `Tests: ${statusWord(input.testsOk, "en")}`,
    `Production build: ${statusWord(input.buildOk, "en")}`,
    `Security: ${input.securityStatus}`,
    `RTL: ${input.rtlStatus}`,
    `Accessibility: ${input.accessibilityStatus}`,
    `Visual QA: ${input.visualStatus}`,
    "",
    "The application has not been deployed.",
  ].join("\n");
}
