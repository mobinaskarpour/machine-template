# Generated App Validation

Validators run on the staging app **before** install/build promotion gates complete. Build steps are additional gates.

Phase 4 generates and build-verifies an application release. It does not deploy or expose that application publicly.

## Source policy

`validateGeneratedSource` — paths must match allowlist prefixes; forbidden basenames (`.env`, Dockerfiles, PM2 configs); file count / total bytes within plan policies.

## Dependency policy

`validateDependencyPolicy` — `package.json` dependencies ⊆ allowlist; forbidden packages (pm2, dockerode, puppeteer, ngrok, …); lifecycle scripts blocked when `allowPostinstallScripts` is false.

## Routes

`validateRoutes` — navigation / dashboard / module routes start with `/`, no `..` or absolute URLs, unique within each surface.

## Blueprint coverage

`validateBlueprintCoverage` — every expected dashboard, module, workflow, agent, entity, and role id from the GenerationPlan appears in `blueprint-runtime.json`.

## Mock data integrity

`validateMockDataIntegrity` / `validateInternalReferences` — foreign-key style refs resolve; quantities non-negative; dates within the mock plan time range.

## Build gates

Via `GeneratedAppBuildService` + `SafeCommandRunner`:

1. `npm ci` / `npm install`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`

Any failure maps to `GENERATION_*_FAILED` and blocks promotion.

## Security

See [GENERATED-APP-SECURITY](./GENERATED-APP-SECURITY.md).
