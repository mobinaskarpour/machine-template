# Company OS Blueprint

Phase 3 converts validated planning artifacts into an implementation-ready blueprint.
**Phase 4 generation consumes this blueprint** (never raw HTML or discovery payloads) to produce a build-verified application release.

## Pipeline

```text
CompanyKnowledge
→ Industry Resolution
→ MasterBuildSpecification
→ Master Prompt metadata
→ Blueprint builders
→ Semantic validation + quality scoring
→ Dual persistence
→ Blueprint Complete
→ (Phase 4) Generation Plan → generated app release
```

## Source restrictions

Consumes only canonical Phase 1–2 artifacts. Never raw HTML, search payloads, env secrets, or Telegram free text as research input.

## Output

Persisted as:

```text
data/projects/<slug>/.factory/company-os-blueprint.json
data/projects/<slug>/.factory/company-os-blueprint-summary.json
data/memory/blueprints/<slug>.json
```

## Quality scoring (brief)

`calculateBlueprintQuality` scores five dimensions in `[0, 1]`:

| Dimension | What it measures |
|-----------|------------------|
| Completeness | Breadth of dashboards, modules, workflows, agents, entities, roles, nav, mock scenarios |
| Consistency | Referential integrity (roles↔permissions, widgets↔sections, audiences) |
| Traceability | High-priority items retain Phase 2 traces |
| Security | RBAC, approval/audit on sensitive ops, read-only agent tools |
| Implementation readiness | Weighted blend of the above |

Unresolved non-blocking questions apply a soft penalty. Blocking questions or invalid agent modes set `readyForCodeGeneration: false`. Phase 4 refuses generation unless `quality.readyForCodeGeneration` is true (`BLUEPRINT_NOT_READY`).

## Important

Phase 3 produces the blueprint only. Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.
