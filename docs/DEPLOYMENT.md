# Deployment (Phase 6)

Deploys a quality-accepted release to a local port under process supervision (pm2), bound to `127.0.0.1` only. Public exposure is a separate, explicit opt-in — never automatic.

## Pre-deployment gate

`npm run deployment:gate -- "<company name>" [--public]`

Loads the current accepted generation + quality report and re-verifies, in order:

1. An accepted generation exists (`current-generation.json`)
2. Quality gate accepted **that same** generation (`current-quality.json.generationId` matches)
3. The release directory's content hash still matches the accepted quality report's hash (nothing changed underneath it)
4. Build and security auditors passed
5. The release directory still exists on disk (immutability check)
6. Production dependency audit (`npm audit --omit=dev --json`) — see policy below
7. Browser QA across 4 viewports (1440×900, 1280×800, 768×1024, 390×844) when Playwright is available — **required** only when `--public` is requested; otherwise a warning

Any skipped *required* check is treated as a failure — the gate never silently waves through an unverified deployment. The result is persisted under `artifacts/predeploy/<gateId>/gate-result.json`.

### Dependency advisory policy

- Any **critical** advisory blocks unconditionally.
- Any **high** advisory blocks, *unless*: the deployment is loopback-only (no `--public`), `DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK=true` (default), the only high-severity package is `next` itself, and the installed Next.js version is the pinned `14.2.3x` line (the newest release Node 18.19 can run). That single exception is recorded as accepted risk `GHSA-NEXT-NODE18-LOOPBACK` and revisited once the runtime moves to a newer Node.

## Deploy

`npm run deploy -- "<company name>" [--public] [--dry-run]`

1. Acquires a per-company deployment lock (`.factory/deployment.lock`, stale after 15 minutes or a dead PID)
2. Re-runs the pre-deployment gate; aborts with `PREDEPLOY_GATE_FAILED` if it does not pass
3. Allocates a port from `DEPLOYMENT_PORT_MIN`–`DEPLOYMENT_PORT_MAX` (persistent, reused across restarts for the same company+color)
4. Starts the new release under a **blue/green** pm2 process name (`machine-<slug>-blue` / `-green`), distinct from whatever is currently live
5. Polls full health verification until healthy or a timeout; on failure the new process is torn down and the previous deployment is left running untouched
6. On success, promotes the new deployment to "current" and stops/deletes the previous color's pm2 process
7. Writes a sanitized deployment manifest (identifiers, port, status — no secrets) under `artifacts/deployment/deployments/`

## Health verification

Every health check (`npm run deployment:health`) validates all of:

- pm2 reports the process `online`
- The allocated port accepts TCP connections
- `GET /api/health` returns JSON whose `companySlug` and `generationId` match the deployment record
- The main page and one non-root app route both return a non-5xx response
- Restart count stays below 5 (a rapidly crash-looping process is never called "healthy")
- A sanitized tail of recent logs

## Rollback

`npm run deployment:rollback -- "<company name>" --yes`

Finds the most recent **other** deployment (different generation, not current) that was last recorded `HEALTHY` and whose release directory still exists on disk, then redeploys it via the same blue/green flow.

## Public exposure

Off by default (`DEPLOYMENT_PUBLIC_ENABLED=false`). Enabling it requires:

- `DEPLOYMENT_PUBLIC_ENABLED=true`
- `NGINX_CONFIG_ROOT` and a valid `DEPLOYMENT_DOMAIN_PATTERN` (must contain `{slug}`, e.g. `{slug}.apps.example.com`)
- `SSL_PROVIDER=CERTBOT` (with `CERTBOT_EMAIL`) or `SSL_PROVIDER=EXTERNAL`

Both the nginx reverse-proxy and SSL provisioning are intentionally stub implementations that validate configuration and report intent; they do not write nginx config or invoke `certbot` on your behalf. Until an operator configures and completes that infrastructure, `--public` deploys fail closed with `DEPLOYMENT_PUBLIC_NOT_CONFIGURED`.

## CLIs

| Command | Action |
|---------|--------|
| `npm run deployment:gate -- "<company>"` | Evaluate the pre-deployment gate only |
| `npm run deploy -- "<company>"` | Full blue/green deploy |
| `npm run deployment:status -- "<company>"` | Current deployment record + provider status |
| `npm run deployment:health -- "<company>"` | Full health verification |
| `npm run deployment:logs -- "<company>"` | Sanitized recent logs |
| `npm run deployment:restart -- "<company>" --yes` | Restart the live process |
| `npm run deployment:stop -- "<company>" --yes` | Stop the live process |
| `npm run deployment:start -- "<company>" --yes` | Start a stopped process |
| `npm run deployment:rollback -- "<company>" --yes` | Roll back to the last healthy prior deployment |

See [OPERATIONS](./OPERATIONS.md) for the `/ops` chat equivalents and authorization model.
