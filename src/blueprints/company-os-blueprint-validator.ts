import type { CompanyOSBlueprint } from "./company-os-blueprint-schema.js";
import { AppError } from "../shared/errors.js";

const SECRETISH =
  /(Bearer\s+[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|\d{8,}:[A-Za-z0-9_-]{30,})/;

export function validateCompanyOSBlueprint(blueprint: CompanyOSBlueprint): void {
  const ids = new Set<string>();
  const claim = (id: string, label: string) => {
    if (ids.has(id)) {
      throw new AppError("BLUEPRINT_DUPLICATE_ID", `Duplicate id ${id} in ${label}`);
    }
    ids.add(id);
  };

  claim(blueprint.blueprintId, "blueprint");
  for (const r of blueprint.roles) claim(r.id, "roles");
  for (const p of blueprint.permissionModel.permissions) claim(p.id, "permissions");
  for (const d of blueprint.dashboards) claim(d.id, "dashboards");
  for (const m of blueprint.modules) claim(m.id, "modules");
  for (const w of blueprint.workflows) claim(w.id, "workflows");
  for (const a of blueprint.agents) claim(a.id, "agents");
  for (const e of blueprint.dataModel.entities) claim(e.id, "entities");

  const roleIds = new Set(blueprint.roles.map((r) => r.id));
  const permIds = new Set(blueprint.permissionModel.permissions.map((p) => p.id));
  const entityIds = new Set(blueprint.dataModel.entities.map((e) => e.id));
  const kpiIds = new Set(
    blueprint.dashboards.flatMap((d) => d.widgets.flatMap((w) => w.kpiIds)),
  );

  const routes = new Set<string>();
  const addRoute = (route: string) => {
    if (!route.startsWith("/") || route.includes("..") || route.includes("//") || route.includes("\\")) {
      throw new AppError("BLUEPRINT_UNSAFE_ROUTE", `Unsafe route: ${route}`);
    }
    if (routes.has(route)) {
      throw new AppError("BLUEPRINT_DUPLICATE_ROUTE", `Duplicate route: ${route}`);
    }
    routes.add(route);
  };

  for (const d of blueprint.dashboards) addRoute(d.route);
  for (const m of blueprint.modules) {
    for (const p of m.pages) {
      // detail routes may share param patterns; allow :id uniqueness by full string
      if (!routes.has(p.route)) addRoute(p.route);
    }
  }
  for (const n of blueprint.navigation.primary) {
    if (!routes.has(n.route)) {
      if (!n.route.startsWith("/") || n.route.includes("..")) {
        throw new AppError("BLUEPRINT_UNSAFE_ROUTE", `Unsafe nav route: ${n.route}`);
      }
    }
  }

  for (const role of blueprint.roles) {
    for (const pid of role.permissions) {
      if (!permIds.has(pid)) {
        throw new AppError(
          "BLUEPRINT_INVALID_PERMISSION",
          `Role ${role.id} references missing permission ${pid}`,
        );
      }
    }
  }

  for (const d of blueprint.dashboards) {
    for (const rid of d.audienceRoleIds) {
      if (!roleIds.has(rid)) {
        throw new AppError("BLUEPRINT_INVALID_REFERENCE", `Dashboard ${d.id} missing role ${rid}`);
      }
    }
    const sectionIds = new Set(d.layout.sections.map((s) => s.id));
    for (const w of d.widgets) {
      if (!sectionIds.has(w.sectionId)) {
        throw new AppError(
          "BLUEPRINT_INVALID_REFERENCE",
          `Widget ${w.id} references missing section ${w.sectionId}`,
        );
      }
    }
    if (d.priority === "HIGH" && !(d.trace && d.trace.length)) {
      throw new AppError(
        "BLUEPRINT_VALIDATION_FAILED",
        `High-priority dashboard ${d.id} lacks traceability`,
      );
    }
  }

  for (const w of blueprint.workflows) {
    const states = new Set(w.states);
    for (const t of w.transitions) {
      if (!states.has(t.from) || !states.has(t.to)) {
        throw new AppError(
          "BLUEPRINT_INVALID_WORKFLOW",
          `Workflow ${w.id} has invalid transition ${t.from}→${t.to}`,
        );
      }
      for (const rid of t.requiredRoleIds) {
        if (!roleIds.has(rid)) {
          throw new AppError(
            "BLUEPRINT_INVALID_REFERENCE",
            `Workflow ${w.id} transition missing role ${rid}`,
          );
        }
      }
    }
    for (const s of w.stages) {
      for (const rid of s.responsibleRoleIds) {
        if (!roleIds.has(rid)) {
          throw new AppError(
            "BLUEPRINT_INVALID_REFERENCE",
            `Workflow stage missing role ${rid}`,
          );
        }
      }
    }
    if (w.priority === "HIGH" && !(w.trace && w.trace.length)) {
      throw new AppError(
        "BLUEPRINT_VALIDATION_FAILED",
        `High-priority workflow ${w.id} lacks traceability`,
      );
    }
  }

  for (const a of blueprint.agents) {
    if (!["READ_ONLY", "SUGGEST", "APPROVAL_REQUIRED"].includes(a.executionMode)) {
      throw new AppError("BLUEPRINT_INVALID_AGENT_MODE", `Invalid agent mode for ${a.id}`);
    }
    for (const t of a.tools) {
      if (!t.readOnly) {
        throw new AppError(
          "BLUEPRINT_INVALID_AGENT_MODE",
          `Agent tool ${t.id} must be read-only in Phase 3`,
        );
      }
    }
    for (const rid of a.visibilityRoleIds) {
      if (!roleIds.has(rid)) {
        throw new AppError("BLUEPRINT_INVALID_REFERENCE", `Agent ${a.id} missing role ${rid}`);
      }
    }
  }

  for (const e of blueprint.dataModel.entities) {
    for (const f of e.fields) {
      if (f.type === "REFERENCE" && f.referenceEntityId && !entityIds.has(f.referenceEntityId)) {
        throw new AppError(
          "BLUEPRINT_INVALID_REFERENCE",
          `Entity ${e.id} field ${f.name} references missing entity`,
        );
      }
    }
  }
  for (const r of blueprint.dataModel.relationships) {
    if (!entityIds.has(r.fromEntityId) || !entityIds.has(r.toEntityId)) {
      throw new AppError("BLUEPRINT_INVALID_REFERENCE", `Relationship ${r.id} has missing entity`);
    }
  }

  const serialized = JSON.stringify(blueprint);
  if (SECRETISH.test(serialized)) {
    throw new AppError("BLUEPRINT_VALIDATION_FAILED", "Blueprint contains secret-like patterns");
  }
  if (/<\s*html|<\s*script/i.test(serialized)) {
    throw new AppError("BLUEPRINT_VALIDATION_FAILED", "Blueprint contains raw HTML");
  }
  if (/\/root\/|\/home\/[^/\s]+\/|\/var\/lib\//.test(serialized)) {
    throw new AppError("BLUEPRINT_VALIDATION_FAILED", "Blueprint contains absolute server paths");
  }
  if (/Build Successful|Application Generated|Deployment Complete/i.test(serialized)) {
    throw new AppError("BLUEPRINT_VALIDATION_FAILED", "Blueprint must not claim deployment success");
  }

  void kpiIds;
}
