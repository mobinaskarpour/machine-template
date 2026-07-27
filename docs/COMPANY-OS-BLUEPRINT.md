# Company OS Blueprint

Phase 3 converts validated planning artifacts into an implementation-ready blueprint.

## Pipeline

```text
CompanyKnowledge
→ Industry Resolution
→ MasterBuildSpecification
→ Master Prompt metadata
→ Blueprint builders
→ Semantic validation
→ Dual persistence
→ Blueprint Complete
```

## Source restrictions

Consumes only canonical Phase 1–2 artifacts. Never raw HTML, search payloads, env secrets, or Telegram free text as research input.

## Output

Persisted as:

```text
data/projects/<slug>/.factory/company-os-blueprint.json
data/projects/<slug>/.factory/company-os-blueprint-summary.json
data/memory/blueprints/<slug>.json
```

## Important

Phase 3 generates an implementation-ready Company OS Blueprint. It does not generate source code, build an application, or deploy anything.
