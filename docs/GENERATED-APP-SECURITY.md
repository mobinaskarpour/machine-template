# Generated App Security

`scanGeneratedAppSecurity` walks the staging tree (skipping `node_modules` / `.next` / `.git`) and flags high-severity patterns before release promotion.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## High-severity examples

- Env secret assignments (`API_KEY=`, `PASSWORD=`, …)
- `child_process` / `eval` / `new Function` / `dangerouslySetInnerHTML`
- PM2 / Docker / `vercel deploy` operational commands
- curl|sh style remote execution
- Cryptominers, reverse shells, tunnel tools (ngrok, …)

Any high finding → `GENERATION_SECURITY_FAILED` → no promote.

## Complementary controls

- Template copy excludes `.env*` and rejects symlinks
- Dependency allowlist / forbidden packages
- SafeCommandRunner absolute npm path + env allowlist
- Path isolation under `PROJECTS_ROOT` (no `..` in job/generation ids)

## Non-goals (Phase 4)

- No public exposure, TLS termination, or production auth
- Demo role simulation only — not production authentication
