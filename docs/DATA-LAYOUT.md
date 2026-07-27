# Data layout — Phase 3

```text
data/
├── memory/
│   ├── companies/<slug>.json
│   ├── specifications/<slug>.json
│   └── blueprints/<slug>.json
└── projects/<slug>/.factory/
    ├── knowledge.json
    ├── industry-resolution.json
    ├── master-build-specification.json
    ├── master-prompt.json
    ├── master-prompt.txt
    ├── company-os-blueprint.json
    ├── company-os-blueprint-summary.json
    └── history/
        ├── knowledge/
        ├── specifications/
        ├── prompts/
        └── blueprints/
```

Runtime artifacts are gitignored.
