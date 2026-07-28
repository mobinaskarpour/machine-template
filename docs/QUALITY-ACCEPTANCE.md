# Quality Acceptance

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Hard gates (`evaluateAcceptance`)

Blocking when any apply:

- Typecheck / tests / production build / route integrity / source hashes / regression / security scan failed
- Unresolved **CRITICAL** issues
- Unresolved blocking **HIGH** issues
- Unresolved **HIGH** or **CRITICAL** **SECURITY** issues
- Score below thresholds (overall, blueprint coverage, data integrity; RTL when required; accessibility when audited)
- High visual score cannot compensate for build or security failure

## Skipped browser QA

When `ALLOW_SKIPPED_BROWSER_QA` is true (default):

- `visualQuality: null` → warning (not auto-fail)
- `accessibility: null` → warning (not auto-fail)
- `responsiveBehavior: null` → warning

When false, null visual/accessibility become blocking reasons.

## User messaging

`formatQualityMessage` always states that the application has **not** been deployed (Persian or English). No public URL is invented on accept or reject.
