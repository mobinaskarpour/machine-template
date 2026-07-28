# Pre-Deployment Gate

Phase 6 can deploy an accepted application through PM2 after mandatory security and browser gates pass.

Public domain and HTTPS exposure remain configuration-dependent.

## Purpose

A release is **deployable** only when every required check passes. Quality score and production build success cannot override a mandatory failure.

## Checks

| Check | Required |
|---|---|
| Generation accepted / present | yes |
| Quality accepted | yes |
| Source hashes match immutable release | yes |
| Dependency production audit | yes |
| Browser smoke QA | yes |
| Critical visual / RTL / a11y issues clear | yes |
| Typecheck / tests / build | yes |
| Security scan | yes |
| Release immutable | yes |

A skipped required gate is **not** a pass.

## Dependency rules

1. Unresolved **Critical** advisories always block.
2. **High** advisories block by default.
3. Narrow loopback-only exception: when `DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK=true`, public exposure is not requested, and the only High package is `next` on the Node-18-compatible `14.2.3x` line, risk id `GHSA-NEXT-NODE18-LOOPBACK` may be recorded. Public deploy never uses this exception.

## Persistence

Results are stored under:

```text
data/projects/<slug>/artifacts/predeploy/<predeploy-run-id>/
```

## Stable errors

`PREDEPLOY_GENERATION_NOT_ACCEPTED`, `PREDEPLOY_QUALITY_NOT_ACCEPTED`, `PREDEPLOY_SOURCE_MISMATCH`, `PREDEPLOY_DEPENDENCY_BLOCKER`, `PREDEPLOY_BROWSER_QA_REQUIRED`, `PREDEPLOY_BUILD_FAILED`, `PREDEPLOY_SECURITY_FAILED`, `PREDEPLOY_RELEASE_NOT_IMMUTABLE`, `PREDEPLOY_GATE_FAILED`.

## CLI

```bash
npm run deployment:gate -- "<company-name>"
```

See also [DEPENDENCY-REMEDIATION](./DEPENDENCY-REMEDIATION.md), [PM2-DEPLOYMENT](./PM2-DEPLOYMENT.md).

## CLI name note

npm treats a script named `predeploy` as a lifecycle hook for `deploy`, which
would run the gate without arguments before every deploy. Use:

```bash
npm run deployment:gate -- "<company-name>"
```
