import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");

describe("machine template smoke", () => {
  it("exposes factory metadata", () => {
    expect(existsSync(join(root, ".factory/demo.yaml"))).toBe(true);
    expect(existsSync(join(root, ".factory/CONTEXT.md"))).toBe(true);
    expect(existsSync(join(root, ".factory/template.yaml"))).toBe(true);
  });

  it("exposes demo.config and config packs", () => {
    expect(existsSync(join(root, "demo.config.json"))).toBe(true);
    for (const f of [
      "config/company.json",
      "config/theme.json",
      "config/navigation.json",
      "config/dashboards.json",
      "config/workflows.json",
      "config/industry.json",
      "config/ai.json",
      "branding/logo.svg",
      "industries/construction/dashboards/pack.json",
    ]) {
      expect(existsSync(join(root, f)), f).toBe(true);
    }
  });

  it("keeps health route", () => {
    const health = join(root, "src/app/api/health/route.ts");
    expect(existsSync(health)).toBe(true);
    const src = readFileSync(health, "utf8");
    expect(src).toContain("ok: true");
  });

  it("exports required npm scripts", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const script of ["dev", "build", "start", "lint", "test", "typecheck", "validate-demo"]) {
      expect(pkg.scripts[script]).toBeTruthy();
    }
  });

  it("enables Next standalone output for Docker", () => {
    const cfg = readFileSync(join(root, "next.config.ts"), "utf8");
    expect(cfg).toContain('output: "standalone"');
  });

  it("ships Docker assets", () => {
    expect(existsSync(join(root, "Dockerfile"))).toBe(true);
    expect(existsSync(join(root, "docker-compose.yml"))).toBe(true);
  });
});
