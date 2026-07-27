import { createHash, randomUUID } from "node:crypto";

export function newId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function shortStableHash(input: string, length = 10): string {
  return createHash("sha256").update(input).digest("hex").slice(0, length);
}

export function nowIso(): string {
  return new Date().toISOString();
}
