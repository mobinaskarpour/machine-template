# Automated Repair

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Flow

```text
Release app (immutable source)
  → prepareRepairStaging (copy under generated/staging/quality-<runId>/app)
  → buildRepairPlan (deterministic / Codex / manual strategies)
  → RepairProvider.repair(staging only)
  → validateRepairOutput (path policy + optional checks)
  → re-audit / re-score / acceptance
```

## Providers

| Provider | Role |
|----------|------|
| `DeterministicRepairProvider` | Safe scoped fixes (e.g. `lang`/`dir` on layout, demo labels, lorem → empty-state text) |
| `CodexCliRepairProvider` | Optional bounded Codex repairs when enabled |
| `FixtureRepairProvider` | Test double |

## Safety

- Staging copy excludes `.git`, `.env*`, `.next`, `node_modules`, `logs`
- Symlinks rejected
- Repair paths must pass `isAllowedRepairPath` (no env/docker/pm2/control-plane files)
- Source release is never modified by the repair provider
- Max iterations and per-issue attempt caps apply (`MAX_ITERATIONS`, `MAX_REPAIR_ATTEMPTS_PER_ISSUE`, `MAX_CODEX_REPAIRS`)

## Related

- [QUALITY-ITERATION](./QUALITY-ITERATION.md)
- [QUALITY-ARTIFACTS](./QUALITY-ARTIFACTS.md)
