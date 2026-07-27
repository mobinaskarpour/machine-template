import type { CompanyRegistry } from "../registry/company-registry.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { CompanyRepository } from "../persistence/company-repository.js";
import type { JobRepository } from "../persistence/job-repository.js";
import type { CompanyDiscoveryService } from "../discovery/company-discovery-service.js";
import type { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import { AppError, isAppError, toUserMessage } from "../shared/errors.js";
import type { ParsedCommand, OpsAction } from "./parse.js";
import type { Logger } from "pino";

export type CommandResult = {
  ok: boolean;
  message: string;
  jobId?: string;
  companyId?: string;
};

export type CommandContext = {
  registry: CompanyRegistry;
  jobs: JobManager;
  companies: CompanyRepository;
  jobRepo: JobRepository;
  logger: Logger;
  discovery: CompanyDiscoveryService;
  knowledge: CompanyKnowledgeService;
};

const INTRO = `THE MACHINE — Autonomous AI Company OS Builder

Phase 1 is online: company discovery and CompanyKnowledge.

I can discover public company information, validate it, and save structured knowledge.
Application generation and deployment are not implemented yet.`;

const HELP = `Available commands (Phase 1):

/start — introduction
/help — this message
/status <job-id|company-name> — persistent status
/demo <company-name> — discover company knowledge
/demo <company-name> | https://example.com — discover with explicit website
/edit <company-name>: <request> — placeholder (NOT_IMPLEMENTED)
/ops <company-name>: <action> — status | logs | restart | ssl

Not implemented yet:
• OS / dashboard / workflow / agent generation
• deployment, restarts, SSL`;

export async function executeCommand(
  parsed: ParsedCommand,
  ctx: CommandContext,
): Promise<CommandResult> {
  switch (parsed.kind) {
    case "start":
      return { ok: true, message: INTRO };
    case "help":
      return { ok: true, message: HELP };
    case "status":
      return handleStatus(parsed.target, parsed.targetType, ctx);
    case "demo":
      return handleDemo(parsed.companyName, parsed.websiteHint, ctx);
    case "edit":
      return handleEdit(parsed.companyName, parsed.request, ctx);
    case "ops":
      return handleOps(parsed.companyName, parsed.action, ctx);
    case "unknown":
      return {
        ok: false,
        message: `Unknown command. Try /help\nReceived: ${parsed.raw}`,
      };
  }
}

async function handleStatus(
  target: string,
  targetType: "job" | "company" | "unknown",
  ctx: CommandContext,
): Promise<CommandResult> {
  if (targetType === "job") {
    const job = await ctx.jobs.get(target);
    if (!job) {
      const company = await ctx.registry.findByName(target);
      if (!company) {
        throw new AppError("NOT_FOUND", `No job or company matched: ${target}`);
      }
      return formatCompanyStatus(company.id, ctx);
    }
    return {
      ok: true,
      jobId: job.id,
      companyId: job.companyId,
      message: [
        `Job ${job.id}`,
        `type: ${job.type}`,
        `status: ${job.status}`,
        `stage: ${job.currentStage ?? "—"}`,
        `progress: ${job.progress ?? 0}%`,
        job.error ? `error: ${job.error.code} — ${job.error.message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  const company = await ctx.registry.findByName(target);
  if (!company) {
    const job = await ctx.jobs.get(target);
    if (job) return handleStatus(target, "job", ctx);
    throw new AppError("NOT_FOUND", `Company not found: ${target}`);
  }
  return formatCompanyStatus(company.id, ctx);
}

async function formatCompanyStatus(
  companyId: string,
  ctx: CommandContext,
): Promise<CommandResult> {
  const company = await ctx.companies.getById(companyId);
  if (!company) {
    throw new AppError("NOT_FOUND", `Company not found: ${companyId}`);
  }
  const knowledge = await ctx.knowledge.get(company.slug);
  const recent = await ctx.jobRepo.list({ companyId, limit: 5 });
  const jobsLines =
    recent.length === 0
      ? "jobs: none"
      : recent.map((j) => `• ${j.id} [${j.type}] ${j.status}`).join("\n");

  return {
    ok: true,
    companyId: company.id,
    message: [
      `Company: ${company.displayName}`,
      `id: ${company.id}`,
      `slug: ${company.slug}`,
      `status: ${company.status}`,
      knowledge
        ? `knowledge: ${knowledge.status} (confidence ${knowledge.overallConfidence.toFixed(2)})`
        : "knowledge: none",
      `workspace: ${company.workspacePath}`,
      `Recent jobs:`,
      jobsLines,
    ].join("\n"),
  };
}

async function handleDemo(
  companyName: string,
  websiteHint: string | undefined,
  ctx: CommandContext,
): Promise<CommandResult> {
  try {
    const result = await ctx.discovery.discover({
      companyName,
      websiteHint,
    });
    const paths = result.relativePaths
      ? [
          "",
          `Saved: ${result.relativePaths.workspaceKnowledge}`,
          `Memory: ${result.relativePaths.memoryKnowledge}`,
        ]
      : [];
    return {
      ok: result.ok,
      jobId: result.jobId,
      companyId: result.companyId,
      message: [...result.message.split("\n"), ...paths].join("\n"),
    };
  } catch (error) {
    if (isAppError(error)) {
      return {
        ok: false,
        message: toUserMessage(error),
      };
    }
    throw error;
  }
}

async function handleEdit(
  companyName: string,
  request: string,
  ctx: CommandContext,
): Promise<CommandResult> {
  const resolved = await ctx.registry.resolveByName(companyName);
  const job = await ctx.jobs.create({
    type: "EDIT",
    companyId: resolved.company.id,
    projectId: resolved.project.id,
    currentStage: "not-implemented",
    input: {
      companyName: resolved.company.displayName,
      request,
      phase: 1,
    },
  });

  await ctx.jobs.transition(job.id, "RUNNING");
  const failed = await ctx.jobs.fail(job.id, {
    code: "NOT_IMPLEMENTED",
    message: "Scoped edits are not implemented in Phase 1",
  });

  return {
    ok: false,
    jobId: failed.id,
    companyId: resolved.company.id,
    message: [
      "Edit request accepted for tracking only.",
      `company: ${resolved.company.displayName}`,
      `request: ${request}`,
      `jobId: ${failed.id}`,
      `jobStatus: ${failed.status}`,
      `error: NOT_IMPLEMENTED`,
      "",
      "No files were modified.",
    ].join("\n"),
  };
}

async function handleOps(
  companyName: string,
  action: OpsAction,
  ctx: CommandContext,
): Promise<CommandResult> {
  const resolved = await ctx.registry.resolveByName(companyName);

  if (action === "status") {
    const status = await formatCompanyStatus(resolved.company.id, ctx);
    return {
      ...status,
      message: [`Ops status for ${resolved.company.displayName}`, status.message].join(
        "\n\n",
      ),
    };
  }

  const job = await ctx.jobs.create({
    type: "OPS",
    companyId: resolved.company.id,
    projectId: resolved.project.id,
    currentStage: "not-implemented",
    input: { action, companyName: resolved.company.displayName, phase: 1 },
  });
  await ctx.jobs.transition(job.id, "RUNNING");
  const failed = await ctx.jobs.fail(job.id, {
    code: "NOT_IMPLEMENTED",
    message: `Ops action "${action}" is not implemented in Phase 1`,
  });

  return {
    ok: false,
    jobId: failed.id,
    companyId: resolved.company.id,
    message: [
      `Ops action "${action}" is not implemented in Phase 1.`,
      `jobId: ${failed.id}`,
      `error: NOT_IMPLEMENTED`,
      "No shell commands were executed.",
    ].join("\n"),
  };
}

export function formatCommandError(error: unknown): string {
  return toUserMessage(error);
}
