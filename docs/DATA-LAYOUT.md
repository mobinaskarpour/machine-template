# Data layout — Phase 4

```text
data/
├── memory/
│   ├── companies/<slug>.json
│   ├── specifications/<slug>.json
│   ├── blueprints/<slug>.json
│   └── generations/          # reserved mirror root (.gitkeep)
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
    │   └── history/
    │       ├── knowledge/
    │       ├── specifications/
    │       ├── prompts/
    │       └── blueprints/
    ├── generated/
    │   ├── staging/<jobId>/app/     # ephemeral / may be retained temporarily
    │   └── releases/<generationId>/app/  # immutable promoted release (keep last 3)
    └── artifacts/generation/<jobId>/
```

Runtime artifacts under `data/projects/` are gitignored. Generation artifacts live under projects (already ignored); `data/memory/generations/` is reserved for optional future mirrors.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.
