# Data layout — Phase 0

```text
data/
├── companies/
│   ├── index.json          # slug → companyId
│   └── <companyId>.json    # CompanyRecord
├── projects-meta/
│   ├── index.json          # slug → projectId
│   └── <projectId>.json    # ProjectRecord
├── jobs/
│   └── <jobId>.json        # JobRecord
├── logs/                   # reserved
└── projects/
    └── <company-slug>/
        ├── .factory/
        │   ├── company.json
        │   ├── project.json
        │   └── state.json
        ├── generated/
        ├── source/
        ├── logs/
        └── artifacts/
```

## Job lifecycle

```text
QUEUED → RUNNING → SUCCEEDED
QUEUED → CANCELLED
RUNNING → FAILED
RUNNING → CANCELLED
```

Invalid transitions raise `INVALID_STATE_TRANSITION`.

## Workspace isolation

Each company slug gets its own directory under `PROJECTS_ROOT`. Reopening an existing workspace does not overwrite identity files unexpectedly; conflicts raise `ALREADY_EXISTS`.


## Phase 1 knowledge

```text
data/memory/companies/<slug>.json
data/projects/<slug>/.factory/knowledge.json
data/projects/<slug>/.factory/history/knowledge/
data/projects/<slug>/artifacts/discovery/<job-id>/
```
