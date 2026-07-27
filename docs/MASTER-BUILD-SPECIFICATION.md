# MasterBuildSpecification

Structured planning artifact combining CompanyKnowledge with an Industry Pack.

## Schema version

`1.0`

## Merge precedence

1. Confirmed company facts override industry defaults
2. Inferred company facts do not silently replace stronger industry definitions
3. Industry defaults fill gaps
4. Every item retains a source label (`CONFIRMED` / `INFERRED` / `INDUSTRY_DEFAULT` / `COMBINED` / …)

## Prioritization

Deterministic relevance scoring from pain points, processes, products, and departments.

Configurable limits (defaults):

- max high-priority dashboards: 8
- max high-priority workflows: 15
- max initial agents: 10
- max initial KPIs: 30

Not every item is HIGH.

## Assumptions & unresolved questions

Missing ERP, sites, channels, quality standards, and similar internal facts become unresolved questions — never fabricated as known facts.

## Readiness

`quality.readyForBlueprintGeneration` requires READY knowledge, non-review industry resolution, no blocking questions, and sufficient specification confidence.

## Persistence

```text
data/projects/<slug>/.factory/master-build-specification.json
data/memory/specifications/<slug>.json
data/projects/<slug>/.factory/history/specifications/
```
