# Architecture — Phase 0

## Shape

Modular monolith. Business logic does not import Telegram.

```text
telegram/  →  commands/parse  →  commands/execute
                                   ↓
                    registry / jobs / workspaces
                                   ↓
                              persistence/
                                   ↓
                                 data/
```

`runners/SafeCommandRunner` is available for future deploy/ops tasks. It is **not** exposed to arbitrary Telegram text.

## Modules

| Module | Responsibility |
|--------|----------------|
| `app/` | Composition root, process entry |
| `telegram/` | Telegraf wiring only |
| `commands/` | Deterministic parsers + handlers |
| `jobs/` | Job lifecycle / transitions |
| `registry/` | Company resolution + slug service |
| `workspaces/` | Isolated project directories |
| `persistence/` | Repository interfaces + FS JSON impl |
| `runners/` | Safe spawn / `/bin/bash -lc` |
| `config/` | Zod-validated env |
| `logging/` | Pino + redaction hooks |
| `security/` | Path guards + secret redaction |
| `shared/` | Errors, ids, Zod domain schemas |
| `future/` | Pipeline contracts (no real impl) |

## Dependency direction

- Handlers depend on services/repositories.
- Repositories do not depend on Telegram.
- Future generators depend on contracts, not Telegraf.
- Codex CLI must sit behind `CodeGenerationProvider` later.

## Persistence decision

**One JSON file per record** under:

- `data/companies/<id>.json` (+ `index.json` slug map)
- `data/projects-meta/<id>.json` (+ `index.json`)
- `data/jobs/<id>.json`

Writes use temp file + `fsync` + `rename`. Index updates use an in-process mutex.

Workspace trees live separately under `PROJECTS_ROOT/<company-slug>/`.
