# Security — Phase 0–4

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

See also [GENERATED-APP-SECURITY](./GENERATED-APP-SECURITY.md).
