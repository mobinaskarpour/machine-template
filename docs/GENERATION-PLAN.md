# Generation Plan

`buildGenerationPlan` produces a validated `GenerationPlan` (schema version `1.0`) before any staging writes.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Contents

- `generationId` — stable id derived from slug + blueprint hash + template hash
- `sourceHashes` — company knowledge, MasterBuildSpecification, Master Prompt, Company OS Blueprint
- `template` — id/version/path/contentHash for `generated-company-os-v1`
- `provider` — e.g. `DETERMINISTIC_TEMPLATE`
- `application` — framework (Next.js), TypeScript, RTL / language flags
- `tasks` — ordered graph (`COPY_TEMPLATE` → render steps → mock data → validate → install → typecheck → test → build)
- `expectedCoverage` — dashboard / module / workflow / agent / entity / role ids
- `policies` — dependency allowlist / forbidden list, max files / bytes, network / postinstall flags

## Validation

`parseGenerationPlan` Zod-parses the document and **rejects duplicate task ids** (`GENERATION_PLAN_INVALID`).

Persisted at:

```text
data/projects/<slug>/.factory/generation-plan.json
```
