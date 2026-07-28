# Operations (Phase 6)

`/ops <company> <action>` in Telegram, or `npm run deployment:<action> -- "<company>"` from the CLI, drive the same `OperationsService`.

## Actions

| Action | Mutating? | Available in chat? |
|--------|-----------|---------------------|
| `status` | No | Yes |
| `health` | No | Yes |
| `logs` | No | Yes |
| `restart` | Yes | Yes (admin only) |
| `rollback` | Yes | Yes (admin only) |
| `stop` | Yes | Yes (admin only) |
| `start` | Yes | Yes (admin only) |
| `ssl` | Yes | **No** — CLI only |
| `domain` | Yes | **No** — CLI only |
| `deploy` | Yes | **No** — CLI only |

`ssl`, `domain`, and `deploy` always throw `OPS_ACTION_NOT_ALLOWED` from Telegram, regardless of admin status — they touch public exposure / infrastructure and are deliberately restricted to a local operator with shell access.

## Authorization

- **CLI**: implicitly trusted (equivalent to local shell access already required to run `npm run ...`).
- **Telegram**: the sender's numeric user ID must appear in `TELEGRAM_ADMIN_IDS` (comma-separated in `.env`). An empty list denies every mutating Telegram action. Non-mutating actions (`status`/`health`/`logs`) are readable by any Telegram user who can already reach the bot.

## Confirmation for mutating actions

Mutating actions require a second explicit step so a single mistyped chat message can't restart or roll back a live deployment:

- **Telegram**: the first `/ops <company> restart` (etc.) call from an authorized admin returns a short-lived confirmation token. The admin replies with `/ops <company> restart confirm=<token>` within 5 minutes to actually execute it. Tokens are single-use and bound to the exact admin + company + action triple — they cannot be replayed or reused for a different action.
- **CLI**: pass `--yes` to skip the interactive prompt (there is no chat round-trip to confirm against, so `--yes` is the CLI's explicit confirmation).

Confirmation tokens are stored in `data/memory/ops-confirmations.json` and expire automatically; expired or mismatched tokens fail closed with `OPS_CONFIRMATION_INVALID` / `OPS_CONFIRMATION_REQUIRED`.

## Audit trail

Every `/ops` invocation — authorized or rejected — is appended to `.factory/operations-audit/` under the target company's project directory, recording the actor (channel + Telegram user ID or `cli`), action, timestamp, and outcome. Nothing here overwrites prior entries.

## Auto-deploy on demo

When `DEMO_AUTO_DEPLOY=true`, a successful `/demo` run automatically attempts `predeploy` + `deploy` immediately after quality acceptance — but only when the requester is the CLI or a verified Telegram admin. Any other requester, or a failing pre-deployment gate, leaves the release generated-and-accepted-but-not-deployed with a clear message explaining why, and how to deploy it manually.

See [DEPLOYMENT](./DEPLOYMENT.md) for what each action actually does under the hood.
