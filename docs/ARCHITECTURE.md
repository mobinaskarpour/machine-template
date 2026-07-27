# Architecture — Phase 0–3

Modular monolith. Telegram is an adapter only.

```text
telegram/commands → discovery → knowledge → industry → specification → prompts → blueprints
                                         ↓
                                   persistence / data/
```

## Phase 3 modules

| Module | Responsibility |
|--------|----------------|
| `blueprints/` | CompanyOSBlueprint schema, builders, validation, persistence |
| `app/blueprint-cli.ts` | Service-level blueprint CLI |
| `app/migrate-slug-cli.ts` | Dry-run slug migration reporter |

## Slug backward compatibility

Improved Persian transliteration may suggest `zar-makaron` for `زر ماکارون`. Existing workspaces (e.g. `zr-makarvn`) are **not** renamed automatically. `canonicalSlugSuggestion` records the preferred future slug. Use `npm run migrate:slug -- --dry-run` to inspect.

Phase 3 generates an implementation-ready Company OS Blueprint. It does not generate source code, build an application, or deploy anything.
