import { mkdir } from "node:fs/promises";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { writeJsonAtomic } from "../persistence/atomic.js";
import { nowIso, shortStableHash } from "../shared/ids.js";
import type { OpsAction, OpsActor } from "./operations-types.js";

export type OperationsAuditEntry = {
  schemaVersion: "1.0";
  companySlug: string;
  action: OpsAction;
  actor: OpsActor;
  ok: boolean;
  message: string;
  at: string;
};

/**
 * Append-style audit trail for `/ops` actions under
 * data/projects/<slug>/.factory/operations-audit/. Each entry is its own
 * atomically-written file so concurrent operators never corrupt each other's
 * records.
 */
export async function recordOperationsAudit(input: {
  projectsRoot: string;
  companySlug: string;
  action: OpsAction;
  actor: OpsActor;
  ok: boolean;
  message: string;
}): Promise<void> {
  const slug = assertSafeSlug(input.companySlug);
  const dir = resolveUnderRoot(input.projectsRoot, slug, ".factory", "operations-audit");
  await mkdir(dir, { recursive: true });
  const at = nowIso();
  const fileName = `${at.replace(/[:.]/g, "-")}_${shortStableHash(`${slug}:${input.action}:${at}`, 8)}.json`;
  const entry: OperationsAuditEntry = {
    schemaVersion: "1.0",
    companySlug: slug,
    action: input.action,
    actor: input.actor,
    ok: input.ok,
    message: input.message.slice(0, 2000),
    at,
  };
  await writeJsonAtomic(resolveUnderRoot(dir, fileName), entry);
}
