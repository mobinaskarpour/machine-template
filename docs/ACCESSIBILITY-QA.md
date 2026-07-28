# Accessibility QA

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Layers

1. **Source heuristics** (`auditAccessibility`) — buttons without accessible names, images without alt, and related static checks under `src/`
2. **Browser / axe** (when available) — deeper checks during loopback browser QA

## Scoring

- Source checks produce a numeric score when they run
- Full browser axe verification may be skipped; acceptance then warns rather than auto-failing when `ALLOW_SKIPPED_BROWSER_QA` is true
- When accessibility is scored below `ACCEPTANCE_THRESHOLDS.accessibility` (0.8), acceptance blocks

## Honesty

Skipped browser a11y is reported as a warning (or blocking reason if skip policy is disabled). The user-facing quality message includes an accessibility status string without claiming full WCAG certification.
