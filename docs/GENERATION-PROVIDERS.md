# Generation Providers

Providers implement `CodeGenerationProvider` and write into an already-copied staging app directory.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## DETERMINISTIC_TEMPLATE (default)

`DeterministicTemplateProvider` — Phase 4 success path.

Assumes `templates/generated-company-os-v1` was copied into staging. Writes:

- `src/data/blueprint-runtime.json` — navigation, dashboards, modules, workflows, agents, roles, entities
- `src/data/mock-data.json` — seeded mock records
- `src/app/globals.css` — brand CSS variable patch
- `README.md` — generated banner

No LLM calls. Deterministic for a given blueprint + plan hashes.

## CODEX_CLI (optional)

`CodexCliGenerationProvider` — experimental / not the Phase 4 default success path. May wrap or fall back; production `/demo` and `npm run generate` use the deterministic provider unless explicitly overridden.

## FIXTURE

Test / harness provider used by stubs and fixture chains.

## Injection

`createAppServices` constructs `ApplicationGenerationService` with `DeterministicTemplateProvider` by default. Tests may override the whole generation service (e.g. `createStubGenerationService`) or pass a custom `provider` / `runner` when constructing the service directly.
