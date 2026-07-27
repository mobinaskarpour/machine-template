# Architecture — Phase 0–2

## Shape

Modular monolith. Business logic does not import Telegram.

```text
telegram/  →  commands/parse  →  commands/execute
                                   ↓
         discovery → knowledge → industry → specification → prompts
                                   ↓
                              persistence/
                                   ↓
                                 data/
```

`runners/SafeCommandRunner` is available for future deploy/ops tasks. It is **not** exposed to arbitrary Telegram text.

## Modules

| Module | Responsibility |
|--------|----------------|
| `app/` | Composition root, discover/plan CLIs |
| `telegram/` | Telegraf wiring only |
| `commands/` | Deterministic parsers + handlers |
| `discovery/` | Company discovery orchestrator |
| `knowledge/` | CompanyKnowledge schema + dual persistence |
| `industries/` | Packs, resolver, industry engine |
| `specifications/` | MasterBuildSpecification |
| `prompts/` | Master Prompt builder + planning service |
| `jobs/` | Job lifecycle / transitions |
| `registry/` | Company resolution + slug service |
| `workspaces/` | Isolated project directories |
| `persistence/` | Repository interfaces + FS JSON impl |
| `runners/` | Safe spawn / `/bin/bash -lc` |
| `config/` | Zod-validated env |
| `logging/` | Pino + redaction hooks |
| `security/` | Path guards, SSRF, secret redaction |
| `shared/` | Errors, ids, Zod domain schemas |
| `future/` | Pipeline contracts (no real impl) |

## Phase 2 note

Phase 2 prepares canonical planning artifacts. It does not generate, build, or deploy a company application.
