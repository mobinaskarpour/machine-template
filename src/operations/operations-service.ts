import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import type { CompanyRecord } from "../shared/schemas.js";
import { AppError, isAppError, toUserMessage } from "../shared/errors.js";
import { AsyncMutex, readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { newId, nowIso } from "../shared/ids.js";
import type { DeploymentService } from "../deployment/deployment-service.js";
import { formatDeploymentMessage, formatHealthMessage } from "../deployment/deployment-summary.js";
import { assertOpsAuthorized } from "./operations-policy.js";
import { recordOperationsAudit } from "./operations-audit.js";
import {
  isMutatingOpsAction,
  type OpsAction,
  type OpsActionResult,
  type OpsActiveAction,
  type OpsActor,
} from "./operations-types.js";

const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

type OpsConfirmationRecord = {
  token: string;
  telegramUserId: number;
  companyId: string;
  action: OpsActiveAction;
  createdAt: string;
  expiresAt: string;
  used: boolean;
};

type OpsConfirmationsFile = {
  schemaVersion: "1.0";
  confirmations: OpsConfirmationRecord[];
};

export type OperationsServiceDeps = {
  deployment: DeploymentService;
  registry: CompanyRegistry;
  config: AppConfig;
  projectsRoot: string;
  confirmationsPath: string;
  logger: Logger;
};

export type RequestOpsActionInput = {
  companyName: string;
  action: OpsAction;
  actor: OpsActor;
  confirmToken?: string;
  /** CLI-only escape hatch equivalent to a Telegram confirm reply. */
  skipConfirmation?: boolean;
};

/**
 * Orchestrates authorization, single-use confirmation tokens, execution, and
 * audit logging for every `/ops` (or `deployment:*` CLI) action.
 */
export class OperationsService {
  private readonly mutex = new AsyncMutex();

  constructor(private readonly deps: OperationsServiceDeps) {}

  private async loadConfirmations(): Promise<OpsConfirmationsFile> {
    try {
      const raw = (await readJsonFile(this.deps.confirmationsPath)) as OpsConfirmationsFile;
      if (!raw || !Array.isArray(raw.confirmations)) return { schemaVersion: "1.0", confirmations: [] };
      return raw;
    } catch (error) {
      if (isAppError(error) && error.code === "NOT_FOUND") {
        return { schemaVersion: "1.0", confirmations: [] };
      }
      throw error;
    }
  }

  private async issueConfirmation(input: {
    telegramUserId: number;
    companyId: string;
    action: OpsActiveAction;
  }): Promise<string> {
    return this.mutex.runExclusive(async () => {
      const file = await this.loadConfirmations();
      const now = Date.now();
      const token = newId("opsconf").replace(/[^a-z0-9]/gi, "").slice(0, 24);
      const live = file.confirmations.filter(
        (c) => !c.used && new Date(c.expiresAt).getTime() > now,
      );
      live.push({
        token,
        telegramUserId: input.telegramUserId,
        companyId: input.companyId,
        action: input.action,
        createdAt: nowIso(),
        expiresAt: new Date(now + CONFIRMATION_TTL_MS).toISOString(),
        used: false,
      });
      await writeJsonAtomic(this.deps.confirmationsPath, {
        schemaVersion: "1.0",
        confirmations: live,
      });
      return token;
    });
  }

  private async consumeConfirmation(input: {
    token: string;
    telegramUserId: number;
    companyId: string;
    action: OpsActiveAction;
  }): Promise<boolean> {
    return this.mutex.runExclusive(async () => {
      const file = await this.loadConfirmations();
      const now = Date.now();
      const index = file.confirmations.findIndex(
        (c) => c.token === input.token && !c.used && new Date(c.expiresAt).getTime() > now,
      );
      if (index === -1) return false;
      const record = file.confirmations[index]!;
      const matches =
        record.telegramUserId === input.telegramUserId &&
        record.companyId === input.companyId &&
        record.action === input.action;
      const remaining = file.confirmations.filter(
        (c, i) => i !== index && !c.used && new Date(c.expiresAt).getTime() > now,
      );
      if (matches) {
        await writeJsonAtomic(this.deps.confirmationsPath, {
          schemaVersion: "1.0",
          confirmations: remaining,
        });
        return true;
      }
      await writeJsonAtomic(this.deps.confirmationsPath, {
        schemaVersion: "1.0",
        confirmations: [...remaining, record],
      });
      return false;
    });
  }

  async requestAction(input: RequestOpsActionInput): Promise<OpsActionResult> {
    assertOpsAuthorized(input.action, input.actor, this.deps.config);
    const resolved = await this.deps.registry.resolveByName(input.companyName);
    const action = input.action as OpsActiveAction;

    if (isMutatingOpsAction(action)) {
      if (input.actor.channel === "cli") {
        if (!input.skipConfirmation) {
          throw new AppError(
            "OPS_CONFIRMATION_REQUIRED",
            `Action "${action}" mutates a live deployment — re-run with --yes to confirm`,
          );
        }
      } else {
        const telegramUserId = input.actor.telegramUserId;
        if (telegramUserId === undefined) {
          throw new AppError("OPS_UNAUTHORIZED", "Telegram user id is required for this action");
        }
        if (!input.confirmToken) {
          const token = await this.issueConfirmation({
            telegramUserId,
            companyId: resolved.company.id,
            action,
          });
          return {
            ok: false,
            requiresConfirmation: true,
            confirmToken: token,
            message: [
              `This will ${action} the live deployment for ${resolved.company.displayName}.`,
              `Confirm within 5 minutes with:`,
              `/ops ${resolved.company.displayName}: ${action} confirm=${token}`,
            ].join("\n"),
          };
        }
        const valid = await this.consumeConfirmation({
          token: input.confirmToken,
          telegramUserId,
          companyId: resolved.company.id,
          action,
        });
        if (!valid) {
          throw new AppError(
            "OPS_CONFIRMATION_INVALID",
            "Confirmation token is invalid, expired, or already used",
          );
        }
      }
    }

    const { ok, message } = await this.performAction(action, resolved.company, input.companyName);
    await recordOperationsAudit({
      projectsRoot: this.deps.projectsRoot,
      companySlug: resolved.company.slug,
      action,
      actor: input.actor,
      ok,
      message,
    });
    return { ok, message };
  }

  private async performAction(
    action: OpsActiveAction,
    company: CompanyRecord,
    companyName: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      switch (action) {
        case "status": {
          const status = await this.deps.deployment.status(companyName);
          return {
            ok: true,
            message: formatDeploymentMessage({
              companyDisplayName: company.displayName,
              record: status.record,
            }),
          };
        }
        case "health": {
          const result = await this.deps.deployment.health(companyName);
          return {
            ok: result.health.healthy,
            message: formatHealthMessage({
              companyDisplayName: company.displayName,
              health: result.health,
            }),
          };
        }
        case "logs": {
          const result = await this.deps.deployment.logs(companyName, 50);
          const lines = [...result.logs.out, ...result.logs.err].slice(-30);
          return {
            ok: true,
            message: [
              `Recent logs for ${company.displayName} (${result.record.processName}):`,
              ...(lines.length > 0 ? lines : ["(no log output captured)"]),
            ].join("\n"),
          };
        }
        case "restart": {
          const record = await this.deps.deployment.restart(companyName);
          return {
            ok: record.status === "HEALTHY",
            message: formatDeploymentMessage({ companyDisplayName: company.displayName, record }),
          };
        }
        case "rollback": {
          const result = await this.deps.deployment.rollback(companyName);
          return {
            ok: true,
            message: formatDeploymentMessage({
              companyDisplayName: company.displayName,
              record: result.record,
            }),
          };
        }
        case "stop": {
          const record = await this.deps.deployment.stop(companyName);
          return {
            ok: true,
            message: formatDeploymentMessage({ companyDisplayName: company.displayName, record }),
          };
        }
        case "start": {
          const record = await this.deps.deployment.start(companyName);
          return {
            ok: record.status === "HEALTHY",
            message: formatDeploymentMessage({ companyDisplayName: company.displayName, record }),
          };
        }
        default: {
          const exhaustive: never = action;
          throw new AppError("OPS_ACTION_NOT_ALLOWED", `Unhandled ops action: ${String(exhaustive)}`);
        }
      }
    } catch (error) {
      return { ok: false, message: toUserMessage(error) };
    }
  }
}
