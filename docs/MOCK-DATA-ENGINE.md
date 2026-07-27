# Mock Data Engine

Deterministic mock records for the generated Company OS demo UI.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## API

`generateMockDataBundle(blueprint, seed)` → `MockDataBundle` with:

- `records` keyed by entity id
- `totals`, `chartSeries`, locale/currency metadata
- `seed` echoed for reproducibility

Same seed → identical JSON. Different seed → different records.

## Behavior

- Volumes from `blueprint.mockDataPlan.entityVolumes` (capped)
- Synthetic person names from fixed FA/EN first/last pools — **not** real people from research
- Do not use company brand strings (e.g. “Zar”) as customer personal names
- Internal references validated (`customerId`, order lines, inventory FKs, …)

## Validation

`validateInternalReferences` + `validateMockDataIntegrity` run during generation before build.

## Persistence

Written to staging as `src/data/mock-data.json` by `DeterministicTemplateProvider`.
