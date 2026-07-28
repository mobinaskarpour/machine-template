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
- Approved template copy (`templates/generated-company-os-v1`, Next 14.2 / Node 18)
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

## Phase 6 — Deployment and public exposure (next)

Not started.

Public deployment via PM2 (or equivalent process supervision), TLS, ops restart, and exposing a generated Company OS on a public URL.
