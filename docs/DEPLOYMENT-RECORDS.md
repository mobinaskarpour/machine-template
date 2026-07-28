# Deployment Records

## Layout

```text
data/projects/<slug>/.factory/
├── current-deployment.json
├── deployment-summary.json
└── deployments/
    └── <deployment-id>.json

data/memory/deployments/<slug>.json
```

## Record fields

Includes deployment id, company ids, generation/quality ids, status
(`PLANNED` | `STARTING` | `HEALTH_CHECKING` | `RUNNING` | `FAILED` | `STOPPED` | `ROLLED_BACK`),
PM2 process name, loopback bind address, port, optional public URL (only after verification),
SSL verified flag, health checks, and timestamps.

Secrets and environment dumps are never persisted.

## Plans

Deployment plans derive from accepted release metadata. No user-provided shell text. Environment allowlists only.
