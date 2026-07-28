# Security — Phase 0–6

## Secrets

Never commit:

- `TELEGRAM_BOT_TOKEN`
- `GITHUB_TOKEN` / PATs
- `OPENAI_API_KEY`
- Codex auth files
- deployment credentials

`.env` is ignored. `.env.example` has empty placeholders.

If a secret was pasted into chat or logs: **rotate it immediately** and do not reuse the exposed value.

## Path safety

- All workspace paths resolve under `PROJECTS_ROOT`.
- Slugs are generated centrally; Telegram text is not used as a path.
- `resolveUnderRoot` rejects `..` traversal and escapes.
- Generation staging / release IDs reject `..` and path separators.

## Command execution

- Direct commands: `spawn(absoluteExecutable, args)` with `shell: false`.
- Bash: only `spawn("/bin/bash", ["-lc", command])`.
- Never `spawn("bash")`.
- Child env is an explicit allowlist (secrets excluded).
- Timeouts kill the child process.
- Telegram ops text never reaches the shell in Phase 0.
- Generated-app install / typecheck / test / build use the same SafeCommandRunner with an npm allowlist.

## Logging

Pino hooks redact Telegram bot tokens, GitHub PATs, bearer tokens, and credential URLs.

Do not log full `process.env`.

## Data

Do not store secrets under `data/`, `.factory/` workspace metadata, or job outputs.

## Phase 1 additions

- SSRF-safe URL validation and redirect checks
- Untrusted webpage content delimiting / prompt-injection warnings
- Discovery artifacts store redacted text samples only (not secrets)

## Phase 2 additions

- Master Prompt never receives raw HTML or search payloads
- No application generation or deployment from planning
- Agents remain specification records only
- Runtime knowledge/specification mirrors stay gitignored

## Phase 3 additions

- Blueprint never contains raw research HTML or live secrets
- Agents remain non-executing planning records
- Slug migration never runs automatically at startup
- Runtime blueprints stay gitignored

## Phase 4 additions

- Template copy rejects symlinks and excludes `.env*`, `node_modules`, `.next`
- Generated source path policy + dependency allowlist / forbidden packages
- Mock data uses synthetic names (no real personal identities from research)
- Security scan blocks high-severity patterns before promotion
- Promotion never updates `current-generation.json` until the release copy succeeds
- Failed builds do not promote
- Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Phase 5 additions

- Quality repair staging copies under `generated/staging/quality-<runId>/` — never edits the source release in place during repair
- Staging copy rejects symlinks and excludes `.env*`, `node_modules`, `.next`, `.git`
- Repair path policy blocks env/docker/pm2/control-plane files
- Local QA servers bind `127.0.0.1` only; process trees are killed and verified stopped
- Browser QA never triggers Playwright browser downloads as a side effect of detection
- High/critical security issues and failed security scans block acceptance even with high visual scores
- User-facing quality messages never include absolute paths, secrets, or claim deployment

Phase 5 audits and repairs a generated application in an isolated release workflow. It does not deploy or expose the application publicly.

## Phase 6 additions

- Deployments never bind `0.0.0.0`; `DEPLOYMENT_BIND_ADDRESS` is validated to equal `127.0.0.1` at config load and every pm2/health-check call hard-codes loopback
- Production dependency audit (`npm audit --omit=dev --json`) blocks on any critical advisory; high advisories block unless the sole affected package is `next` on the pinned `14.2.3x` line, the deployment is loopback-only, and the operator opted in via `DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK` — recorded as accepted risk `GHSA-NEXT-NODE18-LOOPBACK`, and never applied once public exposure is requested
- pm2 process names are derived only from the validated company slug (`buildProcessName`), never from raw user text, and are ASCII/hyphen-only and length-bounded
- pm2 ecosystem configuration is written by the machine to a temporary JSON file — never built from interpolated shell strings
- Every mutating deployment/operations action is guarded by a per-company file lock (stale locks reclaimed only after a timeout + dead-PID check)
- `/ops` actions are restricted to `status`, `health`, `logs`, `restart`, `rollback`, `stop`, `start`; `ssl`, `domain`, and `deploy` are always rejected from chat (CLI only)
- Telegram operators must appear in `TELEGRAM_ADMIN_IDS` (empty allowlist denies every Telegram ops action by default); CLI operators are implicitly trusted (local shell access)
- Mutating ops actions require confirmation: Telegram issues a single-use, 5-minute token tied to the specific admin + company + action; CLI requires an explicit `--yes`
- Every ops action (authorized or not) is written to an append-only audit trail under `.factory/operations-audit/`
- Deployment/health logs are sanitized with the same secret-redaction used elsewhere before being surfaced to any channel
- Public exposure (reverse proxy + TLS) is never auto-configured — it requires `DEPLOYMENT_PUBLIC_ENABLED`, `NGINX_CONFIG_ROOT`, `DEPLOYMENT_DOMAIN_PATTERN`, and a configured SSL provider; the deploy/predeploy paths throw `DEPLOYMENT_PUBLIC_NOT_CONFIGURED` otherwise
- `DEMO_AUTO_DEPLOY` only auto-deploys when the requester is CLI or a verified Telegram admin, and only after the pre-deployment gate passes

Phase 6 deploys a quality-accepted release to a local port. Public exposure still requires an operator to configure a reverse proxy, a domain pattern, and a TLS provider.

See also [GENERATED-APP-SECURITY](./GENERATED-APP-SECURITY.md), [QUALITY-ACCEPTANCE](./QUALITY-ACCEPTANCE.md), and [DEPLOYMENT](./DEPLOYMENT.md).
