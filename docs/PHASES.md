# Phases

## Phase 0 — Core Foundation

Implemented.

## Phase 1 — Company Discovery and CompanyKnowledge

Implemented.

## Phase 2 — Master Prompt Builder and Industry Engine

Implemented.

## Phase 3 — Company OS Blueprint Generation

Implemented.

- Canonical `CompanyOSBlueprint` schema
- Deterministic builders (RBAC, navigation, dashboards, modules, workflows, agents, data model, mock-data plan, implementation plan)
- Semantic validation + readiness scoring
- Dual persistence + history
- `/demo` continues through blueprint completion into Phase 4 generation when ready
- `npm run blueprint`
- Improved Persian slug suggestions (`zar-makaron`) with non-destructive backward compatibility
- Dry-run slug migration reporter (`npm run migrate:slug -- --dry-run`)

Phase 3 generates an implementation-ready Company OS Blueprint. Application source generation is Phase 4.

## Phase 4 — Application Code Generation Engine

Implemented:

- Generation plan from a ready Company OS Blueprint
- Approved template copy (`templates/generated-company-os-v2`, Next 14.2 / Node 18)
- DeterministicTemplateProvider (default) renders runtime JSON, mock data, and branding
- Source / dependency / route / coverage / mock-data validation
- Local install → typecheck → test → production build via SafeCommandRunner
- Generated-app security scan
- Immutable release promotion + `current-generation.json` pointer
- Idempotent reuse when blueprint hash matches the current release
- `npm run generate` and `/demo` through generation
- Retention: last 3 releases; staging may be retained temporarily

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Phase 5 — Quality Iteration (current)

Implemented:

- Quality auditors (static, route, coverage, data, functional, RTL, content, security, accessibility, visual, responsive, performance)
- Weighted scoring + confidence when dimensions are skipped (`null` ≠ 1.0)
- Issue fingerprinting, classification, and deduplication
- Acceptance gates (critical / security / build hard stops; skipped browser QA warnings)
- Isolated repair staging + deterministic repairs; optional Codex repairs
- Loopback-only local app runner, health probe, browser QA when Playwright is available
- Artifacts under `.factory/current-quality.json` and `artifacts/quality/<runId>/`
- `npm run quality` and `/demo` through quality after generation

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Phase 6 — Deployment and operations (current)

Implemented:

- Pre-deployment gate: accepted generation + quality, matching source hashes, build/security pass, production `npm audit`, multi-viewport browser QA (`predeploy-cli.ts`, `npm run deployment:gate`)
- Blue/green deployment via PM2, bound to `127.0.0.1` only, with a persistent per-company port allocator and per-company deployment lock (`deploy-cli.ts`, `npm run deploy`)
- Full health verification (pm2 status, port reachability, `/api/health` identity match, main page + one app route, restart-count stability, sanitized logs)
- Rollback to the most recent previous healthy deployment whose release still exists on disk
- `/ops` command + `deployment:*` CLIs: `status`, `health`, `logs`, `restart`, `rollback`, `stop`, `start` — mutating actions require confirmation (Telegram: reply with a short-lived token; CLI: `--yes`)
- Telegram operations are restricted to `TELEGRAM_ADMIN_IDS`; `ssl`, `domain`, and `deploy` are deferred to the CLI only
- Optional `DEMO_AUTO_DEPLOY` auto-deploys a `/demo` result when the requester is an authorized admin and the pre-deployment gate passes
- Public exposure (custom domain + TLS) is a manual, explicitly-configured opt-in (nginx + Certbot/External SSL provider stubs) — never enabled by default

Phase 6 deploys a quality-accepted release to a local port. Public exposure still requires an operator to configure a reverse proxy, a domain pattern, and a TLS provider.
