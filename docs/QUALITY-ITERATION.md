# Quality Iteration

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Purpose

After Phase 4 promotes a build-verified release, Phase 5:

1. Loads the current generation + blueprint
2. Runs auditors against the release (and optionally a loopback-only local server)
3. Scores dimensions, classifies and deduplicates issues
4. Plans and applies scoped repairs in **staging** (never mutates the source release in place)
5. Re-validates, re-scores, and evaluates acceptance
6. On acceptance, may promote a repaired tree as a new generation; otherwise records rejection reasons

## Entry points

- `/demo` continues through quality after successful generation
- CLI: `npm run quality -- "<company name>" [--force] [--audit-only] [--max-iterations=N]`
- Service: `QualityIterationService.iterateFromExisting`

## Isolation rules

- Repairs copy the release into `generated/staging/quality-<runId>/app/`
- Source release under `generated/releases/<generationId>/app/` is not edited during repair
- Local QA servers bind `127.0.0.1` only (never `0.0.0.0`)
- Runtime processes are killed and verified stopped after QA

## Outcomes

- **Accepted** — quality report + pointer updated; user message states the app has not been deployed
- **Rejected** — blocking reasons recorded; no public URL is created
- **Reused** — matching prior accepted quality run may short-circuit when hashes and policy match

## Related docs

- [QUALITY-SCORING](./QUALITY-SCORING.md)
- [QUALITY-AUDITORS](./QUALITY-AUDITORS.md)
- [AUTOMATED-REPAIR](./AUTOMATED-REPAIR.md)
- [QUALITY-ACCEPTANCE](./QUALITY-ACCEPTANCE.md)
- [QUALITY-ARTIFACTS](./QUALITY-ARTIFACTS.md)
- [VISUAL-QA](./VISUAL-QA.md)
- [ACCESSIBILITY-QA](./ACCESSIBILITY-QA.md)
