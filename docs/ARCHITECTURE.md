# Architecture — Phase 0–6

Modular monolith. Telegram is an adapter only.

```text
telegram/commands
  → discovery → knowledge → industry → specification → prompts → blueprints
                                                                        ↓
                                                              generation plan
                                                                        ↓
                                              template copy → provider → validate
                                                                        ↓
                                              install/typecheck/test/build (local)
                                                                        ↓
                                              security scan → promote release
                                                                        ↓
                                              quality auditors → score → repair staging
                                                                        ↓
                                              acceptance → quality artifacts
                                                                        ↓
                                              pre-deployment gate (audit + browser QA)
                                                                        ↓
                                              blue/green deploy (pm2, 127.0.0.1) → health
                                                                        ↓
                                              /ops + deployment:* CLIs (status/health/logs/
                                              restart/rollback/stop/start)
                                         ↓
                                   persistence / data/
```

Phase 6 deploys a quality-accepted release to a local port and exposes operator-facing lifecycle commands. Public exposure (custom domain + TLS) remains a manual, explicit opt-in.

## Phase 6 modules

| Module | Responsibility |
|--------|----------------|
| `deployment/` | Pre-deployment gate, dependency audit, advisory policy, port allocator, deployment lock, plan/record schemas, repository, manifest, health verifier, blue/green orchestrator, rollback, service façade |
| `deployment/providers/` | `DeploymentProvider` interface; `Pm2DeploymentProvider` (production) |
| `deployment/proxy/` + `deployment/ssl/` | Nginx reverse-proxy stub + Certbot/External SSL stub — both require explicit configuration before public exposure is possible |
| `operations/` | `/ops` action types, authorization policy (CLI trusted, Telegram admin allowlist), audit trail, confirmation-token service |
| `app/predeploy-cli.ts`, `app/deploy-cli.ts`, `app/deployment-ops-cli.ts` | Service-level deployment/operations CLIs |

See [DEPLOYMENT](./DEPLOYMENT.md) and [OPERATIONS](./OPERATIONS.md).

## Phase 5 modules

| Module | Responsibility |
|--------|----------------|
| `quality/` | Iteration service, scoring, acceptance, issue schemas |
| `quality/auditors/` | Static, route, coverage, data, functional, RTL, content, security, a11y, visual, responsive, performance |
| `quality/repair/` | Staging copy, planner, validators, deterministic / Codex providers |
| `quality/runtime/` | Loopback local app runner, health probe, browser QA, process cleanup |
| `app/quality-cli.ts` | Service-level quality CLI |

## Phase 4 modules (still active)

| Module | Responsibility |
|--------|----------------|
| `generation/` | Plan, template copy, providers, mock data, validators, build, promote |
| `generation/providers/` | Deterministic template provider (default); Codex CLI optional |
| `app/generate-cli.ts` | Service-level generation CLI |
| `templates/generated-company-os-v2` | Approved Next.js 14.2 / Node 18 application shell (includes `/api/health`) |
| `templates/machine-demo` | Preserved legacy demo template (not the Phase 4 shell) |

## Phase 3 modules (still active)

| Module | Responsibility |
|--------|----------------|
| `blueprints/` | CompanyOSBlueprint schema, builders, validation, persistence |
| `app/blueprint-cli.ts` | Service-level blueprint CLI |
| `app/migrate-slug-cli.ts` | Dry-run slug migration reporter |

## Slug backward compatibility

Improved Persian transliteration may suggest `zar-makaron` for `زر ماکارون`. Existing workspaces (e.g. `zr-makarvn`) are **not** renamed automatically. `canonicalSlugSuggestion` records the preferred future slug. Use `npm run migrate:slug -- --dry-run` to inspect.

## Release retention

- Last **3** promoted releases are retained under `generated/releases/`
- Staging under `generated/staging/` may be retained temporarily for debugging (including `quality-<runId>` repair trees)
