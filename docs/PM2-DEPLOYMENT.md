# PM2 Deployment

Phase 6 can deploy an accepted application through PM2 after mandatory security and browser gates pass.

Public domain and HTTPS exposure remain configuration-dependent.

## Flow

```text
Accepted release → predeploy gate → deployment plan → port allocation
→ PM2 candidate → loopback health → optional proxy/SSL → persistence
```

## Binding

Applications bind to `127.0.0.1` only. Raw ports are never exposed publicly.

## Process names

Deterministic names: `machine-<company-slug>` (ASCII, length-limited, registry-driven).

## Start command

Uses the generated app’s approved scripts, e.g. npm `start` with hostname/port flags supported by Next.js. Never `0.0.0.0`.

## Blue/green

A candidate process is started and health-checked before any previous healthy process is stopped. On failure the candidate is stopped, its port released, and the prior deployment preserved.

## Persistence

See [DEPLOYMENT-RECORDS](./DEPLOYMENT-RECORDS.md). Startup (`pm2 save` / systemd) is reported separately and is not applied blindly as root.

## CLI

```bash
npm run deploy -- "<company-name>"
npm run deploy -- "<company-name>" --dry-run
npm run deploy -- "<company-name>" --public   # only when domain/proxy configured
```
