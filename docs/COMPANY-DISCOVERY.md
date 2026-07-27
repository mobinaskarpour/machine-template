# Company Discovery — Phase 1

Pipeline:

```text
/demo <company> [| website]
→ resolve company + DISCOVERY job
→ load existing knowledge
→ search sources (if configured) OR use explicit/existing website
→ rank candidates
→ safe fetch pages
→ deterministic extraction
→ knowledge synthesis
→ semantic validation
→ persist workspace + memory mirrors
→ summary
```

## Commands

```bash
npm run discover -- "Company Name"
npm run discover -- "Company Name" "https://example.com"
```

Telegram:

```text
/demo Company Name
/demo Company Name | https://example.com
```

Without a search provider key, name-only discovery returns `DISCOVERY_NEEDS_INPUT`.

## Stages

RESOLVING_COMPANY → … → DISCOVERY_COMPLETE (see `DISCOVERY_STAGE_PROGRESS`).

Job succeeds only after validated dual persistence.
