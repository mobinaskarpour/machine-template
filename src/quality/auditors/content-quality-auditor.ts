import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import {
  clampScore,
  listReleaseTextFiles,
  readReleaseText,
  toRel,
} from "./auditor-fs.js";

const LOREM_RE = /lorem\s+ipsum/i;
const BUILD_SUCCESS_ALONE_RE = /^\s*Build Successful\s*$/im;
const DEPLOY_CLAIM_RE =
  /\b(?:deployed\s+to\s+production|publicly\s+available\s+at|https?:\/\/(?!127\.0\.0\.1|localhost)[^\s"'`]+)\b/i;
const CONCRETE_PRECAST_RE =
  /\b(?:precast\s+concrete|concrete\s+precast|precast\s+panel|ready[\s-]?mix\s+concrete)\b/i;

/**
 * Scan generated source for placeholder / deployment / locale leakage content.
 */
export async function auditContentQuality(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  let deductions = 0;
  const isPersian =
    ctx.blueprint.company.rtl ||
    ctx.blueprint.company.language.toLowerCase().startsWith("fa") ||
    /[\u0600-\u06FF]/.test(ctx.blueprint.company.displayName);

  const files = await listReleaseTextFiles(ctx.releaseAppDir, {
    underSrcOnly: true,
  });

  for (const full of files) {
    const rel = toRel(ctx.releaseAppDir, full);
    let text: string;
    try {
      text = (await readReleaseText(ctx.releaseAppDir, rel)) ?? "";
    } catch {
      continue;
    }
    if (!text) continue;

    if (LOREM_RE.test(text)) {
      deductions += 0.2;
      const { fingerprint, blocking } = classifyIssueFields({
        category: "CONTENT",
        title: "Lorem Ipsum placeholder found",
        severity: "HIGH",
        affectedFiles: [rel],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "CONTENT",
          severity: "HIGH",
          title: "Lorem Ipsum placeholder found",
          description: `Placeholder Lorem Ipsum text found in ${rel}`,
          evidence: [{ type: "FILE", value: rel, sanitized: true }],
          affectedFiles: [rel],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
    }

    if (BUILD_SUCCESS_ALONE_RE.test(text)) {
      deductions += 0.15;
      const { fingerprint, blocking } = classifyIssueFields({
        category: "CONTENT",
        title: "Build Successful placeholder content",
        severity: "MEDIUM",
        affectedFiles: [rel],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "CONTENT",
          severity: "MEDIUM",
          title: "Build Successful placeholder content",
          description: `"Build Successful" alone is not acceptable user-facing content in ${rel}`,
          evidence: [{ type: "FILE", value: rel, sanitized: true }],
          affectedFiles: [rel],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
    }

    if (
      DEPLOY_CLAIM_RE.test(text) &&
      !rel.endsWith(".test.ts") &&
      !rel.startsWith("src/data/")
    ) {
      deductions += 0.25;
      const { fingerprint, blocking } = classifyIssueFields({
        category: "CONTENT",
        title: "Deployment claim in generated app",
        severity: "HIGH",
        affectedFiles: [rel],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "CONTENT",
          severity: "HIGH",
          title: "Deployment claim in generated app",
          description: `Generated source must not claim public deployment (${rel})`,
          evidence: [{ type: "FILE", value: rel, sanitized: true }],
          affectedFiles: [rel],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
    }

    if (isPersian && CONCRETE_PRECAST_RE.test(text)) {
      deductions += 0.2;
      const { fingerprint, blocking } = classifyIssueFields({
        category: "CONTENT",
        title: "Unrelated industry terminology",
        severity: "HIGH",
        affectedFiles: [rel],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "CONTENT",
          severity: "HIGH",
          title: "Unrelated industry terminology",
          description: `Concrete/precast English terms found in a Persian-locale app (${rel})`,
          evidence: [{ type: "FILE", value: rel, sanitized: true }],
          affectedFiles: [rel],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
    }
  }

  const authLabel = ctx.runtime?.demo?.authLabel;
  if (!authLabel || String(authLabel).trim().length === 0) {
    deductions += 0.15;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "CONTENT",
      title: "Missing demo auth label",
      severity: "MEDIUM",
      affectedFiles: ["src/data/blueprint-runtime.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "CONTENT",
        severity: "MEDIUM",
        title: "Missing demo auth label",
        description: "Demo auth assumptions must be labeled in runtime.demo.authLabel",
        evidence: [
          {
            type: "FILE",
            value: "src/data/blueprint-runtime.json",
            sanitized: true,
          },
        ],
        affectedFiles: ["src/data/blueprint-runtime.json"],
        fingerprint,
        blocking,
        repairability: "AUTO_DETERMINISTIC",
      }),
    );
  }

  return {
    auditorId: "content-quality",
    score: clampScore(1 - deductions),
    issues,
  };
}
