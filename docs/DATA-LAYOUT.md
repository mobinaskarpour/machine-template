# Data layout — Phase 2

```text
data/
├── companies/
│   ├── index.json
│   └── <companyId>.json
├── projects-meta/
│   ├── index.json
│   └── <projectId>.json
├── jobs/
│   └── <jobId>.json
├── memory/
│   ├── companies/<slug>.json              # knowledge mirror
│   └── specifications/<slug>.json         # specification mirror
└── projects/
    └── <company-slug>/
        ├── .factory/
        │   ├── knowledge.json
        │   ├── industry-resolution.json
        │   ├── master-build-specification.json
        │   ├── master-prompt.json
        │   ├── master-prompt.txt
        │   └── history/
        │       ├── knowledge/
        │       ├── specifications/
        │       └── prompts/
        ├── generated/          # reserved (Phase 3+)
        ├── source/             # reserved
        ├── logs/
        └── artifacts/
```

Runtime company data is gitignored. Do not commit discovery or planning artifacts.
