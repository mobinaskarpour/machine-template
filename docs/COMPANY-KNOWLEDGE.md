# CompanyKnowledge — Phase 1

Schema version: `1.0`

Canonical document validated by Zod + semantic checks.

## Persistence

- `data/projects/<slug>/.factory/knowledge.json`
- `data/memory/companies/<slug>.json`

Both must match `contentHash` after save.

History (previous versions):

- `data/projects/<slug>/.factory/history/knowledge/` (keeps last 5)

## Facts vs inference

- Confirmed items need evidence source IDs
- Inferred items set `inferred: true`
- AI use cases are always inferred recommendations
- Do not invent competitors/customers/revenue

## Confidence / readiness

Deterministic overall confidence from website certainty, authoritative fetches, industry/description/products coverage, inferred ratio, and conflict gaps.

`READY` requires website confidence, fetched official/user source, industry, description, ≥1 product/service, and overall confidence threshold.
