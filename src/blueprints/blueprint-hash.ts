import { createHash } from "node:crypto";

export function hashJsonStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function hashBlueprintContent(blueprint: Record<string, unknown>): string {
  const { contentHash: _c, generatedAt: _g, updatedAt: _u, ...rest } = blueprint;
  return hashJsonStable(rest);
}
