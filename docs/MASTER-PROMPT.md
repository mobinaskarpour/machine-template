# Master Prompt

Deterministic prompt artifact for future blueprint generation.

## Version

Prompt version `1.0` · artifact schema `1.0`

## Inputs (canonical only)

```text
CompanyKnowledge + MasterBuildSpecification + IndustryPack
```

Never ingest raw HTML, search payloads, secrets, or absolute server paths.

## Sections (stable order)

```text
MACHINE_CONTEXT
COMPANY_IDENTITY
EVIDENCE_QUALITY
INDUSTRY_CONTEXT
BUSINESS_OBJECTIVES
DEPARTMENTS_AND_ROLES
DASHBOARDS
KPIS
WORKFLOWS
AI_AGENTS
DATA_MODEL
BRANDING_AND_LANGUAGE
UX_REQUIREMENTS
INTEGRATIONS
ASSUMPTIONS
UNRESOLVED_QUESTIONS
SAFETY_BOUNDARIES
FUTURE_GENERATION_REQUIREMENTS
QUALITY_GATES
OUTPUT_CONTRACT
```

## Anti-fabrication

The prompt states that CompanyKnowledge and MasterBuildSpecification are canonical, industry defaults are not confirmed facts, and unsupported private metrics must not be invented.

## Hashes

- Section `contentHash` for each section body
- Artifact `contentHash` for the full prompt
- `specificationHash` links the prompt to the current specification

## Persistence

```text
data/projects/<slug>/.factory/master-prompt.json
data/projects/<slug>/.factory/master-prompt.txt
data/projects/<slug>/.factory/history/prompts/
```
