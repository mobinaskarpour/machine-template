# Data layout — Phase 5

```text
data/
├── memory/
│   ├── companies/<slug>.json
│   ├── specifications/<slug>.json
│   ├── blueprints/<slug>.json
│   ├── generations/          # reserved mirror root (.gitkeep)
│   └── quality/              # reserved mirror root
└── projects/<slug>/
    ├── .factory/
    │   ├── knowledge.json
    │   ├── industry-resolution.json
    │   ├── master-build-specification.json
    │   ├── master-prompt.json
    │   ├── master-prompt.txt
    │   ├── company-os-blueprint.json
    │   ├── company-os-blueprint-summary.json
    │   ├── generation-plan.json
    │   ├── generation-manifest.json
    │   ├── build-report.json
    │   ├── current-generation.json
    │   ├── current-quality.json
    │   ├── quality-summary.json
    │   └── history/
    │       ├── knowledge/
    │       ├── specifications/
    │       ├── prompts/
    │       └── blueprints/
    ├── generated/
    │   ├── staging/<jobId>/app/                 # generation staging
    │   ├── staging/quality-<runId>/app/         # quality repair staging
    │   └── releases/<generationId>/app/         # immutable promoted release (keep last 3)
    └── artifacts/
        ├── generation/<jobId>/
        └── quality/<qualityRunId>/
```

Runtime artifacts under `data/projects/` are gitignored.

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

See [QUALITY-ARTIFACTS](./QUALITY-ARTIFACTS.md).
