# Quality Auditors

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Auditor set

| Auditor | Focus |
|---------|--------|
| static-source | Source policy, forbidden patterns, structural integrity |
| route | Route integrity vs blueprint / runtime |
| blueprint-coverage | Dashboards, modules, workflows, agents, entities, roles |
| business-data | Mock / business data integrity |
| functional | Core functional expectations (shell, auth label, settings) |
| rtl | `lang` / `dir` and RTL layout signals |
| content | Placeholder / lorem / empty content quality |
| security | Generated-app security scan findings |
| accessibility | Source a11y heuristics; axe when browser QA available |
| visual | Browser visual QA (skipped when unavailable) |
| responsive | Viewport / responsive heuristics |
| performance | Lightweight performance signals |

## Scoring honesty

- Auditors may return `score: null` with a `skipped` reason when a capability is unavailable (e.g. no Playwright)
- Null scores reduce overall **confidence**; they are not counted as perfect
- Issues are fingerprinted, classified (severity / blocking), and deduplicated

## Browser-dependent auditors

Visual and full axe accessibility require a loopback local app + Playwright. When unavailable, policy may allow acceptance with warnings — see [VISUAL-QA](./VISUAL-QA.md), [ACCESSIBILITY-QA](./ACCESSIBILITY-QA.md), and [QUALITY-ACCEPTANCE](./QUALITY-ACCEPTANCE.md).
