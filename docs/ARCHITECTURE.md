# Architecture — Phase 0–5

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
                                   persistence / data/
```

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

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
| `templates/generated-company-os-v1` | Approved Next.js 14.2 / Node 18 application shell |
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
