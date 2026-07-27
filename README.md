# THE MACHINE — Autonomous AI Company OS Builder

Phase 3: Company Discovery → Planning → **Company OS Blueprint** (no application code generation).

## What works now

- `/demo` pipeline through blueprint completion
- Industry Engine + MasterBuildSpecification + Master Prompt
- Deterministic Company OS Blueprint (RBAC, navigation, dashboards, workflows, agents, data model, mock-data plan, implementation plan)
- CLIs: `discover`, `plan`, `blueprint`, `migrate:slug --dry-run`

## Not implemented yet

Application source generation, builds, deployments, executable agents, `/edit` execution, ops restart/SSL.

Phase 3 generates an implementation-ready Company OS Blueprint. It does **not** generate source code, build an application, or deploy anything.

## Setup

```bash
cp .env.example .env
npm install
npm run typecheck
npm test
npm run bot
```

## Verification examples

```bash
npm run discover -- "زر ماکارون" "https://www.zarmacaron.com/"
npm run plan -- "زر ماکارون"
npm run blueprint -- "زر ماکارون"
npm run migrate:slug -- --dry-run "زر ماکارون"
```

## Docs

- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [PHASES](docs/PHASES.md)
- [COMPANY-OS-BLUEPRINT](docs/COMPANY-OS-BLUEPRINT.md)
- [BLUEPRINT-VALIDATION](docs/BLUEPRINT-VALIDATION.md)
- [BLUEPRINT-RBAC](docs/BLUEPRINT-RBAC.md)
- [BLUEPRINT-WORKFLOWS](docs/BLUEPRINT-WORKFLOWS.md)
- [BLUEPRINT-DATA-MODEL](docs/BLUEPRINT-DATA-MODEL.md)
- [BLUEPRINT-MOCK-DATA-PLAN](docs/BLUEPRINT-MOCK-DATA-PLAN.md)
- [INDUSTRY-ENGINE](docs/INDUSTRY-ENGINE.md)
- [SECURITY](docs/SECURITY.md)
- [DATA-LAYOUT](docs/DATA-LAYOUT.md)
