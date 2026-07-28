import type { CompanyRegistry } from "../registry/company-registry.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { CompanyRepository } from "../persistence/company-repository.js";
import type { JobRepository } from "../persistence/job-repository.js";
import type { CompanyDiscoveryService } from "../discovery/company-discovery-service.js";
import type { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import type { CompanyPlanningService } from "../prompts/company-planning-service.js";
import type { CompanyBlueprintPlanningService } from "../blueprints/company-blueprint-planning-service.js";
import type { ApplicationGenerationService } from "../generation/application-generation-service.js";
import type { QualityIterationService } from "../quality/quality-iteration-service.js";
import type { DeploymentService } from "../deployment/deployment-service.js";
import type { OperationsService } from "../operations/operations-service.js";
import { formatDeploymentMessage } from "../deployment/deployment-summary.js";
import type { AppConfig } from "../config/env.js";
import { isAdminTelegramUser } from "../operations/operations-policy.js";
import { AppError, isAppError, toUserMessage } from "../shared/errors.js";
import type { ParsedCommand, OpsAction } from "./parse.js";
import type { Logger } from "pino";

export type CommandResult = {
  ok: boolean;
  message: string;
  jobId?: string;
  companyId?: string;
};

export type CommandActor =
  | { channel: "cli" }
  | { channel: "telegram"; telegramUserId?: number };

export type ExecuteCommandOptions = {
  /** Who is issuing the command; defaults to a trusted local CLI actor. */
  actor?: CommandActor;
  /** CLI escape hatch equivalent to a Telegram confirm reply for mutating /ops actions. */
  skipConfirmation?: boolean;
};

export type CommandContext = {
  registry: CompanyRegistry;
  jobs: JobManager;
  companies: CompanyRepository;
  jobRepo: JobRepository;
  logger: Logger;
  config: AppConfig;
  discovery: CompanyDiscoveryService;
  knowledge: CompanyKnowledgeService;
  planning: CompanyPlanningService;
  blueprint: CompanyBlueprintPlanningService;
  generation: ApplicationGenerationService;
  quality: QualityIterationService;
  deployment: DeploymentService;
  operations: OperationsService;
};

const INTRO = `THE MACHINE — Autonomous AI Company OS Builder

Phase 6 is online: discovery, planning, blueprint, generation, quality iteration, and deployment/operations.

I can discover companies, build blueprints, generate a build-verified Company OS demo, run quality audits/repairs, and deploy the result to a local port (loopback only) with pre-deployment gates.
Public exposure (custom domain + TLS) still requires manual DNS/nginx/SSL setup.`;

const HELP = `Available commands (Phase 6):

/start — introduction
/help — this message
/status <job-id|company-name> — persistent status
/demo <company-name> — discover → plan → blueprint → generate → quality → (auto-deploy if enabled)
/demo <company-name> | https://example.com — explicit website, then full pipeline
/edit <company-name>: <request> — placeholder (NOT_IMPLEMENTED)
/ops <company-name>: <action> — status | health | logs | restart | rollback | stop | start

Mutating ops actions (restart, rollback, stop, start) require confirmation:
from Telegram you'll be asked to reply with "confirm=<token>" within 5 minutes;
from the CLI, re-run with --yes.

Deferred to CLI only (not available from chat): ssl, domain, deploy.`;

export async function executeCommand(
  parsed: ParsedCommand,
  ctx: CommandContext,
  opts?: ExecuteCommandOptions,
): Promise<CommandResult> {
  const actor: CommandActor = opts?.actor ?? { channel: "cli" };
  switch (parsed.kind) {
    case "start":
      return { ok: true, message: INTRO };
    case "help":
      return { ok: true, message: HELP };
    case "status":
      return handleStatus(parsed.target, parsed.targetType, ctx);
    case "demo":
      return handleDemo(parsed.companyName, parsed.websiteHint, ctx, actor);
    case "edit":
      return handleEdit(parsed.companyName, parsed.request, ctx);
    case "ops":
      return handleOps(
        parsed.companyName,
        parsed.action,
        parsed.confirmToken,
        ctx,
        actor,
        opts?.skipConfirmation ?? false,
      );
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
  actor: CommandActor,
): Promise<CommandResult> {
  try {
    const result = await ctx.discovery.discover({
      companyName,
      websiteHint,
    });

    if (result.needsInput || !result.knowledge || result.knowledge.status === "NEEDS_INPUT") {
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
    }

    const planning = await ctx.planning.planWithKnowledge(
      result.knowledge,
      result.companyId,
      (
        await ctx.registry.resolveByName(result.knowledge.displayName)
      ).project.id,
    );

    const blueprint = await ctx.blueprint.blueprintWithArtifacts({
      knowledge: planning.knowledge,
      resolution: planning.resolution,
      specification: planning.specification,
      prompt: planning.prompt,
      companyId: planning.companyId,
      projectId: (
        await ctx.registry.resolveByName(planning.knowledge.displayName)
      ).project.id,
    });

    if (!blueprint.blueprint.quality.readyForCodeGeneration) {
      return {
        ok: blueprint.ok,
        jobId: blueprint.jobId,
        companyId: blueprint.companyId,
        message: [
          blueprint.message,
          "",
          "Application generation skipped — Blueprint is not ready for code generation.",
          "The application has not been deployed.",
        ].join("\n"),
      };
    }

    const generation = await ctx.generation.generateWithArtifacts({
      knowledgeHash: planning.knowledge.contentHash ?? "",
      specificationHash: planning.specification.contentHash ?? "",
      masterPromptHash: planning.prompt.contentHash ?? "",
      blueprint: blueprint.blueprint,
      companyId: blueprint.companyId,
      projectId: (
        await ctx.registry.resolveByName(planning.knowledge.displayName)
      ).project.id,
    });

    if (!generation.ok) {
      return {
        ok: false,
        jobId: generation.jobId,
        companyId: generation.companyId,
        message: [blueprint.message, "", generation.message].join("\n"),
      };
    }

    const quality = await ctx.quality.iterateFromExisting(
      planning.knowledge.displayName,
    );

    const deployMessage = await maybeAutoDeploy(
      planning.knowledge.displayName,
      quality.ok,
      ctx,
      actor,
    );

    return {
      ok: generation.ok && quality.ok,
      jobId: quality.jobId ?? generation.jobId,
      companyId: generation.companyId,
      message: [
        blueprint.message,
        "",
        generation.message,
        "",
        quality.message,
        "",
        deployMessage,
      ].join("\n"),
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
/**
 * Best-effort auto-deploy after a successful /demo quality pass. Never
 * throws — deployment/gate failures are reported as text, not as a broken
 * /demo response, since generation itself already succeeded.
 */
async function maybeAutoDeploy(
  companyName: string,
  qualityOk: boolean,
  ctx: CommandContext,
  actor: CommandActor,
): Promise<string> {
  if (!qualityOk) {
    return "Deployment skipped — quality gate did not pass.";
  }
  if (!ctx.config.demoAutoDeploy) {
    return "The app is ready for deployment. Automatic deployment is disabled (DEMO_AUTO_DEPLOY=false); use the deployment CLI or /ops to deploy manually.";
  }
  const isAdmin =
    actor.channel === "cli" ||
    (actor.channel === "telegram" && isAdminTelegramUser(actor.telegramUserId, ctx.config));
  if (!isAdmin) {
    return "Automatic deployment is enabled but skipped: requester is not an authorized admin.";
  }
  try {
    await ctx.deployment.predeploy(companyName);
    const result = await ctx.deployment.deploy(companyName);
    return formatDeploymentMessage({
      companyDisplayName: companyName,
      record: result.deployment.record,
    });
  } catch (error) {
    return `Automatic deployment failed: ${toUserMessage(error)}`;
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
  confirmToken: string | undefined,
  ctx: CommandContext,
  actor: CommandActor,
  skipConfirmation: boolean,
): Promise<CommandResult> {
  const result = await ctx.operations.requestAction({
    companyName,
    action,
    actor,
    confirmToken,
    skipConfirmation,
  });
  return { ok: result.ok, message: result.message };
}

export function formatCommandError(error: unknown): string {
  return toUserMessage(error);
}
