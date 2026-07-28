# Visual QA

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Scope

Visual QA captures route screenshots and console errors via a browser runner when Playwright is already resolvable. It never downloads browsers as a side effect of detection.

## Runtime constraints

- App started with `startLocalApp` on **127.0.0.1** only
- Health probed with `probeHealth` before navigation
- Process tree killed and verified stopped afterward

## When skipped

If Playwright is unavailable or the browser runner does not execute, `auditVisual` returns `score: null` with a skip reason. Acceptance may proceed with a warning when `ALLOW_SKIPPED_BROWSER_QA` is true — the system does **not** claim full visual verification.

High visual scores never override build or security failures.
