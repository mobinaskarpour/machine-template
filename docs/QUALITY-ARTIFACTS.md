# Quality Artifacts

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Layout

```text
data/projects/<slug>/
  .factory/
    current-quality.json          # pointer to last quality outcome
    quality-summary.json          # compact summary
  artifacts/quality/<qualityRunId>/
    quality-run.json
    quality-report.json
    issues.json
    repair-plan-*.json
    repair-manifest-*.json
    screenshots/                  # when browser QA ran
  generated/
    staging/quality-<qualityRunId>/app/   # repair workspace
    releases/<generationId>/app/          # immutable releases
```

Optional memory mirror root: `data/memory/quality/` (reserved).

## Retention / safety

- Quality run ids reject `..` and path separators
- Artifacts store sanitized evidence (no secrets, no absolute host paths in user messages)
- Staging quality trees are ephemeral repair workspaces, not public runtimes
