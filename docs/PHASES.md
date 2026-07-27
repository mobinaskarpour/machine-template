# Phases

## Phase 0 — Core Foundation

Implemented: Telegram router, jobs, registry, workspaces, safe config/logging/runner, tests.

## Phase 1 — Company Discovery and CompanyKnowledge

Implemented: `/demo` discovery, Tavily/Serper adapters, SSRF-safe fetch, CompanyKnowledge dual persistence, `npm run discover`.

## Phase 2 — Master Prompt Builder and Industry Engine (current)

Implemented:

- Industry Pack schema + 10 packs (general, manufacturing, construction, real-estate, medical, education, legal, oil-gas, steel, banking)
- Deterministic industry resolution (Persian + English aliases)
- MasterBuildSpecification merge, prioritization, confidence, readiness
- Master Prompt builder with stable sections and hashes
- Persistence under `.factory/` + `data/memory/specifications/`
- `/demo` continues into planning when knowledge is READY
- `npm run plan -- "Company"`
- Phase 2 tests (Zar Macaron primary fixture)

Phase 2 prepares canonical planning artifacts. It does **not** generate, build, or deploy a company application.

Still **not** implemented:

- OS Blueprint / application generation
- Executable dashboards, workflows, or AI agents
- Quality iteration for generated apps
- PM2 / Docker / Vercel deploy
- `/edit` execution
- `/ops restart` / `/ops ssl`

## Phase 3 — Company OS Blueprint Generation (next)

Not started.
