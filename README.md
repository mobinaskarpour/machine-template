# THE MACHINE — Autonomous AI Company OS Builder

Phase 6: Company Discovery → Planning → Blueprint → Generation → Quality iteration → **Deployment and operations** (local PM2 deploy, health checks, `/ops`).

Phase 6 deploys a quality-accepted release to a local port under process supervision. Public exposure (custom domain + TLS) remains a manual, explicitly-configured opt-in — never automatic.

## What works now

- `/demo` pipeline through blueprint, application generation, quality iteration, and (when `DEMO_AUTO_DEPLOY=true` and the requester is an admin) automatic deployment
- Industry Engine + MasterBuildSpecification + Master Prompt + Company OS Blueprint
- Deterministic application generation from `templates/generated-company-os-v2` (Next.js 14.2 / Node 18)
- Generation plan, mock data, validation, security scan, and release promotion
- Quality auditors, scoring, acceptance gates, deterministic repair staging, loopback-only local QA
- Pre-deployment gate (dependency audit + multi-viewport browser QA), blue/green deployment via pm2, full health verification, and rollback — all bound to `127.0.0.1`
- `/ops` command + `deployment:*` CLIs for `status`, `health`, `logs`, `restart`, `rollback`, `stop`, `start`, with Telegram admin authorization + confirmation tokens
- CLIs: `discover`, `plan`, `blueprint`, `generate`, `quality`, `deployment:gate`, `deploy`, `deployment:status|health|logs|restart|rollback|stop|start`, `migrate:slug --dry-run`

## Templates

- `templates/machine-demo` — preserved legacy demo shell
- `templates/generated-company-os-v2` — Company OS application shell (Next 14.2 / Node 18, includes `/api/health`)

## Not implemented yet

Public exposure (reverse proxy config generation + TLS issuance are stub providers only), executable agents, and `/edit` execution.

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
npm run deployment:gate -- "زر ماکارون"
npm run deploy -- "زر ماکارون"
npm run deployment:status -- "زر ماکارون"
npm run migrate:slug -- --dry-run "زر ماکارون"
```

## Docs

- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [PHASES](docs/PHASES.md)
- [DEPLOYMENT](docs/DEPLOYMENT.md)
- [OPERATIONS](docs/OPERATIONS.md)
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
