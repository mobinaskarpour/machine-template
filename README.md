# THE MACHINE — Autonomous AI Company OS Builder

Phase 2: company discovery, Industry Engine, MasterBuildSpecification, and Master Prompt planning.

## What works now

- Telegram bot commands (`/start`, `/help`, `/status`, `/demo`, `/edit`, `/ops`)
- `/demo <company>` discovery → planning (when knowledge is READY)
- `/demo <company> | https://site` explicit website discovery, then planning
- Safe public web fetch (SSRF protections)
- Deterministic extraction + knowledge synthesis
- Industry pack resolution (10 packs)
- MasterBuildSpecification merge + prioritization
- Master Prompt builder (canonical inputs only)
- Dual persistence for knowledge and specifications
- CLI: `npm run discover -- "Company" [url]`
- CLI: `npm run plan -- "Company"`

## Not implemented yet

Application generation, dashboards/workflows/agents execution, deploy, scoped edits, ops restart/SSL.

Phase 2 prepares canonical planning artifacts. It does **not** generate, build, or deploy a company application.

## Setup

```bash
cp .env.example .env
# set TELEGRAM_BOT_TOKEN (rotated) and optional TAVILY_API_KEY / SERPER_API_KEY
npm install
npm run typecheck
npm test
npm run bot
```

## Example verification (fixture / explicit website)

```bash
npm run discover -- "زر ماکارون" "https://www.zarmacaron.com/"
npm run plan -- "زر ماکارون"
```

## Docs

- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [PHASES](docs/PHASES.md)
- [INDUSTRY-ENGINE](docs/INDUSTRY-ENGINE.md)
- [INDUSTRY-PACKS](docs/INDUSTRY-PACKS.md)
- [MASTER-BUILD-SPECIFICATION](docs/MASTER-BUILD-SPECIFICATION.md)
- [MASTER-PROMPT](docs/MASTER-PROMPT.md)
- [COMPANY-DISCOVERY](docs/COMPANY-DISCOVERY.md)
- [COMPANY-KNOWLEDGE](docs/COMPANY-KNOWLEDGE.md)
- [DISCOVERY-PROVIDERS](docs/DISCOVERY-PROVIDERS.md)
- [SECURITY](docs/SECURITY.md)
- [DATA-LAYOUT](docs/DATA-LAYOUT.md)

Previous Next.js demo template is preserved under `templates/machine-demo/`.
