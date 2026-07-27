# Security — Phase 0

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

## Command execution

- Direct commands: `spawn(absoluteExecutable, args)` with `shell: false`.
- Bash: only `spawn("/bin/bash", ["-lc", command])`.
- Never `spawn("bash")`.
- Child env is an explicit allowlist (secrets excluded).
- Timeouts kill the child process.
- Telegram ops text never reaches the shell in Phase 0.

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
