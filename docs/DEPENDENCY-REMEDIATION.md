# Dependency Remediation

## Strategy

1. Identify vulnerable packages and paths (`npm audit --omit=dev --json`)
2. Prefer smallest compatible patched versions
3. Preserve Node compatibility (control plane remains Node 18.19 unless a validated upgrade path exists)
4. Apply changes in template workspace first
5. Regenerate lockfile deterministically
6. Re-run dependency policy, source policy, typecheck, tests, build, browser QA, security scan, audit
7. Promote only when gates pass

Do **not** use `npm audit fix --force`. Do not silently suppress advisories. Do not add npm `overrides` without runtime testing.

## Template versions

Material framework/runtime changes create a new template version (e.g. `generated-company-os-v2`) and update the registry. Old immutable releases remain historical artifacts.

## Node 18 and Next.js High advisories

Latest Next.js requiring Node ≥20 cannot run on the current system Node. Production audit on `next@14.2.35` clears Critical; remaining High on `next` itself may be accepted **only** for loopback deployments under `GHSA-NEXT-NODE18-LOOPBACK` (see [PREDEPLOYMENT-GATE](./PREDEPLOYMENT-GATE.md)). Public deploy remains blocked without a supported runtime upgrade.
