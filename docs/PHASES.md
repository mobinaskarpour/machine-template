# Phases

## Phase 0 — Core Foundation

Implemented:

- Telegram command router
- Job lifecycle + persistence
- Company/project registry
- Workspace manager
- Safe config + logging
- Safe command runner
- Future module interfaces
- Infrastructure tests

## Phase 1 — Company Discovery and CompanyKnowledge (current)

Implemented:

- `/demo` discovery pipeline with optional `| website`
- Search provider interfaces (Tavily/Serper)
- SSRF-safe website fetch
- Deterministic extraction + synthesis
- Optional Codex synthesis adapter
- CompanyKnowledge schema, validation, confidence
- Dual persistence (workspace + memory)
- Discovery artifacts + knowledge history
- `npm run discover` CLI
- Phase 1 tests

Still **not** implemented:

- Master Prompt Builder
- Industry Engine (beyond light classification)
- OS Blueprint / application generation
- dashboards, workflows, AI agents, mock data generation
- quality iteration for generated apps
- PM2 / Docker / Vercel deploy
- `/edit` execution
- `/ops restart` / `/ops ssl`

## Phase 2 — Master Prompt Builder and Industry Engine (next)

Not started.

## Later phases (planned)

- Blueprint + generators
- Quality iteration
- Deployment + persist knowledge loop
- Edit / ops loop
