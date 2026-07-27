# THE MACHINE — Autonomous AI Company OS Builder

Phase 1: company discovery and structured CompanyKnowledge.

## What works now

- Telegram bot commands (`/start`, `/help`, `/status`, `/demo`, `/edit`, `/ops`)
- `/demo <company>` discovery job pipeline
- `/demo <company> | https://site` explicit website discovery
- Safe public web fetch (SSRF protections)
- Deterministic extraction + knowledge synthesis
- Dual persistence: workspace + central memory
- CLI: `npm run discover -- "Company" [url]`

## Not implemented yet

Application generation, dashboards/workflows/agents, deploy, scoped edits, ops restart/SSL.

## Setup

```bash
cp .env.example .env
# set TELEGRAM_BOT_TOKEN (rotated) and optional TAVILY_API_KEY
npm install
npm run typecheck
npm test
npm run bot
```

## Docs

- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [PHASES](docs/PHASES.md)
- [COMPANY-DISCOVERY](docs/COMPANY-DISCOVERY.md)
- [COMPANY-KNOWLEDGE](docs/COMPANY-KNOWLEDGE.md)
- [DISCOVERY-PROVIDERS](docs/DISCOVERY-PROVIDERS.md)
- [SECURITY](docs/SECURITY.md)
- [DATA-LAYOUT](docs/DATA-LAYOUT.md)

Previous Next.js demo template is preserved under `templates/machine-demo/`.
