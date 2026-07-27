# THE MACHINE — Autonomous AI Company OS Builder

Phase 0 foundation for an autonomous company OS control plane.

**This phase does not generate companies, dashboards, workflows, agents, or deployments.**

## What Phase 0 provides

- Telegram bot entry (`/start`, `/help`, `/status`, `/demo`, `/edit`, `/ops`)
- Command parsing separated from execution
- Persistent companies, projects, and jobs (filesystem JSON)
- Isolated company workspaces under `data/projects/<slug>/`
- Job lifecycle with validated state transitions
- Safe command runner (absolute `/bin/bash` only when needed)
- Structured logging with secret redaction
- Interfaces for future pipeline modules

## Preserved demo template

The previous Next.js demo UI lives in [`templates/machine-demo/`](templates/machine-demo/) and is **not** part of the Phase 0 runtime.

## Setup

```bash
cd ~/machine-template
cp .env.example .env
# Put a *new rotated* TELEGRAM_BOT_TOKEN in .env (never commit it)
npm install
npm run typecheck
npm test
```

## Run the bot

```bash
npm run bot
# or
npm run dev
```

Required env (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | BotFather token (rotated; never commit) |
| `DATA_ROOT` | Registry/job/log root (default `./data`) |
| `PROJECTS_ROOT` | Company workspaces (default `./data/projects`) |
| `LOG_LEVEL` | Pino level |
| `NODE_ENV` | `development` / `test` / `production` |

## Security notes

- Do **not** paste tokens into chat, commits, or docs.
- If a token was exposed, **rotate it** in BotFather / GitHub before use.
- `.env` is gitignored. `.env.example` contains empty placeholders only.
- Telegram input never becomes a filesystem path directly; slugs are generated centrally.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Phases](docs/PHASES.md)
- [Security](docs/SECURITY.md)
- [Data layout](docs/DATA-LAYOUT.md)

## Next phase

**Phase 1 — Company Discovery and CompanyKnowledge** (not implemented here).
