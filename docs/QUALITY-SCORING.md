# Quality Scoring

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Policy version

`QUALITY_POLICY_VERSION` (currently `1.0`) is recorded on every quality run and report.

## Dimension weights

`QUALITY_WEIGHTS` must sum to **1.00**:

| Dimension | Weight |
|-----------|--------|
| buildIntegrity | 0.14 |
| functionalCorrectness | 0.14 |
| blueprintCoverage | 0.12 |
| dataIntegrity | 0.10 |
| visualQuality | 0.10 |
| responsiveBehavior | 0.08 |
| rtlCorrectness | 0.08 |
| accessibility | 0.08 |
| performance | 0.05 |
| security | 0.07 |
| contentQuality | 0.04 |

## Overall score

`computeOverallScore`:

- Skips `null` / `undefined` dimensions
- Renormalizes weights among present dimensions
- **Never** treats null as `1.0`
- `confidence` = present weight / total weight (nulls lower confidence)

## Acceptance thresholds

From `ACCEPTANCE_THRESHOLDS`:

| Gate | Minimum |
|------|---------|
| overall | 0.85 |
| blueprintCoverage | 0.90 |
| dataIntegrity | 0.90 |
| accessibility | 0.80 (when audited) |
| rtlCorrectness | 0.90 (when RTL required) |

See [QUALITY-ACCEPTANCE](./QUALITY-ACCEPTANCE.md).
