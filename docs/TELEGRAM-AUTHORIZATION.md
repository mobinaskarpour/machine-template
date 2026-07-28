# Telegram Authorization

Runtime and deployment mutations require Telegram admin authorization.

## Configuration

```env
TELEGRAM_ADMIN_IDS=
```

Parse as an explicit numeric allowlist. Reject missing or malformed IDs for mutation actions. Never use Telegram usernames as the sole authorization identifier.

## Policy

- `/ops` mutation actions (`restart`, `rollback`, `stop`, `start`) require admin authorization
- Status/health/logs visibility must not leak unrelated companies
- Unauthorized requests create security audit events
- Never log bot tokens

See [OPERATIONS](./OPERATIONS.md).
