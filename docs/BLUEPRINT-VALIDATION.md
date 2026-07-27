# Blueprint validation

Semantic checks beyond Zod include:

- unique IDs and routes
- safe ASCII routes (no traversal)
- role/permission/entity/KPI references
- workflow states and transitions
- dashboard section/widget integrity
- read-only agent tools
- high-priority traceability
- no secret-like values, raw HTML, or absolute server paths
- no deployment-success claims

Stable error codes: `BLUEPRINT_SOURCE_MISMATCH`, `BLUEPRINT_DUPLICATE_ID`, `BLUEPRINT_DUPLICATE_ROUTE`, `BLUEPRINT_UNSAFE_ROUTE`, `BLUEPRINT_INVALID_*`, `BLUEPRINT_VALIDATION_FAILED`, `BLUEPRINT_MIRROR_MISMATCH`.
