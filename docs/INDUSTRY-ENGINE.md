# Industry Engine

Deterministic industry resolution from validated `CompanyKnowledge`.

## Pipeline

```text
CompanyKnowledge
  → IndustryEngine.resolveFromKnowledge
  → selected IndustryPack
  → MasterBuildSpecification
  → Master Prompt
```

## Signals

Weighted matches against pack aliases using:

1. `industry.primary`
2. `industry.secondary`
3. products / services text
4. processes
5. company description
6. pain points

Persian and English aliases are normalized (NFC, ی/ک unification, whitespace compaction).

## Fallback

- Insufficient score → `general` with `requiresReview: true`
- Close top-two scores → `requiresReview: true`
- Alternatives retained for inspection

## Confidence

Raw alias match weights are capped into `[0, 1]`. Resolution is fully deterministic — no LLM required.

## Constraints

Production code must remain company-agnostic. Brand names belong only in tests, fixtures, and docs.
