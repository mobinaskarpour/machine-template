# THE MACHINE — Autonomous AI Company OS Builder

Phase 5: Company Discovery → Planning → Blueprint → Generation → **Quality iteration** (audit + isolated repair, no deploy).

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## What works now

- `/demo` pipeline through blueprint, application generation, and quality iteration (when the blueprint is ready)
- Industry Engine + MasterBuildSpecification + Master Prompt + Company OS Blueprint
- Deterministic application generation from `templates/generated-company-os-v1` (Next.js 14.2 / Node 18)
- Generation plan, mock data, validation, security scan, and release promotion
- Quality auditors, scoring, acceptance gates, deterministic repair staging, loopback-only local QA
- CLIs: `discover`, `plan`, `blueprint`, `generate`, `quality`, `migrate:slug --dry-run`

## Templates

- `templates/machine-demo` — preserved legacy demo shell
- `templates/generated-company-os-v1` — Company OS application shell (Next 14.2 / Node 18)

## Not implemented yet

Public deployment (Phase 6 / PM2), SSL, ops restart, executable agents, `/edit` execution, and exposing generated apps on a public URL.

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
npm run generate -- "زر ماکارون"
npm run quality -- "زر ماکارون"
npm run migrate:slug -- --dry-run "زر ماکارون"
```

## Docs

- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [PHASES](docs/PHASES.md)
- [QUALITY-ITERATION](docs/QUALITY-ITERATION.md)
- [QUALITY-SCORING](docs/QUALITY-SCORING.md)
- [QUALITY-AUDITORS](docs/QUALITY-AUDITORS.md)
- [AUTOMATED-REPAIR](docs/AUTOMATED-REPAIR.md)
- [QUALITY-ACCEPTANCE](docs/QUALITY-ACCEPTANCE.md)
- [QUALITY-ARTIFACTS](docs/QUALITY-ARTIFACTS.md)
- [VISUAL-QA](docs/VISUAL-QA.md)
- [ACCESSIBILITY-QA](docs/ACCESSIBILITY-QA.md)
- [APPLICATION-CODE-GENERATION](docs/APPLICATION-CODE-GENERATION.md)
- [GENERATION-PROVIDERS](docs/GENERATION-PROVIDERS.md)
- [GENERATION-PLAN](docs/GENERATION-PLAN.md)
- [GENERATED-RELEASES](docs/GENERATED-RELEASES.md)
- [GENERATED-APP-VALIDATION](docs/GENERATED-APP-VALIDATION.md)
- [MOCK-DATA-ENGINE](docs/MOCK-DATA-ENGINE.md)
- [GENERATED-APP-SECURITY](docs/GENERATED-APP-SECURITY.md)
- [COMPANY-OS-BLUEPRINT](docs/COMPANY-OS-BLUEPRINT.md)
- [SECURITY](docs/SECURITY.md)
- [DATA-LAYOUT](docs/DATA-LAYOUT.md)
