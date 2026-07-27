# Phases

## Phase 0 — Core Foundation (current)

Implemented:

- Telegram command router
- Job lifecycle + persistence
- Company/project registry
- Workspace manager
- Safe config + logging
- Safe command runner
- Future module interfaces
- Infrastructure tests

Intentionally **not** implemented:

- company research / website discovery
- CompanyKnowledge generation
- industry-specific generation
- master prompt construction
- OS blueprint generation
- brand / dashboards / workflows / AI agents / mock data generation
- application build & deploy
- scoped file edits
- ops restart / SSL / log streaming via shell
- Codex CLI execution

## Phase 1 — Company Discovery and CompanyKnowledge (next)

Recommended next step only. Not started in this repository state.

Will add real discovery adapters and a validated knowledge model, still without full OS generation.

## Later phases (planned)

- Industry engine + master prompt
- Blueprint + generators
- Quality iteration
- Deployment + persist knowledge
- Edit / ops loop
