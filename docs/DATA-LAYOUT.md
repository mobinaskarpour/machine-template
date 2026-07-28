# Data layout — Phase 6

```text
data/
├── memory/
│   ├── companies/<slug>.json
│   ├── specifications/<slug>.json
│   ├── blueprints/<slug>.json
│   ├── quality/<slug>.json
│   ├── deployments/<slug>.json          # mirror of current-deployment.json
│   ├── ports/allocations.json           # persistent port ↔ company-color map
│   ├── ops-confirmations.json           # single-use Telegram confirmation tokens (5 min TTL)
│   └── generations/                     # reserved mirror root (.gitkeep)
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
    │   ├── current-deployment.json      # active deployment record pointer
    │   ├── deployment-summary.json
    │   ├── deployment.lock              # held only while a deploy/rollback is in flight
    │   ├── operations-audit/            # one JSON file per /ops action (append-only)
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
        ├── quality/<qualityRunId>/
        ├── predeploy/<gateId>/           # pre-deployment gate result + browser QA screenshots
        └── deployment/deployments/       # per-deployment records + sanitized manifests
```

Runtime artifacts under `data/projects/` are gitignored.

Phase 6 deploys a quality-accepted release to a local port. Public exposure still requires an operator to configure a reverse proxy, a domain pattern, and a TLS provider.

See [QUALITY-ARTIFACTS](./QUALITY-ARTIFACTS.md) and [DEPLOYMENT](./DEPLOYMENT.md).
