export const OPS_ACTIVE_ACTIONS = [
  "status",
  "health",
  "logs",
  "restart",
  "rollback",
  "stop",
  "start",
] as const;
export type OpsActiveAction = (typeof OPS_ACTIVE_ACTIONS)[number];

/** Deferred actions: recognized but not yet wired to a live implementation from chat. */
export const OPS_DEFERRED_ACTIONS = ["ssl", "domain", "deploy"] as const;
export type OpsDeferredAction = (typeof OPS_DEFERRED_ACTIONS)[number];

export type OpsAction = OpsActiveAction | OpsDeferredAction;

export const MUTATING_OPS_ACTIONS: readonly OpsActiveAction[] = [
  "restart",
  "rollback",
  "stop",
  "start",
];

export function isMutatingOpsAction(action: OpsAction): boolean {
  return (MUTATING_OPS_ACTIONS as readonly string[]).includes(action);
}

export function isDeferredOpsAction(action: OpsAction): action is OpsDeferredAction {
  return (OPS_DEFERRED_ACTIONS as readonly string[]).includes(action);
}

export type OpsChannel = "telegram" | "cli";

export type OpsActor = {
  channel: OpsChannel;
  telegramUserId?: number;
  /** Optional human-readable label for audit logs (e.g. "telegram:12345"). */
  label?: string;
};

export type OpsActionResult = {
  ok: boolean;
  message: string;
  requiresConfirmation?: boolean;
  confirmToken?: string;
};
