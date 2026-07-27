import { AppError } from "../../shared/errors.js";
import type { BlueprintRuntimeDocument } from "../renderers/runtime-renderer.js";

export type RouteValidationResult = {
  ok: true;
  routeCount: number;
};

/**
 * All navigation / dashboard / module routes must start with / and be unique
 * within each surface (nav, dashboards, module pages).
 */
export function validateRoutes(runtime: BlueprintRuntimeDocument): RouteValidationResult {
  const groups: Array<{ kind: string; items: Array<{ id: string; route: string }> }> = [
    {
      kind: "navigation",
      items: [
        ...runtime.navigation.primary.map((n) => ({ id: n.id, route: n.route })),
        ...runtime.navigation.utility.map((n) => ({ id: n.id, route: n.route })),
      ],
    },
    {
      kind: "dashboards",
      items: runtime.dashboards.map((d) => ({ id: d.id, route: d.route })),
    },
    {
      kind: "module.prefixes",
      items: runtime.modules.map((m) => ({ id: m.id, route: m.routePrefix })),
    },
    {
      kind: "module.pages",
      items: runtime.modules.flatMap((m) =>
        m.pages.map((p) => ({ id: p.id, route: p.route })),
      ),
    },
  ];

  const issues: string[] = [];
  let routeCount = 0;

  for (const group of groups) {
    const seen = new Map<string, string>();
    for (const item of group.items) {
      routeCount += 1;
      if (!item.route.startsWith("/")) {
        issues.push(`${group.kind} ${item.id} route must start with /: ${item.route}`);
      }
      if (item.route.includes("://") || item.route.includes("..")) {
        issues.push(`${group.kind} ${item.id} has unsafe route: ${item.route}`);
      }
      const prev = seen.get(item.route);
      if (prev) {
        issues.push(
          `Duplicate ${group.kind} route ${item.route} (${prev} vs ${item.id})`,
        );
      } else {
        seen.set(item.route, item.id);
      }
    }
  }

  if (issues.length > 0) {
    throw new AppError("GENERATION_VALIDATION_FAILED", "Route validation failed", {
      details: { issues: issues.slice(0, 40) },
    });
  }

  return { ok: true, routeCount };
}
