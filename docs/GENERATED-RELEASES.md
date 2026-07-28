# Generated Releases

After validation and a successful local build + security scan, staging is promoted to an immutable release.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Layout

```text
data/projects/<slug>/generated/
  staging/<jobId>/app/              # working copy (may be retained temporarily)
  releases/<generationId>/app/      # promoted release (no node_modules copy)
```

Pointer:

```text
data/projects/<slug>/.factory/current-generation.json
```

Manifest / build report:

```text
.factory/generation-manifest.json
.factory/build-report.json
```

## Promotion rules

- Never updates the pointer until the release tree copy succeeds
- Never deletes a previous successful release before the new one is promoted
- Symlinks rejected during copy
- `node_modules` excluded from the release tree

## Retention

- Keep the last **3** releases (by mtime, always retaining the just-promoted id)
- Staging directories may remain temporarily for debugging; they are not the supported runtime path

## Idempotency

Matching `blueprintHash` + `PROMOTED` manifest → reuse without rebuild when `force` is false.

## Quality follow-on (Phase 5)

Accepted quality runs may promote a repaired staging tree as a new generation while retaining prior releases under the same retention policy. Repair staging lives under `generated/staging/quality-<runId>/app/` and never mutates the source release during repair. Phase 5 does not deploy or expose the application publicly. See [QUALITY-ITERATION](./QUALITY-ITERATION.md) and [QUALITY-ARTIFACTS](./QUALITY-ARTIFACTS.md).
