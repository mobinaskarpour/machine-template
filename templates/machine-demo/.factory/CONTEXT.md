# Demo context — THE MACHINE Template

## Product

Reusable Persian RTL executive AI OS template. Default industry pack: **construction**.

Brand and narrative come from `demo.config.json` + `config/` + `branding/` + `industries/`.

## Constraints for Codex

- Do **not** commit, push, or deploy. The factory control-plane owns git + deploy.
- Prefer editing: `demo.config.json`, `branding/`, `config/`, `industries/`, `mock-data/`.
- Do **not** redesign UI components under `src/components/` unless required for a bugfix.
- Preserve RTL unless the task explicitly changes locale.
- Theme tokens live in `config/theme.json` (injected at runtime).
- After changes, ensure `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

## Key layout

See `documentation/PROJECT_STRUCTURE.md`.

## Must not break

- App Router routes and AppShell navigation
- Health endpoint `/api/health`
- Docker standalone build (`output: "standalone"`)
- JSON config loaders in `src/config/*` and `src/mock/*`
