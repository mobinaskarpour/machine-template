# Architecture — Phase 0–4

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
                                   persistence / data/
```

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Phase 4 modules

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
- Staging under `generated/staging/` may be retained temporarily for debugging
