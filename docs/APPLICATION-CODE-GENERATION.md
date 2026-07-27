# Application Code Generation

Phase 4 turns a ready `CompanyOSBlueprint` into a build-verified Company OS application release.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Entry points

- Telegram / CLI: `/demo <company>` (discover → plan → blueprint → generate when ready)
- CLI: `npm run generate -- "<company name>"`
- Service: `ApplicationGenerationService.generateFromExisting` / `generateWithArtifacts`

## Pipeline

```text
Load knowledge + specification + prompt + blueprint
→ Assert readyForCodeGeneration
→ Verify source hashes
→ Try reuse current release (same blueprint hash, force:false)
→ Build GenerationPlan
→ Ensure staging dirs
→ Copy templates/generated-company-os-v1 → staging
→ DeterministicTemplateProvider (runtime JSON, mock data, brand CSS)
→ Validate source / deps / routes / coverage / mock integrity
→ npm install → typecheck → test → build (SafeCommandRunner)
→ Security scan
→ Promote staging → generated/releases/<generationId>/app
→ Write current-generation.json
```

## Templates

| Path | Role |
|------|------|
| `templates/machine-demo` | Preserved legacy demo; not used by Phase 4 generation |
| `templates/generated-company-os-v1` | Phase 4 shell — Next.js **14.2** / Node **18** |

## Quality gate

Generation requires `blueprint.quality.readyForCodeGeneration === true`. Scoring is documented in [COMPANY-OS-BLUEPRINT](./COMPANY-OS-BLUEPRINT.md). Brief formula: five dimension scores in `[0,1]`; implementation readiness is a weighted blend; blockers force not-ready.

## Idempotency

If `current-generation.json` points at a `PROMOTED` manifest whose `blueprintHash` matches the current blueprint and `force` is false, generation reuses that release without re-copying the template or rebuilding.

## Failure behavior

Any validation, typecheck, test, build, or security failure fails the job and **does not** update `current-generation.json`.

## Related docs

- [GENERATION-PLAN](./GENERATION-PLAN.md)
- [GENERATION-PROVIDERS](./GENERATION-PROVIDERS.md)
- [GENERATED-RELEASES](./GENERATED-RELEASES.md)
- [GENERATED-APP-VALIDATION](./GENERATED-APP-VALIDATION.md)
- [MOCK-DATA-ENGINE](./MOCK-DATA-ENGINE.md)
- [GENERATED-APP-SECURITY](./GENERATED-APP-SECURITY.md)
