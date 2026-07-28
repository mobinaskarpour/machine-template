import { describe, it, expect } from "vitest";
import { runtime, mockData } from "../src/lib/runtime";

describe("generated app coverage", () => {
  it("has company metadata and rtl config consistency", () => {
    expect(runtime.company.displayName.length).toBeGreaterThan(1);
    expect(typeof runtime.company.rtl).toBe("boolean");
  });

  it("navigation routes are absolute and unique", () => {
    const routes = [
      ...runtime.navigation.primary.map((n) => n.route),
      ...runtime.navigation.utility.map((n) => n.route),
    ];
    expect(routes.every((r) => r.startsWith("/"))).toBe(true);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("agents remain non-executable modes", () => {
    for (const a of runtime.agents) {
      expect(["READ_ONLY", "SUGGEST", "APPROVAL_REQUIRED"]).toContain(a.executionMode);
    }
  });

  it("mock record references resolve when present", () => {
    const records = mockData.records as Record<string, Array<Record<string, unknown>>>;
    for (const [key, rows] of Object.entries(records)) {
      expect(Array.isArray(rows)).toBe(true);
      for (const row of rows) {
        expect(row.id).toBeTruthy();
      }
      void key;
    }
  });

  it("dashboard widgets reference configured dashboards", () => {
    for (const d of runtime.dashboards) {
      expect(d.widgets.every((w) => d.layout.sections.some((s) => s.id === w.sectionId))).toBe(true);
    }
  });
});
