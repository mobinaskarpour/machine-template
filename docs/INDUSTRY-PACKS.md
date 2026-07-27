# Industry Packs

Validated `IndustryPack` schema version `1.0`.

## Required packs

| Pack | Purpose |
| ---- | ------- |
| general | Fallback / ambiguous companies |
| manufacturing | Discrete & process manufacturing, including food factories |
| construction | Construction / contracting |
| real-estate | Property development & leasing |
| medical | Clinical / healthcare (approval & privacy constraints) |
| education | Schools / training |
| legal | Legal services (human review constraints) |
| oil-gas | Upstream / midstream / downstream |
| steel | Metals production |
| banking | Financial services (audit & approval constraints) |

## Manufacturing notes

Manufacturing is the primary Phase 2 pack for industrial producers (including food/pasta manufacturers). Food-specific behavior comes from:

```text
CompanyKnowledge + manufacturing pack + merge/prioritization
```

There is no separate top-level `food` pack in Phase 2.

## Reference integrity

Pack load validates unique IDs and references (roles→departments, dashboards→KPIs, entity relationships).

Agents are planning records only (`READ_ONLY` | `SUGGEST` | `APPROVAL_REQUIRED`) and never execute.
